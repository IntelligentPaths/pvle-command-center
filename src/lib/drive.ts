// Server-only Drive access. Uses the impersonated getDrive() client (full `drive` scope)
// — the same keyless auth path as Sheets. Reads (Files browser) + writes (attachment
// upload/delete/download). Attachment files are OWNED BY THE SERVICE ACCOUNT and stored
// under /attachments/{module}/ in the Command Center folder.
import { Readable } from "node:stream";
import { getDrive } from "./google";

export const FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;
const ATTACHMENTS_FOLDER = "attachments";

// NLT (the internal "Trust & IP Holder") must never appear in any list, per the
// CLAUDE.md rule. Filter it out of every Drive listing at the data layer, and let
// callers reject a direct request for the NLT folder itself.
const NLT_NAME = /\bNLT\b/i;

export function isNltFolder(name: string): boolean {
  return NLT_NAME.test(name);
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
}

// List the children of a folder: folders first, then files, each A→Z.
export async function listFolder(folderId: string): Promise<DriveItem[]> {
  const drive = await getDrive();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,webViewLink,iconLink,modifiedTime)",
    orderBy: "folder,name",
    pageSize: 200,
  });
  return (res.data.files ?? [])
    .filter((f) => !NLT_NAME.test(f.name ?? ""))
    .map((f) => ({
    id: f.id ?? "",
    name: f.name ?? "(untitled)",
    mimeType: f.mimeType ?? "",
    webViewLink: f.webViewLink ?? undefined,
    iconLink: f.iconLink ?? undefined,
    modifiedTime: f.modifiedTime ?? undefined,
  }));
}

// Metadata for a single file/folder — used for the breadcrumb's current name.
export async function getFolderMeta(folderId: string): Promise<{ id: string; name: string; mimeType: string }> {
  const drive = await getDrive();
  const res = await drive.files.get({ fileId: folderId, fields: "id,name,mimeType" });
  return {
    id: res.data.id ?? folderId,
    name: res.data.name ?? "",
    mimeType: res.data.mimeType ?? "",
  };
}

// --- attachment writes (SA-owned files under /attachments/{module}/) ---

// Cache resolved folder ids per server instance (folder ids are stable once created).
const folderCache = new Map<string, string>();

// Find a folder named `name` directly under `parentId`, or create it. Returns its id.
async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const cacheKey = `${parentId}/${name}`;
  const cached = folderCache.get(cacheKey);
  if (cached) return cached;
  const drive = await getDrive();
  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name='${safeName}' and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: "files(id,name)",
    pageSize: 1,
  });
  let id = res.data.files?.[0]?.id ?? undefined;
  if (!id) {
    const created = await drive.files.create({
      requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
      fields: "id",
    });
    id = created.data.id ?? undefined;
  }
  if (!id) throw new Error(`Could not find or create folder "${name}"`);
  folderCache.set(cacheKey, id);
  return id;
}

// Ensure /attachments/{module}/ exists under the Command Center root; returns its id.
export async function ensureAttachmentFolder(module: string): Promise<string> {
  const attachments = await findOrCreateFolder(ATTACHMENTS_FOLDER, ROOT_FOLDER_ID);
  const safeModule = module.replace(/[^a-z0-9_-]/gi, "") || "misc";
  return findOrCreateFolder(safeModule, attachments);
}

// Upload a file (SA-owned) into a folder. Returns the new Drive file's metadata.
export async function uploadFile(params: {
  folderId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ id: string; webViewLink: string; size: number; mimeType: string; name: string }> {
  const drive = await getDrive();
  const res = await drive.files.create({
    requestBody: { name: params.filename, parents: [params.folderId] },
    media: {
      mimeType: params.mimeType || "application/octet-stream",
      body: Readable.from(params.buffer),
    },
    fields: "id,webViewLink,size,mimeType,name",
  });
  return {
    id: res.data.id ?? "",
    webViewLink: res.data.webViewLink ?? "",
    size: Number(res.data.size ?? params.buffer.length),
    mimeType: res.data.mimeType ?? params.mimeType,
    name: res.data.name ?? params.filename,
  };
}

// Delete a Drive file (permanent).
export async function deleteFile(fileId: string): Promise<void> {
  const drive = await getDrive();
  await drive.files.delete({ fileId });
}

// Fetch a file's bytes + metadata for streaming a download (files are ≤10 MB).
export async function getFileDownload(
  fileId: string,
): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  const drive = await getDrive();
  const meta = await drive.files.get({ fileId, fields: "name,mimeType" });
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  return {
    buffer: Buffer.from(res.data as ArrayBuffer),
    mimeType: meta.data.mimeType ?? "application/octet-stream",
    name: meta.data.name ?? "download",
  };
}
