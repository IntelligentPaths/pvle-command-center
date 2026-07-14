"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, Star, X } from "lucide-react";
import { TASK_STATUSES, STATUS_COLOR, isFocus, isDone, type Task } from "@/lib/tasks";
import TaskModal from "./TaskModal";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";

export default function TasksList({
  initial,
  entities,
}: {
  initial: Task[];
  entities: EntityOpt[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ownerF, setOwnerF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [entityF, setEntityF] = useState("all");

  const colorOf = (id: string) => entities.find((e) => e.id === id)?.color ?? FALLBACK;
  const labelOf = (id: string) => entities.find((e) => e.id === id)?.short || id;

  const owners = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.owner).filter(Boolean))).sort(),
    [tasks],
  );

  const filtered = tasks.filter(
    (t) =>
      (ownerF === "all" || t.owner === ownerF) &&
      (statusF === "all" || t.status === statusF) &&
      (entityF === "all" || t.entity === entityF),
  );
  const sorted = filtered.slice().sort((a, b) => {
    const ad = isDone(a.status) ? 1 : 0;
    const bd = isDone(b.status) ? 1 : 0;
    if (ad !== bd) return ad - bd; // open tasks first
    const af = isFocus(a.focus_week) ? 0 : 1;
    const bf = isFocus(b.focus_week) ? 0 : 1;
    if (af !== bf) return af - bf; // focus tasks first
    return TASK_STATUSES.indexOf(a.status as (typeof TASK_STATUSES)[number]) - TASK_STATUSES.indexOf(b.status as (typeof TASK_STATUSES)[number]);
  });

  const openCount = tasks.filter((t) => !isDone(t.status)).length;
  const focusCount = tasks.filter((t) => isFocus(t.focus_week)).length;

  async function api(method: string, body: Record<string, unknown>): Promise<Task> {
    const res = await fetch("/api/tasks", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.row as Task;
  }

  const payload = (t: Task) => ({
    task: t.task,
    related: t.related,
    owner: t.owner,
    status: t.status,
    due: t.due,
    focus_week: t.focus_week,
    notes: t.notes,
    entity: t.entity,
  });

  // Optimistic single-field patch (used by the Done + focus toggles), with rollback.
  async function patchField(id: string, patch: Record<string, string>) {
    if (id.startsWith("temp-")) return;
    const prev = tasks.find((t) => t.id === id);
    if (!prev) return;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      const row = await api("PATCH", { id, ...patch });
      setTasks((cur) => cur.map((t) => (t.id === id ? row : t)));
    } catch (e) {
      setTasks((cur) => cur.map((t) => (t.id === id ? prev : t)));
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const toggleDone = (t: Task) => patchField(t.id, { status: isDone(t.status) ? "To Do" : "Done" });
  const toggleFocus = (t: Task) => patchField(t.id, { focus_week: isFocus(t.focus_week) ? "FALSE" : "TRUE" });

  async function save(form: Task) {
    if (form.id.startsWith("temp-")) {
      setEditing(null);
      setError("That task is still saving — give it a moment, then edit again.");
      return;
    }
    setEditing(null);
    if (form.id) {
      const prev = tasks.find((t) => t.id === form.id);
      setTasks((cur) => cur.map((t) => (t.id === form.id ? { ...t, ...form } : t)));
      try {
        const row = await api("PATCH", { id: form.id, ...payload(form) });
        setTasks((cur) => cur.map((t) => (t.id === form.id ? row : t)));
      } catch (e) {
        if (prev) setTasks((cur) => cur.map((t) => (t.id === form.id ? prev : t)));
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
      setTasks((cur) => [{ ...form, id: tempId }, ...cur]);
      try {
        const row = await api("POST", payload(form));
        setTasks((cur) => cur.map((t) => (t.id === tempId ? row : t)));
      } catch (e) {
        setTasks((cur) => cur.filter((t) => t.id !== tempId));
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function remove(t: Task) {
    if (t.id.startsWith("temp-")) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${t.task}"? This can't be undone.`)) return;
    const idx = tasks.findIndex((x) => x.id === t.id);
    setTasks((cur) => cur.filter((x) => x.id !== t.id));
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setTasks((cur) => {
        if (cur.some((x) => x.id === t.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, t);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const blank: Task = {
    id: "",
    task: "",
    related: "",
    owner: "",
    status: "To Do",
    due: "",
    focus_week: "FALSE",
    notes: "",
    entity: "",
  };

  return (
    <>
      <div className="ttoolbar">
        <div className="tfilters">
          <span className="flabel">Filter</span>
          <select className="fsel" value={ownerF} onChange={(e) => setOwnerF(e.target.value)} aria-label="Filter by owner">
            <option value="all">All owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select className="fsel" value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {TASK_STATUSES.map((s) => (
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
            {openCount} open · {focusCount} in focus
          </span>
        </div>
        <button className="addbtn" onClick={() => setEditing(blank)}>
          <Plus size={16} /> Add task
        </button>
      </div>

      <div className="panel cc-fade tlist">
        {sorted.map((t) => {
          const done = isDone(t.status);
          const focus = isFocus(t.focus_week);
          const sc = STATUS_COLOR[t.status] ?? FALLBACK;
          return (
            <div className={"trow" + (done ? " done" : "")} key={t.id}>
              <button
                className={"tcheck" + (done ? " on" : "")}
                aria-label={done ? "Mark not done" : "Mark done"}
                onClick={() => toggleDone(t)}
              >
                {done && <Check size={13} color="#16120C" strokeWidth={3} />}
              </button>

              <div className="t-main">
                <div className="t-task">{t.task}</div>
                <div className="t-meta">
                  {t.related && <span>{t.related}</span>}
                  {t.entity && (
                    <span className="edot">
                      <i style={{ background: colorOf(t.entity) }} />
                      {labelOf(t.entity)}
                    </span>
                  )}
                  {t.due && <span>due {t.due}</span>}
                </div>
              </div>

              <button
                className={"tstar" + (focus ? " on" : "")}
                aria-label={focus ? "Remove from this week's focus" : "Add to this week's focus"}
                title="This week's focus"
                onClick={() => toggleFocus(t)}
              >
                <Star size={15} fill={focus ? "currentColor" : "none"} />
              </button>

              {t.owner && <span className="chip">{t.owner}</span>}
              {t.status && (
                <span className="tstatuschip" style={{ color: sc, background: `${sc}1e`, borderColor: `${sc}55` }}>
                  {t.status}
                </span>
              )}

              <div className="t-actions">
                <button className="tbtn" aria-label="Edit" onClick={() => setEditing(t)}>
                  <Pencil size={13} />
                </button>
                <button className="tbtn danger" aria-label="Delete" onClick={() => remove(t)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="t-empty">{tasks.length === 0 ? "No tasks yet." : "No tasks match these filters."}</div>
        )}
      </div>

      {editing && <TaskModal initial={editing} entities={entities} onSave={save} onClose={() => setEditing(null)} />}
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
