// Server-only Drive browser (read-only). Uses the impersonated getDrive() client
// (drive.readonly scope) — the same keyless auth path as Sheets. No uploads.
import { getDrive } from "./google";

export const FOLDER_MIME = "application/vnd.google-apps.folder";

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
