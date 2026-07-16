// Attachments — files stored in Drive (SA-owned), indexed in the Attachments tab.
// Relational by id: a row references its parent by (parent_type, parent_id); the Drive
// file by drive_file_id. Names/sizes are shown from the row, resolved at read time.

export interface Attachment {
  id: string;
  parent_type: string; // opportunity | contact | program | contract | ...
  parent_id: string;
  drive_file_id: string;
  filename: string;
  mime: string;
  size: string; // bytes, as a string (Sheet cells are strings)
  uploaded_by: string; // signed-in user's email
  created_at: string;
}

// Which detail surface an attachments block lives on → the /attachments/{module}/ subfolder.
export type ParentType = "opportunity" | "contact" | "program";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// Accepted file types (by extension — browser MIME for csv/docx/xlsx is unreliable).
export const ALLOWED_EXTENSIONS = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg", "csv"] as const;
export const ACCEPT_ATTR = ".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv";

export function extOf(filename: string): string {
  const m = /\.([a-z0-9]+)$/i.exec((filename || "").trim());
  return m ? m[1].toLowerCase() : "";
}

export function isAllowedFile(filename: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extOf(filename));
}

// "1.2 MB" / "840 KB" / "12 B"
export function formatSize(bytes: number | string): string {
  const n = typeof bytes === "number" ? bytes : parseInt(String(bytes || "0"), 10) || 0;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
