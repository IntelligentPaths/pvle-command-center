"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { STAGES, STAGE_COLOR, money, type Opportunity, type Stage } from "@/lib/pipeline";
import OpportunityModal from "./OpportunityModal";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";
const toNum = (v: string) => parseFloat(String(v).replace(/[^0-9.\-]/g, "")) || 0;

export default function PipelineBoard({
  initial,
  entities,
}: {
  initial: Opportunity[];
  entities: EntityOpt[];
}) {
  const [opps, setOpps] = useState<Opportunity[]>(initial);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const colorOf = (id: string) => entities.find((e) => e.id === id)?.color ?? FALLBACK;
  const labelOf = (id: string) => entities.find((e) => e.id === id)?.short || id || "—";

  const activeTotal = opps
    .filter((o) => o.stage !== "Declined" && o.stage !== "Awarded")
    .reduce((s, o) => s + toNum(o.amount), 0);

  async function api(method: string, body: Record<string, unknown>): Promise<Opportunity> {
    const res = await fetch("/api/pipeline", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.row as Opportunity;
  }

  const payload = (o: Opportunity) => ({
    name: o.name,
    funder: o.funder,
    entity: o.entity,
    type: o.type,
    amount: o.amount,
    stage: o.stage,
    owner: o.owner,
    decision_date: o.decision_date,
    notes: o.notes,
  });

  // Move a card one stage left/right → optimistic, PATCH, reconcile or roll back.
  async function move(id: string, dir: -1 | 1) {
    if (id.startsWith("temp-")) return;
    const opp = opps.find((o) => o.id === id);
    if (!opp) return;
    const idx = STAGES.indexOf(opp.stage as Stage);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= STAGES.length) return;
    const newStage = STAGES[ni];
    const prevStage = opp.stage;

    setOpps((cur) => cur.map((o) => (o.id === id ? { ...o, stage: newStage } : o)));
    try {
      const row = await api("PATCH", { id, stage: newStage });
      setOpps((cur) => cur.map((o) => (o.id === id ? row : o)));
    } catch (e) {
      setOpps((cur) => cur.map((o) => (o.id === id ? { ...o, stage: prevStage } : o)));
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Add (POST) or edit (PATCH) → optimistic, then reconcile with the server row.
  async function save(form: Opportunity) {
    if (form.id.startsWith("temp-")) {
      setEditing(null);
      setError("That opportunity is still saving — give it a moment, then edit again.");
      return;
    }
    setEditing(null);
    if (form.id) {
      const prev = opps.find((o) => o.id === form.id);
      setOpps((cur) => cur.map((o) => (o.id === form.id ? { ...o, ...form } : o)));
      try {
        const row = await api("PATCH", { id: form.id, ...payload(form) });
        setOpps((cur) => cur.map((o) => (o.id === form.id ? row : o)));
      } catch (e) {
        if (prev) setOpps((cur) => cur.map((o) => (o.id === form.id ? prev : o)));
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
      setOpps((cur) => [{ ...form, id: tempId }, ...cur]);
      try {
        const row = await api("POST", payload(form));
        setOpps((cur) => cur.map((o) => (o.id === tempId ? row : o)));
      } catch (e) {
        setOpps((cur) => cur.filter((o) => o.id !== tempId));
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }

  // Delete → confirm, optimistic removal, DELETE, roll back on failure (re-inserted at
  // its original index). Mirrors the shared delete pattern in the other modules.
  async function remove(o: Opportunity) {
    if (o.id.startsWith("temp-")) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${o.name}"? This can't be undone.`)) return;
    const idx = opps.findIndex((x) => x.id === o.id);
    setOpps((cur) => cur.filter((x) => x.id !== o.id));
    try {
      const res = await fetch("/api/pipeline", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: o.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setOpps((cur) => {
        if (cur.some((x) => x.id === o.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, o);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const blank: Opportunity = {
    id: "",
    name: "",
    funder: "",
    entity: "",
    type: "Grant",
    amount: "",
    stage: "Researching",
    owner: "",
    decision_date: "",
    notes: "",
    updated_at: "",
  };

  return (
    <>
      <div className="pipe-bar">
        <div className="pipe-summary">
          {opps.length} opportunities · <b>{money(activeTotal)}</b> active in play
        </div>
        <button className="addbtn" onClick={() => setEditing(blank)}>
          <Plus size={16} /> Add opportunity
        </button>
      </div>

      <div className="board">
        {STAGES.map((stage) => {
          const items = opps.filter((o) => o.stage === stage);
          const sum = items.reduce((s, o) => s + toNum(o.amount), 0);
          return (
            <div className="col" key={stage}>
              <div className="col-h">
                <span className="col-name" style={{ color: STAGE_COLOR[stage] }}>
                  {stage}
                </span>
                <span className="col-meta">
                  {items.length}
                  {sum ? ` · ${money(sum)}` : ""}
                </span>
              </div>
              <div className="col-body">
                {items.map((o) => {
                  const idx = STAGES.indexOf(o.stage as Stage);
                  return (
                    <div className="pcard" key={o.id} style={{ borderLeftColor: colorOf(o.entity) }}>
                      <div className="pcard-top">
                        <div className="pcard-name">{o.name}</div>
                        <div className="pcard-actions">
                          <button className="pcard-edit" aria-label="Edit" onClick={() => setEditing(o)}>
                            <Pencil size={13} />
                          </button>
                          <button className="pcard-edit danger" aria-label="Delete" onClick={() => remove(o)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {o.funder && <div className="pcard-funder">{o.funder}</div>}
                      <div className="pcard-mid">
                        <span className="pcard-amt">{money(o.amount)}</span>
                        {o.owner && <span className="chip">{o.owner}</span>}
                      </div>
                      <div className="pcard-foot">
                        <span className="edot">
                          <i style={{ background: colorOf(o.entity) }} />
                          <span>{labelOf(o.entity)}</span>
                        </span>
                        <span className="moves">
                          <button
                            className="mbtn"
                            aria-label="Move to previous stage"
                            disabled={idx <= 0}
                            onClick={() => move(o.id, -1)}
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            className="mbtn"
                            aria-label="Move to next stage"
                            disabled={idx >= STAGES.length - 1}
                            onClick={() => move(o.id, 1)}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div className="col-empty">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <OpportunityModal
          initial={editing}
          entities={entities}
          onSave={save}
          onClose={() => setEditing(null)}
          onDelete={() => {
            const o = editing;
            if (o) remove(o);
            setEditing(null);
          }}
        />
      )}
      {error && (
        <div className="pipe-toast" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
