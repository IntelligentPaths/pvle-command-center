"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Plus, Search, X, UserPlus } from "lucide-react";
import { STATUS_COLOR, RATE_PERIOD_LABEL, type Program } from "@/lib/programs";
import {
  ENROLLMENT_STATUS_COLOR,
  statsForProgram,
  enrollmentMonthly,
  money,
  num,
  isActive,
  type Enrollment,
} from "@/lib/enrollments";
import type { Contact } from "@/lib/contacts";
import ProgramModal from "./ProgramModal";
import AttachmentsSection from "./AttachmentsSection";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";

export default function ProgramDetail({
  program: initialProgram,
  enrollments: initialEnrollments,
  contacts,
  entities,
}: {
  program: Program;
  enrollments: Enrollment[];
  contacts: Contact[];
  entities: EntityOpt[];
}) {
  const [program, setProgram] = useState<Program>(initialProgram);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [editing, setEditing] = useState<Program | null>(null);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const entity = entities.find((e) => e.id === program.entity);
  const entityColor = entity?.color ?? FALLBACK;
  const stats = useMemo(() => statsForProgram(program, enrollments), [program, enrollments]);
  const capacity = num(program.capacity);
  const util = capacity > 0 ? Math.min(100, Math.round((stats.activeCount / capacity) * 100)) : 0;

  // Contacts not already actively enrolled here, filtered by the search box.
  const activeContactIds = useMemo(
    () => new Set(enrollments.filter(isActive).map((e) => e.contact_id)),
    [enrollments],
  );
  const pickable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts
      .filter((c) => !activeContactIds.has(c.id))
      .filter((c) => !q || `${c.name} ${c.email} ${c.org}`.toLowerCase().includes(q))
      .slice(0, 40);
  }, [contacts, activeContactIds, search]);

  // Program edit → PATCH /api/programs, optimistic.
  async function saveProgram(form: Program) {
    setEditing(null);
    const prev = program;
    setProgram(form);
    try {
      const res = await fetch("/api/programs", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          entity: form.entity,
          category: form.category,
          status: form.status,
          one_liner: form.one_liner,
          description: form.description,
          notes: form.notes,
          rate_amount: form.rate_amount,
          rate_period: form.rate_period,
          capacity: form.capacity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setProgram(data.row as Program);
    } catch (e) {
      setProgram(prev);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function enroll(contact: Contact) {
    setPicking(false);
    setSearch("");
    const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
    const optimistic: Enrollment = {
      id: tempId,
      program_id: program.id,
      contact_id: contact.id,
      status: "active",
      start_date: "",
      end_date: "",
      rate_override: "",
      notes: "",
      created_at: "",
    };
    setEnrollments((cur) => [...cur, optimistic]);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ program_id: program.id, contact_id: contact.id, status: "active" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Enroll failed (${res.status})`);
      setEnrollments((cur) => cur.map((e) => (e.id === tempId ? (data.row as Enrollment) : e)));
    } catch (e) {
      setEnrollments((cur) => cur.filter((e) => e.id !== tempId));
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function unenroll(en: Enrollment) {
    if (en.id.startsWith("temp-")) return;
    const c = contactById.get(en.contact_id);
    const label = c?.name || "this contact";
    if (typeof window !== "undefined" && !window.confirm(`Unenroll ${label}? This can't be undone.`)) return;
    const idx = enrollments.findIndex((x) => x.id === en.id);
    setEnrollments((cur) => cur.filter((x) => x.id !== en.id));
    try {
      const res = await fetch("/api/enrollments", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: en.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Unenroll failed (${res.status})`);
    } catch (e) {
      setEnrollments((cur) => {
        if (cur.some((x) => x.id === en.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, en);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Active first, then by status; resolve contact name at render time (referential-by-id).
  const roster = [...enrollments].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));
  const sc = STATUS_COLOR[program.status] ?? FALLBACK;
  const rateLabel =
    num(program.rate_amount) > 0
      ? `${money(num(program.rate_amount))} ${RATE_PERIOD_LABEL[program.rate_period] ?? program.rate_period}`
      : "—";

  return (
    <>
      {/* Program meta card */}
      <div className="panel cc-fade pd-meta" style={{ borderTopColor: entityColor }}>
        <div className="pd-meta-main">
          <div className="pd-badges">
            {entity && (
              <span className="edot">
                <i style={{ background: entityColor }} /> {entity.name}
              </span>
            )}
            {program.status && (
              <span className="statuschip" style={{ color: sc, background: `${sc}1e`, borderColor: `${sc}55` }}>
                {program.status}
              </span>
            )}
            {program.category && <span className="pd-cat">{program.category}</span>}
          </div>
          {program.one_liner && <div className="pd-line">{program.one_liner}</div>}
          {program.description && <div className="pd-desc">{program.description}</div>}
        </div>
        <button className="iconbtn" aria-label="Edit program" onClick={() => setEditing(program)}>
          <Pencil size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="pd-stats cc-fade">
        <div className="panel pd-stat">
          <div className="pd-stat-cap">Enrolled</div>
          <div className="pd-stat-big">
            {stats.activeCount}
            {capacity > 0 && <span className="pd-stat-of">/ {capacity}</span>}
          </div>
          {capacity > 0 && (
            <div className="pd-bar">
              <i style={{ width: `${util}%`, background: entityColor }} />
            </div>
          )}
          <div className="pd-stat-sub">{capacity > 0 ? `${util}% of capacity` : "active enrollments"}</div>
        </div>
        <div className="panel pd-stat">
          <div className="pd-stat-cap">Monthly recurring</div>
          <div className="pd-stat-big gold">{money(stats.mrr)}</div>
          <div className="pd-stat-sub">MRR · rate {rateLabel}</div>
        </div>
        <div className="panel pd-stat">
          <div className="pd-stat-cap">Projected annual</div>
          <div className="pd-stat-big gold">{money(stats.annual)}</div>
          <div className="pd-stat-sub">MRR × 12</div>
        </div>
        <div className="panel pd-stat">
          <div className="pd-stat-cap">Total roster</div>
          <div className="pd-stat-big">{stats.totalCount}</div>
          <div className="pd-stat-sub">incl. pending / ended</div>
        </div>
      </div>

      {/* Roster */}
      <div className="panel cc-fade pd-roster">
        <div className="sect-h">
          <div className="t">Roster</div>
          <button className="addbtn" onClick={() => setPicking((v) => !v)}>
            <UserPlus size={15} /> Enroll contact
          </button>
        </div>

        {picking && (
          <div className="pd-picker">
            <div className="pd-search">
              <Search size={14} />
              <input
                autoFocus
                value={search}
                placeholder="Search contacts by name, email, or org…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="pd-picklist">
              {pickable.map((c) => (
                <button key={c.id} className="pd-pick" onClick={() => enroll(c)}>
                  <Plus size={13} />
                  <span className="pd-pick-name">{c.name}</span>
                  <span className="pd-pick-sub">{c.email || c.org || "—"}</span>
                </button>
              ))}
              {pickable.length === 0 && (
                <div className="empty" style={{ padding: 10 }}>
                  {contacts.length === 0 ? "No contacts yet." : "No matching contacts."}
                </div>
              )}
            </div>
          </div>
        )}

        {roster.length === 0 ? (
          <div className="empty" style={{ padding: "14px 0 4px" }}>No one is enrolled yet.</div>
        ) : (
          <div className="pd-rows">
            {roster.map((en) => {
              const c = contactById.get(en.contact_id);
              const est = ENROLLMENT_STATUS_COLOR[(en.status || "").toLowerCase()] ?? FALLBACK;
              const per = enrollmentMonthly(en, program);
              return (
                <div className="pd-row" key={en.id}>
                  <div className="pd-row-name">
                    {c ? (
                      <Link href={`/contacts/${c.id}`} className="pd-link">
                        {c.name}
                      </Link>
                    ) : (
                      <span className="pd-unknown">(unknown contact)</span>
                    )}
                    {c?.email && <span className="pd-row-sub">{c.email}</span>}
                  </div>
                  <span className="statuschip" style={{ color: est, background: `${est}1e`, borderColor: `${est}55` }}>
                    {en.status || "active"}
                  </span>
                  <span className="pd-row-rate">{per > 0 ? `${money(per)} / mo` : "—"}</span>
                  <button className="iconbtn danger" aria-label="Unenroll" onClick={() => unenroll(en)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AttachmentsSection parentType="program" parentId={program.id} />

      {editing && (
        <ProgramModal
          initial={editing}
          entities={entities}
          onSave={saveProgram}
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
