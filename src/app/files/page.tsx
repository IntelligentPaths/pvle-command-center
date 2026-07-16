import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder, Home, ChevronRight, LayoutDashboard } from "lucide-react";
import "../command-center.css"; // cockpit shell: .cc, .panel, .eye, .serif, .navlink
import "./files.css";
import { listFolder, getFolderMeta, isNltFolder, FOLDER_MIME, type DriveItem } from "@/lib/drive";
import FilesPanel from "@/components/FilesPanel";

// Reads Drive fresh at request time (never prerendered; needs runtime credentials). Not
// cached, so an upload/delete + router.refresh() shows the change immediately.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROOT = process.env.GOOGLE_DRIVE_FOLDER_ID!;

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string | string[] }>;
}) {
  const sp = await searchParams;
  const folderParam = Array.isArray(sp.folder) ? sp.folder[0] : sp.folder;
  const folderId = folderParam || ROOT;
  const isRoot = folderId === ROOT;

  // Meta first — for the breadcrumb name and to guard the NLT folder. The internal
  // NLT folder must never render, so reject a direct ?folder=<NLT id> (→ root).
  // (redirect() throws, so it is called outside the try/catch, never swallowed.)
  let currentName = isRoot ? "Pura Vida Legacy Ecosystem" : "Folder";
  if (!isRoot) {
    let name: string | null = null;
    try {
      name = (await getFolderMeta(folderId)).name || null;
    } catch {
      name = null;
    }
    if (name && isNltFolder(name)) redirect("/files");
    if (name) currentName = name;
  }

  let items: DriveItem[] = [];
  let error: string | null = null;
  try {
    items = await listFolder(folderId);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const folders = items.filter((f) => f.mimeType === FOLDER_MIME);
  const files = items.filter((f) => f.mimeType !== FOLDER_MIME);

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Files</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Files</h1>
          <div className="crumbs">
            {isRoot ? (
              <span className="crumb current">
                <Folder size={12} /> Ecosystem root
              </span>
            ) : (
              <>
                <Link href="/files" className="crumb">
                  <Home size={12} /> Ecosystem root
                </Link>
                <ChevronRight size={12} className="crumb-sep" />
                <span className="crumb current">{currentName}</span>
              </>
            )}
          </div>
        </div>
        <div className="hqR">
          <Link href="/" className="navlink">
            <LayoutDashboard size={15} /> Command Center
          </Link>
        </div>
      </div>

      <div className="panel cc-fade" style={{ overflow: "hidden" }}>
        {error ? (
          <div className="empty" style={{ padding: 16 }}>Couldn&apos;t load this folder — {error}</div>
        ) : (
          <FilesPanel folders={folders} files={files} folderId={folderId} />
        )}
      </div>
    </div>
  );
}
