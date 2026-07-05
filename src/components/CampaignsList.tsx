"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { CAMPAIGN_OBJECTIVES, CAMPAIGN_STATUSES, STATUS_COLOR, type Campaign } from "@/lib/campaigns";
import CampaignModal from "./CampaignModal";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function md(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}` : "";
}
function yr(s: string): string {
  const m = /^(\d{4})/.exec(s || "");
  return m ? m[1] : "";
}
function dateRange(a: string, b: string): string {
  const fa = md(a);
  const fb = md(b);
  if (fa && fb) return `${fa} – ${fb}${yr(b) ? `, ${yr(b)}` : ""}`;
  if (fa) return `from ${fa}${yr(a) ? `, ${yr(a)}` : ""}`;
  if (fb) return `until ${fb}${yr(b) ? `, ${yr(b)}` : ""}`;
  return "";
}

export default function CampaignsList({
  initial,
  entities,
}: {
  initial: Campaign[];
  entities: EntityOpt[];
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusF, setStatusF] = useState("all");
  const [objectiveF, setObjectiveF] = useState("all");
  const [entityF, setEntityF] = useState("all");

  const colorOf = (id: string) => entities.find((e) => e.id === id)?.color ?? FALLBACK;
  const labelOf = (id: string) => entities.find((e) => e.id === id)?.short || id;

  const objectiveOptions = useMemo(
    () => Array.from(new Set<string>([...CAMPAIGN_OBJECTIVES, ...campaigns.map((c) => c.objective).filter(Boolean)])),
    [campaigns],
  );
  const filtered = campaigns.filter(
    (c) =>
      (statusF === "all" || c.status === statusF) &&
      (objectiveF === "all" || c.objective === objectiveF) &&
      (entityF === "all" || c.entity === entityF),
  );

  async function api(method: string, body: Record<string, unknown>): Promise<Campaign> {
    const res = await fetch("/api/campaigns", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.row as Campaign;
  }

  const payload = (c: Campaign) => ({
    name: c.name,
    entity: c.entity,
    goal: c.goal,
    objective: c.objective,
    start_date: c.start_date,
    end_date: c.end_date,
    owner: c.owner,
    status: c.status,
    notes: c.notes,
  });

  async function save(form: Campaign) {
    if (form.id.startsWith("temp-")) {
      setEditing(null);
      setError("That campaign is still saving — give it a moment, then edit again.");
      return;
    }
    setEditing(null);
    if (form.id) {
      const prev = campaigns.find((c) => c.id === form.id);
      setCampaigns((cur) => cur.map((c) => (c.id === form.id ? { ...c, ...form } : c)));
      try {
        const row = await api("PATCH", { id: form.id, ...payload(form) });
        setCampaigns((cur) => cur.map((c) => (c.id === form.id ? row : c)));
      } catch (e) {
        if (prev) setCampaigns((cur) => cur.map((c) => (c.id === form.id ? prev : c)));
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
      setCampaigns((cur) => [{ ...form, id: tempId }, ...cur]);
      try {
        const row = await api("POST", payload(form));
        setCampaigns((cur) => cur.map((c) => (c.id === tempId ? row : c)));
      } catch (e) {
        setCampaigns((cur) => cur.filter((c) => c.id !== tempId));
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function remove(c: Campaign) {
    if (c.id.startsWith("temp-")) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${c.name}"?`)) return;
    const idx = campaigns.findIndex((x) => x.id === c.id);
    setCampaigns((cur) => cur.filter((x) => x.id !== c.id));
    try {
      const res = await fetch("/api/campaigns", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setCampaigns((cur) => {
        if (cur.some((x) => x.id === c.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, c);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const blank: Campaign = {
    id: "",
    name: "",
    entity: "",
    goal: "",
    objective: "",
    start_date: "",
    end_date: "",
    owner: "",
    status: "Planned",
    notes: "",
  };

  return (
    <>
      <div className="cmptoolbar">
        <div className="cmpfilters">
          <span className="flabel">Filter</span>
          <select className="fsel" value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="fsel" value={objectiveF} onChange={(e) => setObjectiveF(e.target.value)} aria-label="Filter by objective">
            <option value="all">All objectives</option>
            {objectiveOptions.map((o) => (
              <option key={o} value={o}>
                {o}
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
            {filtered.length} of {campaigns.length}
          </span>
        </div>
        <button className="addbtn" onClick={() => setEditing(blank)}>
          <Plus size={16} /> Add campaign
        </button>
      </div>

      <div className="cmplist">
        {filtered.map((c) => {
          const sc = STATUS_COLOR[c.status] ?? FALLBACK;
          const range = dateRange(c.start_date, c.end_date);
          return (
            <div className="cmpcard cc-fade" key={c.id} style={{ borderLeftColor: colorOf(c.entity) }}>
              <div className="cmpcard-top">
                <div>
                  <div className="cmpcard-name">{c.name}</div>
                  {c.goal && <div className="cmpcard-goal">{c.goal}</div>}
                </div>
                <div className="cmpcard-actions">
                  <button className="cmpbtn" aria-label="Edit" onClick={() => setEditing(c)}>
                    <Pencil size={13} />
                  </button>
                  <button className="cmpbtn danger" aria-label="Delete" onClick={() => remove(c)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="cmpcard-meta">
                {c.entity && (
                  <span className="edot">
                    <i style={{ background: colorOf(c.entity) }} />
                    {labelOf(c.entity)}
                  </span>
                )}
                {c.objective && <span className="objchip">{c.objective}</span>}
                {range && <span className="cmpdates">{range}</span>}
                {c.owner && <span className="chip">{c.owner}</span>}
                {c.status && (
                  <span className="cstatuschip" style={{ color: sc, background: `${sc}1e`, borderColor: `${sc}55` }}>
                    {c.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="cmp-empty">
            {campaigns.length === 0 ? "No campaigns yet." : "No campaigns match these filters."}
          </div>
        )}
      </div>

      {editing && (
        <CampaignModal initial={editing} entities={entities} onSave={save} onClose={() => setEditing(null)} />
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
