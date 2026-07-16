"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CONTENT_STATUSES, CONTENT_CHANNELS, type ContentPost } from "@/lib/content";
import AttachmentsSection from "./AttachmentsSection";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
interface CampaignOpt {
  id: string;
  name: string;
}

export default function ContentModal({
  initial,
  entities,
  campaigns,
  onSave,
  onClose,
}: {
  initial: ContentPost;
  entities: EntityOpt[];
  campaigns: CampaignOpt[];
  onSave: (c: ContentPost) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContentPost>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const set = (k: keyof ContentPost, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const entityOpts =
    !form.entity || entities.some((e) => e.id === form.entity)
      ? entities
      : [{ id: form.entity, name: form.entity, short: form.entity, color: "#8C7B5C" }, ...entities];
  // keep a stale/unknown campaign selectable (e.g. its campaign was deleted)
  const campaignOpts =
    !form.campaign_id || campaigns.some((c) => c.id === form.campaign_id)
      ? campaigns
      : [{ id: form.campaign_id, name: `${form.campaign_id} (unknown)` }, ...campaigns];

  function submit() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    onSave({ ...form, title: form.title.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-h">
          <div className="modal-title">{isEdit ? "Edit post" : "Add post"}</div>
          <button className="modal-x" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field wide">
            <label>Title</label>
            <input value={form.title} autoFocus onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="field">
            <label>Channel</label>
            <select value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              <option value="">—</option>
              {CONTENT_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
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
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="">—</option>
              {CONTENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field wide">
            <label>Campaign</label>
            <select value={form.campaign_id} onChange={(e) => set("campaign_id", e.target.value)}>
              <option value="">— none —</option>
              {campaignOpts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Owner</label>
            <input value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          </div>
          <div className="field">
            <label>Asset link</label>
            <input value={form.asset_link} onChange={(e) => set("asset_link", e.target.value)} placeholder="https://…" />
          </div>
          <div className="field wide">
            <label>Copy</label>
            <textarea value={form.copy} rows={3} onChange={(e) => set("copy", e.target.value)} />
          </div>
          {isEdit && (
            <div style={{ gridColumn: "1 / -1" }}>
              <AttachmentsSection parentType="content" parentId={form.id} />
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-gold" onClick={submit} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add post"}
          </button>
        </div>
      </div>
    </div>
  );
}
