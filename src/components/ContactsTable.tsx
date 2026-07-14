"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { CONTACT_TYPES, type Contact } from "@/lib/contacts";
import ContactModal from "./ContactModal";

interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}
const FALLBACK = "#8C7B5C";

export default function ContactsTable({
  initial,
  entities,
}: {
  initial: Contact[];
  entities: EntityOpt[];
}) {
  const [contacts, setContacts] = useState<Contact[]>(initial);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeF, setTypeF] = useState("all");
  const [entityF, setEntityF] = useState("all");

  const colorOf = (id: string) => entities.find((e) => e.id === id)?.color ?? FALLBACK;
  const labelOf = (id: string) => entities.find((e) => e.id === id)?.short || id;

  const typeOptions = useMemo(
    () => Array.from(new Set<string>([...CONTACT_TYPES, ...contacts.map((c) => c.type).filter(Boolean)])),
    [contacts],
  );
  const filtered = contacts.filter(
    (c) => (typeF === "all" || c.type === typeF) && (entityF === "all" || c.entity === entityF),
  );

  async function api(method: string, body: Record<string, unknown>): Promise<Contact> {
    const res = await fetch("/api/contacts", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.row as Contact;
  }

  const payload = (c: Contact) => ({
    name: c.name,
    role: c.role,
    org: c.org,
    type: c.type,
    email: c.email,
    phone: c.phone,
    entity: c.entity,
    notes: c.notes,
  });

  async function save(form: Contact) {
    if (form.id.startsWith("temp-")) {
      setEditing(null);
      setError("That contact is still saving — give it a moment, then edit again.");
      return;
    }
    setEditing(null);
    if (form.id) {
      const prev = contacts.find((c) => c.id === form.id);
      setContacts((cur) => cur.map((c) => (c.id === form.id ? { ...c, ...form } : c)));
      try {
        const row = await api("PATCH", { id: form.id, ...payload(form) });
        setContacts((cur) => cur.map((c) => (c.id === form.id ? row : c)));
      } catch (e) {
        if (prev) setContacts((cur) => cur.map((c) => (c.id === form.id ? prev : c)));
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      const tempId = "temp-" + Math.random().toString(36).slice(2, 8);
      setContacts((cur) => [{ ...form, id: tempId }, ...cur]);
      try {
        const row = await api("POST", payload(form));
        setContacts((cur) => cur.map((c) => (c.id === tempId ? row : c)));
      } catch (e) {
        setContacts((cur) => cur.filter((c) => c.id !== tempId));
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function remove(c: Contact) {
    if (c.id.startsWith("temp-")) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete "${c.name}"? This can't be undone.`)) return;
    const idx = contacts.findIndex((x) => x.id === c.id);
    setContacts((cur) => cur.filter((x) => x.id !== c.id));
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Delete failed (${res.status})`);
    } catch (e) {
      setContacts((cur) => {
        if (cur.some((x) => x.id === c.id)) return cur;
        const next = cur.slice();
        next.splice(idx < 0 ? next.length : idx, 0, c);
        return next;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const blank: Contact = {
    id: "",
    name: "",
    role: "",
    org: "",
    type: "",
    email: "",
    phone: "",
    entity: "",
    notes: "",
    updated_at: "",
  };

  return (
    <>
      <div className="ctoolbar">
        <div className="cfilters">
          <span className="flabel">Filter</span>
          <select className="fsel" value={typeF} onChange={(e) => setTypeF(e.target.value)} aria-label="Filter by type">
            <option value="all">All types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
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
          <span className="ccount">
            {filtered.length} of {contacts.length}
          </span>
        </div>
        <button className="addbtn" onClick={() => setEditing(blank)}>
          <Plus size={16} /> Add contact
        </button>
      </div>

      <div className="panel cc-fade ctable">
        <table className="contacts">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Org</th>
              <th>Type</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Entity</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="c-name">{c.name}</span>
                </td>
                <td className="c-sub">{c.role || "—"}</td>
                <td className="c-sub">{c.org || "—"}</td>
                <td>{c.type ? <span className="chip">{c.type}</span> : <span className="c-sub">—</span>}</td>
                <td>
                  {c.email ? (
                    <a className="c-link" href={`mailto:${c.email}`}>
                      {c.email}
                    </a>
                  ) : (
                    <span className="c-sub">—</span>
                  )}
                </td>
                <td className="c-sub">{c.phone || "—"}</td>
                <td>
                  {c.entity ? (
                    <span className="edot">
                      <i style={{ background: colorOf(c.entity) }} />
                      {labelOf(c.entity)}
                    </span>
                  ) : (
                    <span className="c-sub">—</span>
                  )}
                </td>
                <td className="c-actions">
                  <button className="iconbtn" aria-label="Edit" onClick={() => setEditing(c)}>
                    <Pencil size={14} />
                  </button>
                  <button className="iconbtn danger" aria-label="Delete" onClick={() => remove(c)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="c-empty">
                  {contacts.length === 0 ? "No contacts yet." : "No contacts match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ContactModal initial={editing} entities={entities} onSave={save} onClose={() => setEditing(null)} />
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
