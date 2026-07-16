// Client-safe Drive types + constants — NO server SDK imports, so client components
// (FilesPanel) can use them without pulling googleapis/google-auth-library into the
// browser bundle. The server module src/lib/drive.ts re-exports these.

export const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  ownedByMe?: boolean; // true = owned by the SA (uploaded via the app) → deletable
}
