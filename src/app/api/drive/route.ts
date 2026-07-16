// Files-browser Drive actions: upload into the currently-open folder, and delete a file
// the SA owns. Distinct from /api/attachments (which also writes an Attachments row) —
// this is a plain folder upload. Login-gated like all /api/* routes.
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { uploadFile, deleteFile, getFolderMeta, getFileInfo, isNltFolder } from "@/lib/drive";
import { MAX_UPLOAD_BYTES, isAllowedFile } from "@/lib/attachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Files page reads Drive uncached; this + the client router.refresh() shows changes.
function refreshFiles() {
  revalidatePath("/files");
}

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Expected multipart/form-data");
  }
  const file = form.get("file");
  const folderId = String(form.get("folderId") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) return bad("file is required");
  if (!folderId) return bad("folderId is required");
  if (!isAllowedFile(file.name)) return bad("Unsupported type. Allowed: pdf, docx, xlsx, png, jpg, csv");
  if (file.size > MAX_UPLOAD_BYTES) return bad("File exceeds the 10 MB limit");

  try {
    // Never upload into an internal (NLT) folder.
    const meta = await getFolderMeta(folderId);
    if (isNltFolder(meta.name)) return bad("Not found", 404);

    const buffer = Buffer.from(await file.arrayBuffer());
    const up = await uploadFile({ folderId, filename: file.name, mimeType: file.type, buffer });
    refreshFiles();
    return NextResponse.json({ ok: true, file: up }, { status: 201 });
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
  const fileId = String(body?.fileId ?? "").trim();
  if (!fileId) return bad("fileId is required");

  try {
    const info = await getFileInfo(fileId);
    if (isNltFolder(info.name)) return bad("Not found", 404);
    // Only delete files the app owns — never user-owned files in the folder.
    if (!info.ownedByMe) return bad("This file isn't app-owned and can't be deleted here", 403);
    await deleteFile(fileId);
    refreshFiles();
    return NextResponse.json({ ok: true, id: fileId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}
