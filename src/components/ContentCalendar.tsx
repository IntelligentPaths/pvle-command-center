"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Megaphone, X } from "lucide-react";
import { CONTENT_CHANNELS, CONTENT_STATUSES, contentStatusStyle, type ContentPost } from "@/lib/content";
import ContentModal from "./ContentModal";

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
const FALLBACK = "#8C7B5C";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function ContentCalendar({
  initial,
  entities,
  campaigns,
}: {
  initial: ContentPost[];
  entities: EntityOpt[];
  campaigns: CampaignOpt[];
}) {
  const [content, setContent] = useState<ContentPost[]>(initial);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelF, setChannelF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [entityF, setEntityF] = useState("all");

  const colorOf = (id: string) => entities.find((e) => e.id === id)?.color ?? FALLBACK;
  const labelOf = (id: string) => entities.find((e) => e.id === id)?.short || id;
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name || (id ? `${id} (unknown)` : "");

  const channelOptions = useMemo(
    () => Array.from(new Set<string>([...CONTENT_CHANNELS, ...content.map((c) => c.channel).filter(Boolean)])),
    [content],
  );

  // Group filtered posts by date (ascending), undated last.
  const groups = useMemo(() => {
    const filtered = content.filter(
      (c) =>
        (channelF === "all" || c.channel === channelF) &&
        (statusF === "all" || c.status === statusF) &&
        (entityF === "all" || c.entity === entityF),
    );
    const map = new Map<string, ContentPost[]>();
    for (const c of filtered) {
      const key = /^\d{4}-\d{2}-\d{2}/.test(c.date || "") ? c.date.slice(0, 10) : "__undated__";
      const arr = map.get(key);
      if (arr) arr.push(c);
      else map.set(key, [c]);
    }
    const dated = [...map.keys()].filter((k) => k !== "__undated__").sort();
    const out = dated.map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return { key: k, weekday: WEEKDAYS[dt.getDay()], label: `${MONTHS[m - 1]} ${d}, ${y}`, items: map.get(k)! };
    });
    if (map.has("__undated__")) out.push({ key: "__undated__", weekday: "", label: "Undated", items: map.get("__undated__")! });
    return out;
  }, [content, channelF, statusF, entityF]);

  const shownCount = groups.reduce((n, g) => n + g.items.length, 0);

  async function api(method: string, body: Record<string, unknown>): Promise<ContentPost> {
    const res = await fetch("/api/content", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.row as ContentPost;
  }

  const payload = (c: ContentPost) => ({
    title: c.title,
    date: c.date,
    channel: c.channel,
    entity: c.entity,
    campaign_id: c.campaign_id,
    copy: c.copy,
    asset_link: c.asset_link,
    status: c.status,
    owner: c.owner,
  });

  async function save(form: ContentPost) {
    if (form.id.startsWith("temp-")) {
      setEditing(null);
      setError("That post is still saving — give it a moment, then edit again.");
      return;
    }
    setEditing(null);
    if (form.id) {
      const prev = content.find((c) => c.id === form.id);
      setContent((cur) => cur.map((c) => (c.id === form.id ? { ...c, ...form } : c)));
      try {
        const row = await api("PATCH", { id: form.id, ...payload(form) });
        setContent((cur) => cur.map((c) => (c.id === form.id ? row : c)));
      } catch (e) {
        if (prev) setContent((cur) => cur.map((c) => (c.id === form.id ? prev : c)));
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
      setContent((cur) => [{ ...form, id: tempId }, ...cur]);
      try {
        const row = await api("POST", payload(form));
        setContent((cur) => cur.map((c) => (c.id === tempId ? row : c)));
      } catch (e) {
        setContent((cur) => cur.filter((c) => c.id !== tempId));
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function remove(c: ContentPost) {
    if (c.id.startsWith("temp-")) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${c.title}"?`)) return;
    const idx = content.findIndex((x) => x.id === c.id);
    setContent((cur) => cur.filter((x) => x.id !== c.id));
    try {
      const res = await fetch("/api/content", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setContent((cur) => {
        if (cur.some((x) => x.id === c.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, c);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const blank: ContentPost = {
    id: "",
    title: "",
    date: "",
    channel: "",
    entity: "",
    campaign_id: "",
    copy: "",
    asset_link: "",
    status: "Idea",
    owner: "",
  };

  return (
    <>
      <div className="cntoolbar">
        <div className="cnfilters">
          <span className="flabel">Filter</span>
          <select className="fsel" value={channelF} onChange={(e) => setChannelF(e.target.value)} aria-label="Filter by channel">
            <option value="all">All channels</option>
            {channelOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="fsel" value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {CONTENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="fsel" value={entityF} onChange={(e) => setEntityF(e.target.value)} aria-label="Filter by entity">
            <option value="all">All entities</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <span className="filtercount">
            {shownCount} of {content.length}
          </span>
        </div>
        <button className="addbtn" onClick={() => setEditing(blank)}>
          <Plus size={16} /> Add post
        </button>
      </div>

      {groups.map((g) => (
        <section className="cngroup" key={g.key}>
          <div className="cngroup-h">
            {g.weekday && <span className="cnweekday">{g.weekday}</span>}
            <span className="cndate">{g.label}</span>
            <span className="cngroup-count">{g.items.length}</span>
          </div>
          <div className="cngrid">
            {g.items.map((c) => {
              const camp = campaignName(c.campaign_id);
              return (
                <div className="cncard" key={c.id} style={{ borderLeftColor: colorOf(c.entity) }}>
                  <div className="cncard-top">
                    {c.channel ? <span className="cnchannel">{c.channel}</span> : <span />}
                    <div className="cncard-actions">
                      <button className="cnbtn" aria-label="Edit" onClick={() => setEditing(c)}>
                        <Pencil size={12} />
                      </button>
                      <button className="cnbtn danger" aria-label="Delete" onClick={() => remove(c)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="cncard-title">{c.title}</div>
                  <div className="cncard-meta">
                    {c.entity && (
                      <span className="edot">
                        <i style={{ background: colorOf(c.entity) }} />
                        {labelOf(c.entity)}
                      </span>
                    )}
                    {camp && (
                      <span className="cncampaign">
                        <Megaphone size={10} />
                        <span>{camp}</span>
                      </span>
                    )}
                    {c.status && (
                      <span className="cnstatus" style={contentStatusStyle(c.status)}>
                        {c.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {shownCount === 0 && (
        <div className="cn-empty">{content.length === 0 ? "No content yet." : "No posts match these filters."}</div>
      )}

      {editing && (
        <ContentModal
          initial={editing}
          entities={entities}
          campaigns={campaigns}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
