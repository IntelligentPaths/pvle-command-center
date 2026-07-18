// Enrollments API — the join table between Programs and Contacts. Referential by id only
// (program_id / contact_id); names are resolved at read time elsewhere. Same door for the
// program roster (2.3) and the contact-side enroll (2.4).
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTab, appendRow, appendRows, updateRowById, deleteRowById, newId } from "@/lib/sheets";
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

// Shared enrollment-row builder — single + bulk produce identical row shapes.
function enrollmentRecord(
  program_id: string,
  contact_id: string,
  opts: { status?: string; start_date?: string; end_date?: string; rate_override?: string; notes?: string } = {},
): Record<string, string> {
  return {
    id: newId("enr_"),
    program_id,
    contact_id,
    status: (opts.status ?? "active").trim() || "active",
    start_date: opts.start_date ?? "",
    end_date: opts.end_date ?? "",
    rate_override: opts.rate_override ?? "",
    notes: opts.notes ?? "",
    created_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body");
  const program_id = String(body.program_id ?? "").trim();
  if (!program_id) return bad("program_id is required");

  // --- Bulk enroll: contact_ids[] → ONE batch append, skipping already-active enrollees. ---
  if (Array.isArray(body.contact_ids)) {
    const ids = [
      ...new Set((body.contact_ids as unknown[]).map((x) => String(x ?? "").trim()).filter(Boolean)),
    ];
    if (ids.length === 0) return bad("contact_ids is empty");
    try {
      await ensureRelationalSchema();
      const existing = await readTab(ENROLLMENTS_TAB);
      const active = new Set(
        existing
          .filter((e) => e.program_id === program_id && (e.status || "").toLowerCase() === "active")
          .map((e) => e.contact_id),
      );
      const toAdd = ids.filter((cid) => !active.has(cid));
      const skipped = ids.length - toAdd.length;
      const today = new Date().toISOString().slice(0, 10);
      const rows = await appendRows(
        ENROLLMENTS_TAB,
        toAdd.map((cid, i) => {
          const rec = enrollmentRecord(program_id, cid, { status: "active", start_date: today });
          rec.id = newId("enr_") + i.toString(36); // guarantee unique ids within the batch
          return rec;
        }),
      );
      revalidate();
      return NextResponse.json({ ok: true, rows, skipped }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
    }
  }

  // --- Single enroll (existing behavior). ---
  const contact_id = String(body.contact_id ?? "").trim();
  if (!contact_id) return bad("contact_id is required");
  try {
    await ensureRelationalSchema();
    const row = await appendRow(
      ENROLLMENTS_TAB,
      enrollmentRecord(program_id, contact_id, {
        status: String(body.status ?? "active"),
        start_date: String(body.start_date ?? ""),
        end_date: String(body.end_date ?? ""),
        rate_override: String(body.rate_override ?? ""),
        notes: String(body.notes ?? ""),
      }),
    );
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
