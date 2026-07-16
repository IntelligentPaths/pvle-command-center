"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { STAGES, OPPORTUNITY_TYPES, type Opportunity } from "@/lib/pipeline";
import AttachmentsSection from "./AttachmentsSection";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}

export default function OpportunityModal({
  initial,
  entities,
  onSave,
  onClose,
  onDelete,
}: {
  initial: Opportunity;
  entities: EntityOpt[];
  onSave: (o: Opportunity) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Opportunity>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (k: keyof Opportunity, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Keep the current entity selectable even if it isn't in the known list.
  const entityOpts =
    !form.entity || entities.some((e) => e.id === form.entity)
      ? entities
      : [{ id: form.entity, name: form.entity, short: form.entity, color: "#8C7B5C" }, ...entities];

  function submit() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    onSave({ ...form, name: form.name.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-h">
          <div className="modal-title">{isEdit ? "Edit opportunity" : "Add opportunity"}</div>
          <button className="modal-x" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field wide">
            <label>Opportunity</label>
            <input value={form.name} autoFocus onChange={(e) => set("name", e.target.value)} placeholder="Name" />
          </div>
          <div className="field">
            <label>Funder / source</label>
            <input value={form.funder} onChange={(e) => set("funder", e.target.value)} />
          </div>
          <div className="field">
            <label>Owner</label>
            <input value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          </div>
          <div className="field">
            <label>Entity</label>
            <select value={form.entity} onChange={(e) => set("entity", e.target.value)}>
              <option value="">—</option>
              {entityOpts.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">—</option>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Amount ($)</label>
            <input type="number" inputMode="numeric" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </div>
          <div className="field">
            <label>Stage</label>
            <select value={form.stage} onChange={(e) => set("stage", e.target.value)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Decision date</label>
            <input type="date" value={form.decision_date} onChange={(e) => set("decision_date", e.target.value)} />
          </div>
          <div className="field wide">
            <label>Notes</label>
            <textarea value={form.notes} rows={2} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {isEdit && (
            <div style={{ gridColumn: "1 / -1" }}>
              <AttachmentsSection parentType="opportunity" parentId={form.id} />
            </div>
          )}
        </div>

        <div className="modal-foot">
          {isEdit && onDelete && (
            <button className="btn-danger" style={{ marginRight: "auto" }} onClick={onDelete}>
              Delete
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" onClick={submit} disabled={!form.name.trim() || saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add opportunity"}
          </button>
        </div>
      </div>
    </div>
  );
}
