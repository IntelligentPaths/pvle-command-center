// Enrollments API — the join table between Programs and Contacts. Referential by id only
// (program_id / contact_id); names are resolved at read time elsewhere. Same door for the
// program roster (2.3) and the contact-side enroll (2.4).
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTab, appendRow, updateRowById, deleteRowById, newId } from "@/lib/sheets";
import { ensureRelationalSchema, ENROLLMENTS_TAB } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS = ["program_id", "contact_id", "status", "start_date", "end_date", "rate_override", "notes"] as const;

function revalidate() {
  revalidatePath("/programs");
  revalidatePath("/contacts");
  revalidatePath("/"); // dashboard revenue/enrollment rollup
}

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
const bad = (error: string) => NextResponse.json({ ok: false, error }, { status: 400 });
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(req: Request) {
  try {
    await ensureRelationalSchema();
    const rows = await readTab(ENROLLMENTS_TAB);
    const { searchParams } = new URL(req.url);
    const program = searchParams.get("program_id");
    const contact = searchParams.get("contact_id");
    const filtered = rows.filter(
      (r) => (!program || r.program_id === program) && (!contact || r.contact_id === contact),
    );
    return NextResponse.json({ ok: true, rows: filtered });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body");
  const program_id = String(body.program_id ?? "").trim();
  const contact_id = String(body.contact_id ?? "").trim();
  if (!program_id) return bad("program_id is required");
  if (!contact_id) return bad("contact_id is required");

  const obj: Record<string, string> = {
    id: newId("enr_"),
    program_id,
    contact_id,
    status: String(body.status ?? "active").trim() || "active",
    start_date: String(body.start_date ?? "").trim(),
    end_date: String(body.end_date ?? "").trim(),
    rate_override: String(body.rate_override ?? "").trim(),
    notes: String(body.notes ?? "").trim(),
    created_at: new Date().toISOString(),
  };

  try {
    await ensureRelationalSchema();
    const row = await appendRow(ENROLLMENTS_TAB, obj);
    revalidate();
    return NextResponse.json({ ok: true, row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body");
  const id = String(body.id ?? "").trim();
  if (!id) return bad("id is required");

  const patch: Record<string, string> = {};
  for (const f of FIELDS) if (f in body) patch[f] = String(body[f] ?? "").trim();
  if (Object.keys(patch).length === 0) return bad("no fields to update");

  try {
    await ensureRelationalSchema();
    const row = await updateRowById(ENROLLMENTS_TAB, id, patch);
    revalidate();
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    const m = msg(e);
    return NextResponse.json({ ok: false, error: m }, { status: /No row with id/.test(m) ? 404 : 500 });
  }
}

export async function DELETE(req: Request) {
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body");
  const id = String(body.id ?? "").trim();
  if (!id) return bad("id is required");

  try {
    await ensureRelationalSchema();
    const deleted = await deleteRowById(ENROLLMENTS_TAB, id);
    if (!deleted) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    revalidate();
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}
