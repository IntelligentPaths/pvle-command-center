"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CONTACT_TYPES, type Contact } from "@/lib/contacts";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}

export default function ContactModal({
  initial,
  entities,
  onSave,
  onClose,
}: {
  initial: Contact;
  entities: EntityOpt[];
  onSave: (c: Contact) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Contact>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (k: keyof Contact, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
          <div className="modal-title">{isEdit ? "Edit contact" : "Add contact"}</div>
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
            <label>Role</label>
            <input value={form.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className="field">
            <label>Organization</label>
            <input value={form.org} onChange={(e) => set("org", e.target.value)} />
          </div>
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">—</option>
              {CONTACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add contact"}
          </button>
        </div>
      </div>
    </div>
  );
}
