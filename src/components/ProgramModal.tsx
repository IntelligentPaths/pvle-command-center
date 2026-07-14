"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PROGRAM_STATUSES, PROGRAM_CATEGORIES, RATE_PERIODS, RATE_PERIOD_LABEL, type Program } from "@/lib/programs";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}

export default function ProgramModal({
  initial,
  entities,
  onSave,
  onClose,
}: {
  initial: Program;
  entities: EntityOpt[];
  onSave: (p: Program) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Program>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (k: keyof Program, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          <div className="modal-title">{isEdit ? "Edit program" : "Add program"}</div>
          <button className="modal-x" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field wide">
            <label>Name</label>
            <input value={form.name} autoFocus onChange={(e) => set("name", e.target.value)} />
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
            <label>Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">—</option>
              {PROGRAM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="">—</option>
              {PROGRAM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Rate ($)</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.rate_amount}
              onChange={(e) => set("rate_amount", e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="field">
            <label>Rate period</label>
            <select value={form.rate_period} onChange={(e) => set("rate_period", e.target.value)}>
              <option value="">—</option>
              {RATE_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {RATE_PERIOD_LABEL[p] ?? p}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Capacity</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="field wide">
            <label>One-liner</label>
            <input value={form.one_liner} onChange={(e) => set("one_liner", e.target.value)} />
          </div>
          <div className="field wide">
            <label>Description</label>
            <textarea value={form.description} rows={2} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="field wide">
            <label>Notes</label>
            <textarea value={form.notes} rows={2} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" onClick={submit} disabled={!form.name.trim() || saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add program"}
          </button>
        </div>
      </div>
    </div>
  );
}
