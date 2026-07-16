"use client";

import { useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Presentation,
  Upload,
  Download,
  ExternalLink,
  Trash2,
  Link2,
  X,
} from "lucide-react";
import { ACCEPT_ATTR, MAX_UPLOAD_BYTES, isAllowedFile } from "@/lib/attachments";
import { FOLDER_MIME, type DriveItem } from "@/lib/driveShared";

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

const isGoogleNative = (mime: string) => mime.startsWith("application/vnd.google-apps") && mime !== FOLDER_MIME;

export default function FilesPanel({
  folders,
  files,
  folderId,
  linkByFileId = {},
}: {
  folders: DriveItem[];
  files: DriveItem[];
  folderId: string;
  linkByFileId?: Record<string, { name: string; href: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file || busy) return;
    setError(null);
    if (!isAllowedFile(file.name)) {
      setError("Unsupported type. Allowed: pdf, docx, xlsx, png, jpg, csv");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File exceeds the 10 MB limit");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folderId", folderId);
      const res = await fetch("/api/drive", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      router.refresh(); // re-render the server listing so the new file shows
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(f: DriveItem) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${f.name}"? This can't be undone.`)) return;
    setError(null);
    try {
      const res = await fetch("/api/drive", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileId: f.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const empty = folders.length === 0 && files.length === 0;

  return (
    <div
      className={"files-wrap" + (drag ? " drag" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        if (!drag) setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        upload(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="files-bar">
        <span className="files-hint">
          Drop a file here to upload to this folder · pdf, docx, xlsx, png, jpg, csv · ≤ 10 MB
        </span>
        <button className="addbtn" disabled={busy} onClick={() => input.current?.click()}>
          <Upload size={15} /> {busy ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT_ATTR}
          style={{ display: "none" }}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>

      {empty && <div className="empty" style={{ padding: 16 }}>This folder is empty. Drop a file to upload.</div>}

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
              <div key={f.id} className="frow frow-file">
                <span className="ficon file">{iconFor(f.mimeType)}</span>
                <span className="fname">{f.name}</span>
                <span className="ftype">{typeLabel(f.mimeType)}</span>
                <span className="fmeta">{fmtDate(f.modifiedTime)}</span>
                {linkByFileId[f.id] && (
                  <Link className="flink-chip" href={linkByFileId[f.id].href} title={`Linked to ${linkByFileId[f.id].name}`}>
                    <Link2 size={11} /> {linkByFileId[f.id].name}
                  </Link>
                )}
                <span className="frow-actions">
                  {isGoogleNative(f.mimeType) ? (
                    f.webViewLink && (
                      <a
                        className="fbtn"
                        href={f.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${f.name} in Drive`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )
                  ) : (
                    <a
                      className="fbtn"
                      href={`/api/drive/download?fileId=${encodeURIComponent(f.id)}`}
                      aria-label={`Download ${f.name}`}
                    >
                      <Download size={14} />
                    </a>
                  )}
                  {f.ownedByMe && (
                    <button className="fbtn danger" aria-label={`Delete ${f.name}`} onClick={() => remove(f)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
