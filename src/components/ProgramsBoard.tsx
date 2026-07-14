"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { STATUS_COLOR, type Program } from "@/lib/programs";
import ProgramModal from "./ProgramModal";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";

export default function ProgramsBoard({
  initial,
  entities,
}: {
  initial: Program[];
  entities: EntityOpt[];
}) {
  const [programs, setPrograms] = useState<Program[]>(initial);
  const [editing, setEditing] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Group by entity, in Entities order; unmatched entities fall into "Unassigned".
  const groups = useMemo(() => {
    const known = new Set(entities.map((e) => e.id));
    const byEntity = new Map<string, Program[]>();
    for (const p of programs) {
      const key = known.has(p.entity) ? p.entity : "__unknown__";
      const arr = byEntity.get(key);
      if (arr) arr.push(p);
      else byEntity.set(key, [p]);
    }
    const out = entities
      .filter((e) => byEntity.has(e.id))
      .map((e) => ({ id: e.id, name: e.name, color: e.color, items: byEntity.get(e.id)! }));
    if (byEntity.has("__unknown__")) {
      out.push({ id: "__unknown__", name: "Unassigned", color: FALLBACK, items: byEntity.get("__unknown__")! });
    }
    return out;
  }, [programs, entities]);

  async function api(method: string, body: Record<string, unknown>): Promise<Program> {
    const res = await fetch("/api/programs", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.row as Program;
  }

  const payload = (p: Program) => ({
    name: p.name,
    entity: p.entity,
    category: p.category,
    status: p.status,
    one_liner: p.one_liner,
    description: p.description,
    notes: p.notes,
    rate_amount: p.rate_amount,
    rate_period: p.rate_period,
    capacity: p.capacity,
  });

  async function save(form: Program) {
    if (form.id.startsWith("temp-")) {
      setEditing(null);
      setError("That program is still saving — give it a moment, then edit again.");
      return;
    }
    setEditing(null);
    if (form.id) {
      const prev = programs.find((p) => p.id === form.id);
      setPrograms((cur) => cur.map((p) => (p.id === form.id ? { ...p, ...form } : p)));
      try {
        const row = await api("PATCH", { id: form.id, ...payload(form) });
        setPrograms((cur) => cur.map((p) => (p.id === form.id ? row : p)));
      } catch (e) {
        if (prev) setPrograms((cur) => cur.map((p) => (p.id === form.id ? prev : p)));
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
      setPrograms((cur) => [...cur, { ...form, id: tempId }]);
      try {
        const row = await api("POST", payload(form));
        setPrograms((cur) => cur.map((p) => (p.id === tempId ? row : p)));
      } catch (e) {
        setPrograms((cur) => cur.filter((p) => p.id !== tempId));
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function remove(p: Program) {
    if (p.id.startsWith("temp-")) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    const idx = programs.findIndex((x) => x.id === p.id);
    setPrograms((cur) => cur.filter((x) => x.id !== p.id));
    try {
      const res = await fetch("/api/programs", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setPrograms((cur) => {
        if (cur.some((x) => x.id === p.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, p);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const blank: Program = {
    id: "",
    name: "",
    entity: entities[0]?.id ?? "",
    category: "Product",
    status: "Active",
    one_liner: "",
    description: "",
    notes: "",
    rate_amount: "",
    rate_period: "",
    capacity: "",
    created_at: "",
  };

  const entityCount = groups.filter((g) => g.id !== "__unknown__").length;

  return (
    <>
      <div className="pgtoolbar">
        <div className="pgcount">
          {programs.length} programs &amp; products across <b>{entityCount}</b> {entityCount === 1 ? "entity" : "entities"}
        </div>
        <button className="addbtn" onClick={() => setEditing(blank)}>
          <Plus size={16} /> Add program
        </button>
      </div>

      {groups.map((g) => (
        <section className="pgroup" key={g.id}>
          <div className="pgroup-h">
            <span className="pgroup-dot" style={{ background: g.color, color: g.color }} />
            <span className="pgroup-name">{g.name}</span>
            <span className="pgroup-count">{g.items.length}</span>
          </div>
          <div className="pgrid">
            {g.items.map((p) => {
              const sc = STATUS_COLOR[p.status] ?? FALLBACK;
              return (
                <div className="pgcard" key={p.id} style={{ borderTopColor: g.color }}>
                  <div className="pgcard-top">
                    <div className="pgcard-name">{p.name}</div>
                    <div className="pgcard-actions">
                      <button className="pgbtn" aria-label="Edit" onClick={() => setEditing(p)}>
                        <Pencil size={13} />
                      </button>
                      <button className="pgbtn danger" aria-label="Delete" onClick={() => remove(p)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="pgcard-meta">
                    {p.status && (
                      <span className="statuschip" style={{ color: sc, background: `${sc}1e`, borderColor: `${sc}55` }}>
                        {p.status}
                      </span>
                    )}
                    {p.category && <span className="pgcard-cat">{p.category}</span>}
                  </div>
                  {p.one_liner && <div className="pgcard-line">{p.one_liner}</div>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {programs.length === 0 && <div className="empty" style={{ padding: 20 }}>No programs yet.</div>}

      {editing && (
        <ProgramModal initial={editing} entities={entities} onSave={save} onClose={() => setEditing(null)} />
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
