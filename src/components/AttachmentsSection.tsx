"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Upload, Download, Trash2, X } from "lucide-react";
import {
  ACCEPT_ATTR,
  MAX_UPLOAD_BYTES,
  isAllowedFile,
  formatSize,
  type Attachment,
  type ParentType,
} from "@/lib/attachments";
import "./attachments.css";

export default function AttachmentsSection({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/attachments?parent_type=${encodeURIComponent(parentType)}&parent_id=${encodeURIComponent(parentId)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (alive && res.ok && data.ok) setItems(data.rows as Attachment[]);
      } catch {
        /* ignore — surfaces as empty list */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [parentType, parentId]);

  async function upload(file: File | undefined) {
    if (!file || uploading) return;
    setError(null);
    if (!isAllowedFile(file.name)) {
      setError("Unsupported type. Allowed: pdf, docx, xlsx, png, jpg, csv");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File exceeds the 10 MB limit");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("parent_type", parentType);
      fd.append("parent_id", parentId);
      const res = await fetch("/api/attachments", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      setItems((cur) => [data.row as Attachment, ...cur]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(a: Attachment) {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${a.filename}"? This can't be undone.`)) return;
    const idx = items.findIndex((x) => x.id === a.id);
    setItems((cur) => cur.filter((x) => x.id !== a.id));
    try {
      const res = await fetch("/api/attachments", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: a.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setItems((cur) => {
        if (cur.some((x) => x.id === a.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, a);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="att-panel">
      <div className="sect-h">
        <div className="t">
          <Paperclip size={16} color="#F5B531" /> Attachments
        </div>
        <button className="addbtn" disabled={uploading} onClick={() => fileInput.current?.click()}>
          <Upload size={15} /> {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTR}
          style={{ display: "none" }}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>

      <div
        className="att-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files?.[0]);
        }}
        onClick={() => fileInput.current?.click()}
      >
        Drop a file here or click to upload · pdf, docx, xlsx, png, jpg, csv · ≤ 10 MB
      </div>

      {loading ? (
        <div className="empty" style={{ padding: "8px 0 2px" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty" style={{ padding: "8px 0 2px" }}>No attachments yet.</div>
      ) : (
        <div className="att-list">
          {items.map((a) => (
            <div className="att-row" key={a.id}>
              <span className="att-name" title={a.filename}>{a.filename}</span>
              <span className="att-meta">
                {formatSize(a.size)}
                {a.created_at ? ` · ${fmtDate(a.created_at)}` : ""}
                {a.uploaded_by ? ` · ${a.uploaded_by}` : ""}
              </span>
              <a className="att-btn" href={`/api/attachments/${a.id}/download`} aria-label={`Download ${a.filename}`}>
                <Download size={14} />
              </a>
              <button className="att-btn danger" aria-label={`Delete ${a.filename}`} onClick={() => remove(a)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
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
