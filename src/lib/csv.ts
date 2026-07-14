// Dependency-free CSV parsing + Wix-contact field mapping, shared by the import UI.
//
// parseCsv is RFC-4180-ish: handles a UTF-8 BOM, CRLF/LF line endings, quoted fields
// with embedded commas/newlines, escaped quotes (""), and drops fully-empty rows.

export function parseCsv(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip UTF-8 BOM

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const n = text.length;

  for (let i = 0; i < n; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // ignore; a following \n ends the row (handles CRLF)
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop rows where every cell is blank.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// The logical target fields the importer maps CSV columns onto. `name` is assembled from
// firstName + lastName (or a full-name column) at build time. Aliases auto-map common
// Wix / spreadsheet export headers.
export interface ImportField {
  key: "firstName" | "lastName" | "fullName" | "email" | "phone" | "org" | "role" | "notes";
  label: string;
  aliases: string[];
}

export const IMPORT_FIELDS: ImportField[] = [
  { key: "firstName", label: "First name", aliases: ["firstname", "first", "givenname"] },
  { key: "lastName", label: "Last name", aliases: ["lastname", "last", "surname", "familyname"] },
  { key: "fullName", label: "Full name", aliases: ["name", "fullname", "contactname", "displayname"] },
  { key: "email", label: "Email", aliases: ["email", "emailaddress", "email address", "e-mail", "mail"] },
  { key: "phone", label: "Phone", aliases: ["phone", "phonenumber", "mobile", "tel", "telephone", "cell"] },
  { key: "org", label: "Organization", aliases: ["company", "organization", "organisation", "org", "business"] },
  { key: "role", label: "Role / title", aliases: ["role", "title", "jobtitle", "position"] },
  { key: "notes", label: "Notes", aliases: ["notes", "note", "message", "comments", "comment", "subject"] },
];

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

// Auto-map each logical field to the first CSV header whose normalized form matches an
// alias. Returns { fieldKey: headerIndex } (headerIndex = -1 when unmapped).
export function autoMap(headers: string[]): Record<string, number> {
  const normed = headers.map(norm);
  const map: Record<string, number> = {};
  for (const f of IMPORT_FIELDS) {
    map[f.key] = normed.findIndex((h) => f.aliases.some((a) => h === norm(a)));
  }
  return map;
}

// A contact assembled from a CSV row via the current mapping. entity/source/type are
// applied by the importer, not mapped from the CSV.
export interface MappedContact {
  name: string;
  email: string;
  phone: string;
  org: string;
  role: string;
  notes: string;
}

export function buildContact(row: string[], mapping: Record<string, number>): MappedContact {
  const at = (key: string) => {
    const idx = mapping[key];
    return idx != null && idx >= 0 ? (row[idx] ?? "").trim() : "";
  };
  const full = at("fullName");
  const name = full || [at("firstName"), at("lastName")].filter(Boolean).join(" ").trim();
  return {
    name,
    email: at("email"),
    phone: at("phone"),
    org: at("org"),
    role: at("role"),
    notes: at("notes"),
  };
}
