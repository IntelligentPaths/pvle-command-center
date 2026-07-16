"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CAMPAIGN_OBJECTIVES, CAMPAIGN_STATUSES, type Campaign } from "@/lib/campaigns";
import AttachmentsSection from "./AttachmentsSection";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}

export default function CampaignModal({
  initial,
  entities,
  onSave,
  onClose,
}: {
  initial: Campaign;
  entities: EntityOpt[];
  onSave: (c: Campaign) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Campaign>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (k: keyof Campaign, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const entityOpts =
    !form.entity || entities.some((e) => e.id === form.entity)
      ? entities
      : [{ id: form.entity, name: form.entity, short: form.entity, color: "#8C7B5C" }, ...entities];
  // keep an out-of-set objective selectable if the data ever has one
  const objectives = form.objective && !CAMPAIGN_OBJECTIVES.includes(form.objective as (typeof CAMPAIGN_OBJECTIVES)[number])
    ? [form.objective, ...CAMPAIGN_OBJECTIVES]
    : [...CAMPAIGN_OBJECTIVES];

  function submit() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    onSave({ ...form, name: form.name.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-h">
          <div className="modal-title">{isEdit ? "Edit campaign" : "Add campaign"}</div>
          <button className="modal-x" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field wide">
            <label>Name</label>
            <input value={form.name} autoFocus onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field wide">
            <label>Goal</label>
            <input value={form.goal} onChange={(e) => set("goal", e.target.value)} />
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
            <label>Objective</label>
            <select value={form.objective} onChange={(e) => set("objective", e.target.value)}>
              <option value="">—</option>
              {objectives.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="">—</option>
              {CAMPAIGN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Owner</label>
            <input value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          </div>
          <div className="field">
            <label>Start date</label>
            <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div className="field">
            <label>End date</label>
            <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
          </div>
          <div className="field wide">
            <label>Notes</label>
            <textarea value={form.notes} rows={2} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {isEdit && (
            <div style={{ gridColumn: "1 / -1" }}>
              <AttachmentsSection parentType="campaign" parentId={form.id} />
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" onClick={submit} disabled={!form.name.trim() || saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
