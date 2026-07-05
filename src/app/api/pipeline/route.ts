// Pipeline API — the read + write pattern the other modules will copy.
// Server-side only; all Google calls go through the impersonated client.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTab, appendRow, updateRowById, deleteRowById } from "@/lib/sheets";
import { STAGES, isStage } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAB = "Pipeline";

function sanitizeAmount(v: unknown): string {
  if (v == null || v === "") return "";
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? String(n) : "";
}

// Keep the Command Center funding meter (and this board) in sync after writes.
function revalidate() {
  revalidatePath("/");
  revalidatePath("/pipeline");
}

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const rows = await readTab(TAB);
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body");

  const name = String(body.name ?? "").trim();
  if (!name) return bad("name is required");
  const stage = String(body.stage ?? "Researching");
  if (!isStage(stage)) return bad(`stage must be one of: ${STAGES.join(", ")}`);

  const obj = {
    name,
    funder: String(body.funder ?? "").trim(),
    entity: String(body.entity ?? "").trim(),
    type: String(body.type ?? "").trim(),
    amount: sanitizeAmount(body.amount),
    stage,
    owner: String(body.owner ?? "").trim(),
    decision_date: String(body.decision_date ?? "").trim(),
    notes: String(body.notes ?? "").trim(),
  };

  try {
    const row = await appendRow(TAB, obj);
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
  for (const f of ["name", "funder", "entity", "type", "owner", "decision_date", "notes"] as const) {
    if (f in body) patch[f] = String(body[f] ?? "").trim();
  }
  if ("amount" in body) patch.amount = sanitizeAmount(body.amount);
  if ("stage" in body) {
    const stage = String(body.stage);
    if (!isStage(stage)) return bad(`stage must be one of: ${STAGES.join(", ")}`);
    patch.stage = stage;
  }
  if (Object.keys(patch).length === 0) return bad("no fields to update");

  try {
    const row = await updateRowById(TAB, id, patch);
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
    const deleted = await deleteRowById(TAB, id);
    if (!deleted) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    revalidate();
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
