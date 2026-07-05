import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import {
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Presentation,
  Home,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import "../command-center.css"; // cockpit shell: .cc, .panel, .eye, .serif, .navlink
import "./files.css";
import { listFolder, getFolderMeta, isNltFolder, FOLDER_MIME, type DriveItem } from "@/lib/drive";

const ROOT = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// Cache Drive reads for a short window (respect Drive quota), keyed by folder id.
const cachedList = unstable_cache((folderId: string) => listFolder(folderId), ["drive-list"], { revalidate: 60 });
const cachedMeta = unstable_cache((folderId: string) => getFolderMeta(folderId), ["drive-meta"], { revalidate: 60 });

function typeLabel(mime: string): string {
  if (mime === FOLDER_MIME) return "Folder";
  if (mime.includes("google-apps.document")) return "Google Doc";
  if (mime.includes("google-apps.spreadsheet")) return "Google Sheet";
  if (mime.includes("google-apps.presentation")) return "Slides";
  if (mime.includes("google-apps.form")) return "Form";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.includes("wordprocessing") || mime === "application/msword") return "Word";
  if (mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel") return "Excel";
  if (mime.startsWith("text/")) return "Text";
  return "File";
}

function iconFor(mime: string): ReactElement {
  const p = { size: 18 };
  if (mime === FOLDER_MIME) return <Folder {...p} />;
  if (mime.includes("spreadsheet") || mime === "application/vnd.ms-excel") return <FileSpreadsheet {...p} />;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return <Presentation {...p} />;
  if (mime.startsWith("image/")) return <FileImage {...p} />;
  if (mime.startsWith("video/")) return <FileVideo {...p} />;
  if (mime.startsWith("audio/")) return <FileAudio {...p} />;
  if (
    mime.includes("document") ||
    mime.includes("wordprocessing") ||
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime.startsWith("text/")
  ) {
    return <FileText {...p} />;
  }
  return <File {...p} />;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
      name = (await cachedMeta(folderId)).name || null;
    } catch {
      name = null;
    }
    if (name && isNltFolder(name)) redirect("/files");
    if (name) currentName = name;
  }

  let items: DriveItem[] = [];
  let error: string | null = null;
  try {
    items = await cachedList(folderId);
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
        ) : items.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>This folder is empty.</div>
        ) : (
          <>
            {folders.length > 0 && (
              <>
                <div className="fgroup-h">Folders · {folders.length}</div>
                <div className="filelist">
                  {folders.map((f) => (
                    <Link key={f.id} href={`/files?folder=${encodeURIComponent(f.id)}`} className="frow">
                      <span className="ficon folder">{iconFor(f.mimeType)}</span>
                      <span className="fname">{f.name}</span>
                      <span className="ftype">Folder</span>
                      <span className="fmeta">{fmtDate(f.modifiedTime)}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {files.length > 0 && (
              <>
                <div className="fgroup-h">Files · {files.length}</div>
                <div className="filelist">
                  {files.map((f) => (
                    <a
                      key={f.id}
                      href={f.webViewLink ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="frow"
                    >
                      <span className="ficon file">{iconFor(f.mimeType)}</span>
                      <span className="fname">{f.name}</span>
                      <span className="ftype">{typeLabel(f.mimeType)}</span>
                      <span className="fmeta">{fmtDate(f.modifiedTime)}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
