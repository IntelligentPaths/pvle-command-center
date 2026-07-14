// Contacts CSV import — dedupes incoming rows against existing contacts by email
// (case-insensitive), batch-appends the rest. Imported contacts default entity to
// "PVALD" and are tagged source "wix-import". Client parses/maps the CSV; this endpoint
// is the authoritative dedupe + write.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTab, appendRows, ensureColumns } from "@/lib/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAB = "Contacts";
const IMPORT_ENTITY = "PVALD";
const IMPORT_SOURCE = "wix-import";

interface IncomingRow {
  name?: string;
  email?: string;
  phone?: string;
  org?: string;
  role?: string;
  notes?: string;
}

const clean = (v: unknown) => String(v ?? "").trim();
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function POST(req: Request) {
  let body: { rows?: IncomingRow[] } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const rows = Array.isArray(body?.rows) ? (body!.rows as IncomingRow[]) : null;
  if (!rows) return NextResponse.json({ ok: false, error: "rows[] required" }, { status: 400 });

  try {
    // The Contacts tab must be able to hold a source tag.
    await ensureColumns(TAB, ["source"]);

    // Existing emails → dedupe target (case-insensitive). Also dedupes within the batch.
    const existing = await readTab(TAB);
    const seen = new Set(existing.map((c) => clean(c.email).toLowerCase()).filter(Boolean));

    const toAppend: Record<string, string>[] = [];
    let skipped = 0;
    for (const r of rows) {
      const name = clean(r.name);
      const email = clean(r.email);
      if (!name && !email) continue; // junk / empty
      const key = email.toLowerCase();
      if (key && seen.has(key)) {
        skipped++;
        continue;
      }
      if (key) seen.add(key);
      toAppend.push({
        name: name || email,
        role: clean(r.role),
        org: clean(r.org),
        type: "",
        email,
        phone: clean(r.phone),
        entity: IMPORT_ENTITY,
        notes: clean(r.notes),
        source: IMPORT_SOURCE,
      });
    }

    const created = await appendRows(TAB, toAppend);
    revalidatePath("/contacts");
    return NextResponse.json({ ok: true, imported: created, importedCount: created.length, skipped });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}
