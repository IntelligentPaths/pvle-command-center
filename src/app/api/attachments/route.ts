// Attachments API. Upload = multipart → Drive (SA-owned, /attachments/{parent_type}/) +
// an Attachments row. Delete removes the Drive file AND the row. Relational by id.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTab, appendRow, deleteRowById, newId } from "@/lib/sheets";
import { ensureRelationalSchema, ATTACHMENTS_TAB } from "@/lib/schema";
import { ensureAttachmentFolder, uploadFile, deleteFile } from "@/lib/drive";
import { MAX_UPLOAD_BYTES, isAllowedFile } from "@/lib/attachments";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (error: string) => NextResponse.json({ ok: false, error }, { status: 400 });
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function revalidate(pt: string, pid: string) {
  if (pt === "program") revalidatePath(`/programs/${pid}`);
  else if (pt === "contact") revalidatePath(`/contacts/${pid}`);
  else if (pt === "opportunity") revalidatePath("/pipeline");
}

export async function GET(req: Request) {
  try {
    await ensureRelationalSchema();
    const rows = await readTab(ATTACHMENTS_TAB);
    const { searchParams } = new URL(req.url);
    const pt = searchParams.get("parent_type");
    const pid = searchParams.get("parent_id");
    const filtered = rows
      .filter((r) => (!pt || r.parent_type === pt) && (!pid || r.parent_id === pid))
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")); // newest first
    return NextResponse.json({ ok: true, rows: filtered });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Expected multipart/form-data");
  }
  const file = form.get("file");
  const parent_type = String(form.get("parent_type") ?? "").trim();
  const parent_id = String(form.get("parent_id") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) return bad("file is required");
  if (!parent_type) return bad("parent_type is required");
  if (!parent_id) return bad("parent_id is required");
  if (!isAllowedFile(file.name)) return bad("Unsupported type. Allowed: pdf, docx, xlsx, png, jpg, csv");
  if (file.size > MAX_UPLOAD_BYTES) return bad("File exceeds the 10 MB limit");

  try {
    const session = await auth();
    const uploaded_by = session?.user?.email ?? "";

    await ensureRelationalSchema();
    const folderId = await ensureAttachmentFolder(parent_type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const up = await uploadFile({ folderId, filename: file.name, mimeType: file.type, buffer });

    const row = await appendRow(ATTACHMENTS_TAB, {
      id: newId("att_"),
      parent_type,
      parent_id,
      drive_file_id: up.id,
      filename: up.name,
      mime: up.mimeType,
      size: String(up.size),
      uploaded_by,
      created_at: new Date().toISOString(),
    });
    revalidate(parent_type, parent_id);
    return NextResponse.json({ ok: true, row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("Invalid JSON body");
  }
  const id = String(body?.id ?? "").trim();
  if (!id) return bad("id is required");

  try {
    await ensureRelationalSchema();
    const rows = await readTab(ATTACHMENTS_TAB);
    const row = rows.find((r) => r.id === id);
    if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    // Best-effort delete of the Drive file, then remove the row either way.
    if (row.drive_file_id) {
      try {
        await deleteFile(row.drive_file_id);
      } catch {
        // file may already be gone — still remove the index row
      }
    }
    await deleteRowById(ATTACHMENTS_TAB, id);
    revalidate(row.parent_type, row.parent_id);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}
