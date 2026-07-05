// Tasks API — same read + write pattern as the other modules. Because focus_week
// and status drive the Command Center's "this week's focus", every write also
// revalidates "/" so the dashboard stays in sync.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTab, appendRow, updateRowById, deleteRowById } from "@/lib/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAB = "Tasks";
const FIELDS = ["task", "related", "owner", "status", "due", "focus_week", "notes", "entity"] as const;

function revalidate() {
  revalidatePath("/tasks");
  revalidatePath("/"); // this-week focus panel reads focus_week + status
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

export async function GET() {
  try {
    return NextResponse.json({ ok: true, rows: await readTab(TAB) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body");
  const task = String(body.task ?? "").trim();
  if (!task) return bad("task is required");

  const obj: Record<string, string> = { task };
  for (const f of FIELDS) if (f !== "task") obj[f] = String(body[f] ?? "").trim();

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
  for (const f of FIELDS) if (f in body) patch[f] = String(body[f] ?? "").trim();
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
