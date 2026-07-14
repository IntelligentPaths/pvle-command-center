"use client";

import { useMemo, useRef, useState } from "react";
import { X, Upload, ArrowLeft, CheckCircle2 } from "lucide-react";
import { parseCsv, autoMap, buildContact, IMPORT_FIELDS, type MappedContact } from "@/lib/csv";
import type { Contact } from "@/lib/contacts";

type Step = "upload" | "map" | "preview" | "done";
const SKIP = -1;

// Rows shown in the preview table are capped; all rows still import.
const PREVIEW_LIMIT = 50;

export default function ContactsImport({
  existing,
  onImported,
  onClose,
}: {
  existing: Contact[];
  onImported: (rows: Contact[]) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ importedCount: number; skipped: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Existing emails → client-side dedupe preview (server re-checks authoritatively).
  const existingEmails = useMemo(
    () => new Set(existing.map((c) => (c.email || "").trim().toLowerCase()).filter(Boolean)),
    [existing],
  );

  function ingest(text: string, name: string) {
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setError("That file has no data rows below the header.");
      return;
    }
    const head = rows[0].map((h) => h.trim());
    setHeaders(head);
    setDataRows(rows.slice(1));
    setMapping(autoMap(head));
    setFileName(name);
    setError(null);
    setStep("map");
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Please choose a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result ?? ""), file.name);
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  }

  // Build + dedupe the mapped contacts (memoized off the current mapping).
  const { toImport, duplicates } = useMemo(() => {
    const built = dataRows
      .map((r) => buildContact(r, mapping))
      .filter((c) => c.name || c.email); // drop empty
    const dup: MappedContact[] = [];
    const keep: MappedContact[] = [];
    const seen = new Set<string>();
    for (const c of built) {
      const key = c.email.trim().toLowerCase();
      if (key && (existingEmails.has(key) || seen.has(key))) {
        dup.push(c);
        continue;
      }
      if (key) seen.add(key);
      keep.push(c);
    }
    return { toImport: keep, duplicates: dup };
  }, [dataRows, mapping, existingEmails]);

  const nameMapped = mapping.fullName >= 0 || mapping.firstName >= 0 || mapping.lastName >= 0;
  const canPreview = nameMapped || mapping.email >= 0;

  async function runImport() {
    if (busy || toImport.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: toImport }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Import failed (${res.status})`);
      onImported((data.imported ?? []) as Contact[]);
      setResult({ importedCount: data.importedCount ?? 0, skipped: data.skipped ?? 0 });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal import-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-h">
          <div className="modal-title">Import contacts from CSV</div>
          <button className="modal-x" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "block" }}>
          {error && (
            <div className="signin-error" role="alert" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          {step === "upload" && (
            <div
              className="import-drop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={26} />
              <div className="import-drop-t">Drop a CSV here, or click to choose</div>
              <div className="import-drop-s">
                Wix export headers (First Name, Last Name, Email, Phone…) auto-map. Quoted commas
                &amp; blank rows handled.
              </div>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
          )}

          {step === "map" && (
            <>
              <div className="import-sub">
                <b>{fileName}</b> · {dataRows.length} rows · {headers.length} columns. Map your CSV
                columns to contact fields (auto-mapped where possible).
              </div>
              <div className="import-maps">
                {IMPORT_FIELDS.map((f) => (
                  <div className="field" key={f.key}>
                    <label>{f.label}</label>
                    <select
                      value={mapping[f.key] ?? SKIP}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [f.key]: parseInt(e.target.value, 10) }))
                      }
                    >
                      <option value={SKIP}>— skip —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="import-note">
                Name is taken from “Full name”, or “First name” + “Last name”. All imports land under
                the <b>PVALD</b> entity, tagged <b>wix-import</b>.
              </div>
            </>
          )}

          {step === "preview" && (
            <>
              <div className="import-stats">
                <span className="import-stat ok">{toImport.length} to import</span>
                <span className="import-stat">{duplicates.length} duplicate{duplicates.length === 1 ? "" : "s"} skipped</span>
                <span className="import-stat">→ PVALD · wix-import</span>
              </div>
              <div className="import-table-wrap">
                <table className="import-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Organization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toImport.slice(0, PREVIEW_LIMIT).map((c, i) => (
                      <tr key={i}>
                        <td>{c.name || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td>{c.phone || "—"}</td>
                        <td>{c.org || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {toImport.length > PREVIEW_LIMIT && (
                  <div className="import-more">…and {toImport.length - PREVIEW_LIMIT} more</div>
                )}
                {toImport.length === 0 && (
                  <div className="import-more">Nothing new to import — every row is already a contact.</div>
                )}
              </div>
            </>
          )}

          {step === "done" && result && (
            <div className="import-done">
              <CheckCircle2 size={30} color="#7FB86A" />
              <div className="import-done-t">
                Imported {result.importedCount} contact{result.importedCount === 1 ? "" : "s"}
              </div>
              <div className="import-done-s">
                {result.skipped} duplicate{result.skipped === 1 ? "" : "s"} skipped · all tagged
                wix-import under PVALD
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step === "map" && (
            <button className="btn-ghost" style={{ marginRight: "auto" }} onClick={() => setStep("upload")}>
              <ArrowLeft size={13} /> Back
            </button>
          )}
          {step === "preview" && (
            <button className="btn-ghost" style={{ marginRight: "auto" }} onClick={() => setStep("map")}>
              <ArrowLeft size={13} /> Back
            </button>
          )}
          {step === "done" ? (
            <button className="btn-gold" onClick={onClose}>
              Done
            </button>
          ) : (
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
          )}
          {step === "map" && (
            <button className="btn-gold" disabled={!canPreview} onClick={() => setStep("preview")}>
              Preview
            </button>
          )}
          {step === "preview" && (
            <button className="btn-gold" disabled={busy || toImport.length === 0} onClick={runImport}>
              {busy ? "Importing…" : `Import ${toImport.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
