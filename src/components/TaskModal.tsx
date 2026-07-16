"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TASK_STATUSES, isFocus, type Task } from "@/lib/tasks";
import AttachmentsSection from "./AttachmentsSection";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}

export default function TaskModal({
  initial,
  entities,
  onSave,
  onClose,
}: {
  initial: Task;
  entities: EntityOpt[];
  onSave: (t: Task) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Task>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (k: keyof Task, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const entityOpts =
    !form.entity || entities.some((e) => e.id === form.entity)
      ? entities
      : [{ id: form.entity, name: form.entity, short: form.entity, color: "#8C7B5C" }, ...entities];

  function submit() {
    if (!form.task.trim() || saving) return;
    setSaving(true);
    onSave({ ...form, task: form.task.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-h">
          <div className="modal-title">{isEdit ? "Edit task" : "Add task"}</div>
          <button className="modal-x" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field wide">
            <label>Task</label>
            <input value={form.task} autoFocus onChange={(e) => set("task", e.target.value)} />
          </div>
          <div className="field">
            <label>Related to</label>
            <input value={form.related} onChange={(e) => set("related", e.target.value)} />
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
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="">—</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Due</label>
            <input type="date" value={form.due} onChange={(e) => set("due", e.target.value)} />
          </div>
          <div className="field">
            <label>Focus this week</label>
            <select value={isFocus(form.focus_week) ? "TRUE" : "FALSE"} onChange={(e) => set("focus_week", e.target.value)}>
              <option value="FALSE">No</option>
              <option value="TRUE">Yes</option>
            </select>
          </div>
          <div className="field wide">
            <label>Notes</label>
            <textarea value={form.notes} rows={2} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {isEdit && (
            <div style={{ gridColumn: "1 / -1" }}>
              <AttachmentsSection parentType="task" parentId={form.id} />
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" onClick={submit} disabled={!form.task.trim() || saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}
