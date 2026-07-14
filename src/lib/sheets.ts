// One tab = one table. Row 1 = headers. Each data row ↔ an object keyed by header.
// Reads + the shared write layer (append / update / delete). Writes are
// last-write-wins, which is acceptable for this internal tool.
import { getSheets } from "./google";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export async function readTab(tab: string): Promise<Record<string, string>[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: tab });
  const [header, ...rows] = res.data.values ?? [];
  if (!header) return [];
  const headers = header.map(String);
  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, (row[i] ?? "").toString()])),
  );
}

// --- write layer (the pattern every module copies) ---

// Short, unique-enough id, e.g. newId("p") → "plw3k9a2x". Prefix keeps ids
// readable and consistent with the tab (Pipeline → "p", Tasks → "t", …).
export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

async function getHeaders(tab: string): Promise<string[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${tab}!1:1` });
  return (res.data.values?.[0] ?? []).map(String);
}

// Column count → A1 letter (11 → "K").
function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Append a row. Object keys map to the tab's header order; missing keys → "".
// Auto-fills `id` (if the tab has one and none was supplied) and `updated_at`.
// Returns the full created row.
export async function appendRow(
  tab: string,
  obj: Record<string, string>,
): Promise<Record<string, string>> {
  const sheets = await getSheets();
  const headers = await getHeaders(tab);
  const record: Record<string, string> = { ...obj };
  if (headers.includes("id") && !record.id) record.id = newId(tab[0].toLowerCase());
  if (headers.includes("updated_at")) record.updated_at = new Date().toISOString();

  const row = headers.map((h) => String(record[h] ?? ""));
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return Object.fromEntries(headers.map((h) => [h, String(record[h] ?? "")]));
}

// Ensure `tab` has each of `columns` as a header, appending any that are missing to the
// end of the header row. Non-destructive: existing headers + data cells are untouched.
// Returns the resulting header list. (Assumes the tab exists — see ensureTab.)
export async function ensureColumns(tab: string, columns: string[]): Promise<string[]> {
  const sheets = await getSheets();
  const headers = await getHeaders(tab);
  const missing = columns.filter((c) => !headers.includes(c));
  if (missing.length === 0) return headers;
  const next = [...headers, ...missing];
  const startCol = colLetter(headers.length + 1);
  const endCol = colLetter(next.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!${startCol}1:${endCol}1`,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });
  return next;
}

// Batch-append many rows in ONE call (import-friendly; avoids per-row quota churn).
// Auto-fills id (per row, if the tab has an id column and the object lacks one) + a
// batch-unique suffix, and updated_at. Returns the created rows (header-keyed).
export async function appendRows(
  tab: string,
  objs: Record<string, string>[],
): Promise<Record<string, string>[]> {
  if (objs.length === 0) return [];
  const sheets = await getSheets();
  const headers = await getHeaders(tab);
  const hasId = headers.includes("id");
  const hasUpdated = headers.includes("updated_at");
  const prefix = tab[0].toLowerCase();
  const stamp = new Date().toISOString();
  const records = objs.map((obj, i) => {
    const rec: Record<string, string> = { ...obj };
    if (hasId && !rec.id) rec.id = newId(prefix) + i.toString(36); // index → unique within the batch
    if (hasUpdated) rec.updated_at = stamp;
    return rec;
  });
  const values = records.map((rec) => headers.map((h) => String(rec[h] ?? "")));
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: tab,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
  return records.map((rec) => Object.fromEntries(headers.map((h) => [h, String(rec[h] ?? "")])));
}

// Update the row whose `id` matches. Only patched columns change; the rest are
// preserved. `updated_at` is refreshed. Throws if the id isn't found.
export async function updateRowById(
  tab: string,
  id: string,
  patch: Record<string, string>,
): Promise<Record<string, string>> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: tab });
  const [header, ...rows] = res.data.values ?? [];
  if (!header) throw new Error(`Tab ${tab} is empty`);
  const headers = header.map(String);
  const idCol = headers.indexOf("id");
  if (idCol === -1) throw new Error(`Tab ${tab} has no "id" column`);
  const rowIdx = rows.findIndex((r) => (r[idCol] ?? "") === id);
  if (rowIdx === -1) throw new Error(`No row with id "${id}" in ${tab}`);

  const existing = rows[rowIdx];
  const rowNumber = rowIdx + 2; // 1-based, + header row

  // Only the patched columns (+ updated_at) are written; every other cell is left
  // untouched, so editing one field never re-writes (or re-coerces) unrelated cells.
  const changes: Record<string, string> = { ...patch };
  if (headers.includes("updated_at")) changes.updated_at = new Date().toISOString();

  const data = Object.keys(changes)
    .filter((k) => headers.includes(k))
    .map((k) => ({
      range: `${tab}!${colLetter(headers.indexOf(k) + 1)}${rowNumber}`,
      values: [[String(changes[k] ?? "")]],
    }));
  if (data.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data },
    });
  }

  // Return the full row as it now stands: untouched cells + the changed ones.
  return Object.fromEntries(
    headers.map((h, i) => [h, h in changes ? String(changes[h] ?? "") : String(existing[i] ?? "")]),
  );
}

// Delete the row whose `id` matches. Returns false if not found.
export async function deleteRowById(tab: string, id: string): Promise<boolean> {
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets(properties(sheetId,title))",
  });
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === tab)?.properties?.sheetId;
  if (sheetId == null) throw new Error(`Tab ${tab} not found`);

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: tab });
  const [header, ...rows] = res.data.values ?? [];
  if (!header) return false;
  const idCol = header.map(String).indexOf("id");
  if (idCol === -1) throw new Error(`Tab ${tab} has no "id" column`);
  const rowIdx = rows.findIndex((r) => (r[idCol] ?? "") === id);
  if (rowIdx === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: rowIdx + 1, endIndex: rowIdx + 2 },
          },
        },
      ],
    },
  });
  return true;
}
