"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Pencil, Trash2, Search, X, Plus, BookOpen } from "lucide-react";
import type { Contact } from "@/lib/contacts";
import type { Program } from "@/lib/programs";
import {
  ENROLLMENT_STATUS_COLOR,
  enrollmentMonthly,
  money,
  isActive,
  type Enrollment,
} from "@/lib/enrollments";
import ContactModal from "./ContactModal";
import AttachmentsSection from "./AttachmentsSection";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";

export default function ContactDetail({
  contact: initialContact,
  enrollments: initialEnrollments,
  programs,
  entities,
}: {
  contact: Contact;
  enrollments: Enrollment[];
  programs: Program[];
  entities: EntityOpt[];
}) {
  const [contact, setContact] = useState<Contact>(initialContact);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);
  const entity = entities.find((e) => e.id === contact.entity);
  const entityColor = entity?.color ?? FALLBACK;

  const activeProgramIds = useMemo(
    () => new Set(enrollments.filter(isActive).map((e) => e.program_id)),
    [enrollments],
  );
  const pickable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs
      .filter((p) => !activeProgramIds.has(p.id))
      .filter((p) => !q || `${p.name} ${p.category}`.toLowerCase().includes(q))
      .slice(0, 40);
  }, [programs, activeProgramIds, search]);

  async function saveContact(form: Contact) {
    setEditing(null);
    const prev = contact;
    setContact(form);
    try {
      const res = await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          role: form.role,
          org: form.org,
          type: form.type,
          email: form.email,
          phone: form.phone,
          entity: form.entity,
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setContact(data.row as Contact);
    } catch (e) {
      setContact(prev);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function enroll(program: Program) {
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
    const p = programById.get(en.program_id);
    if (typeof window !== "undefined" && !window.confirm(`Unenroll from "${p?.name || "this program"}"? This can't be undone.`)) return;
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

  const roster = [...enrollments].sort((a, b) => Number(isActive(b)) - Number(isActive(a)));

  const fields: [string, ReactNode][] = [
    ["Role", contact.role || "—"],
    ["Organization", contact.org || "—"],
    ["Type", contact.type || "—"],
    ["Email", contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "—"],
    ["Phone", contact.phone || "—"],
    ["Entity", entity ? entity.name : contact.entity || "—"],
  ];

  return (
    <>
      <div className="panel cc-fade pd-meta" style={{ borderTopColor: entityColor }}>
        <div className="pd-meta-main">
          <div className="pd-badges">
            {entity && (
              <span className="edot">
                <i style={{ background: entityColor }} /> {entity.name}
              </span>
            )}
            {contact.type && <span className="chip">{contact.type}</span>}
            {contact.source && <span className="pd-cat">{contact.source}</span>}
          </div>
          <div className="cd-fields">
            {fields.map(([label, val]) => (
              <div className="cd-field" key={label}>
                <span className="cd-flabel">{label}</span>
                <span className="cd-fval">{val}</span>
              </div>
            ))}
          </div>
          {contact.notes && <div className="pd-desc" style={{ marginTop: 12 }}>{contact.notes}</div>}
        </div>
        <button className="iconbtn" aria-label="Edit contact" onClick={() => setEditing(contact)}>
          <Pencil size={15} />
        </button>
      </div>

      <div className="panel cc-fade pd-roster">
        <div className="sect-h">
          <div className="t">
            <BookOpen size={17} color="#F5B531" /> Enrollments
          </div>
          <button className="addbtn" onClick={() => setPicking((v) => !v)}>
            <Plus size={15} /> Enroll in program
          </button>
        </div>

        {picking && (
          <div className="pd-picker">
            <div className="pd-search">
              <Search size={14} />
              <input
                autoFocus
                value={search}
                placeholder="Search programs…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="pd-picklist">
              {pickable.map((p) => (
                <button key={p.id} className="pd-pick" onClick={() => enroll(p)}>
                  <Plus size={13} />
                  <span className="pd-pick-name">{p.name}</span>
                  <span className="pd-pick-sub">{p.category || "—"}</span>
                </button>
              ))}
              {pickable.length === 0 && (
                <div className="empty" style={{ padding: 10 }}>
                  {programs.length === 0 ? "No programs yet." : "No matching programs."}
                </div>
              )}
            </div>
          </div>
        )}

        {roster.length === 0 ? (
          <div className="empty" style={{ padding: "14px 0 4px" }}>Not enrolled in any program yet.</div>
        ) : (
          <div className="pd-rows">
            {roster.map((en) => {
              const p = programById.get(en.program_id);
              const est = ENROLLMENT_STATUS_COLOR[(en.status || "").toLowerCase()] ?? FALLBACK;
              const per = p ? enrollmentMonthly(en, p) : 0;
              return (
                <div className="pd-row" key={en.id}>
                  <div className="pd-row-name">
                    {p ? (
                      <Link href={`/programs/${p.id}`} className="pd-link">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="pd-unknown">(unknown program)</span>
                    )}
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

      <AttachmentsSection parentType="contact" parentId={contact.id} />

      {editing && (
        <ContactModal initial={editing} entities={entities} onSave={saveContact} onClose={() => setEditing(null)} />
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
