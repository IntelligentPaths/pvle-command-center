import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, KanbanSquare, Users, BookOpen, CheckSquare,
  Plus, Pencil, Trash2, X, RotateCcw, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ---------- brand ---------- */
const C = {
  gold: "#FBCD32", amber: "#F5A623", deep: "#E38C07", rust: "#B22714",
  brown: "#381F00", black: "#1C1B20", cream: "#FBF6EC", line: "#E7D9BD",
  bronze: "#9C6B1E", burnt: "#A8581C", green: "#3F7D20", gray: "#9CA3AF",
};
const DISPLAY = "'Cormorant Garamond', Georgia, serif";
const BODY = "'Montserrat', system-ui, sans-serif";

const ENTITIES = [
  { id: "Ecosystem", name: "Ecosystem (Shared)", color: C.brown },
  { id: "UYN", name: "Ubuntu y Nosotros", color: C.deep },
  { id: "PVY", name: "Pura Vida Youth", color: C.amber },
  { id: "Sankofa", name: "Sankofa Legacy School", color: C.rust },
  { id: "Roots", name: "Roots Rediscovered", color: C.bronze },
  { id: "PVALD", name: "Pura Vida Afro-Latin Dance", color: C.burnt },
];
const entColor = (id) => (ENTITIES.find((e) => e.id === id) || {}).color || C.gray;

const STAGES = ["Researching", "Drafting", "Submitted", "Decision", "Awarded", "Declined"];
const STAGE_COLOR = {
  Researching: C.gray, Drafting: C.gold, Submitted: C.deep,
  Decision: C.burnt, Awarded: C.green, Declined: C.rust,
};

/* ---------- seed data (real PVLE) ---------- */
const SEED = {
  pipeline: [
    { name: "Pathways in Practice (S2L CTE)", funder: "Fort Worth ISD", entity: "PVY", type: "Contract", amount: 14000, stage: "Submitted", owner: "Juleon", decisionDate: "", notes: "$14,000 base + $1,750 per pathway. DHJ zone, decision-maker Faith Nibbs. ~3-week decision window." },
    { name: "Sankofa SCORE Business Plan", funder: "SCORE / grant", entity: "Sankofa", type: "Grant", amount: 0, stage: "Submitted", owner: "Juleon", decisionDate: "", notes: "Investor & grant edition submitted. ~$175k launch capital ask." },
    { name: "Fort Worth After-School", funder: "FWAS", entity: "PVY", type: "Contract", amount: 0, stage: "Researching", owner: "Juleon", decisionDate: "", notes: "Unlocks after district yes." },
    { name: "Local Lift Social Innovation Pitch", funder: "Tarrant County", entity: "Ecosystem", type: "Other", amount: 0, stage: "Researching", owner: "Waleed", decisionDate: "", notes: "Pitch competition — confirm deadline." },
    { name: "Rainwater Grant", funder: "Rainwater", entity: "PVY", type: "Grant", amount: 0, stage: "Declined", owner: "Juleon", decisionDate: "", notes: "No award letter received." },
  ],
  contacts: [
    { name: "Juleon Lewis", role: "Founder", org: "Pura Vida Legacy Ecosystem", type: "Internal", email: "", phone: "", notes: "Founder/client. Comms via WhatsApp & voice notes." },
    { name: "Waleed Amer", role: "Fractional CTO", org: "Intelligent Paths", type: "Vendor", email: "", phone: "", notes: "Technical lead / studio engagement." },
    { name: "Bertha", role: "Marketing", org: "Pura Vida Youth", type: "Internal", email: "", phone: "", notes: "PVY marketing; content calendar." },
    { name: "Faith Nibbs", role: "Decision-maker", org: "Fort Worth ISD", type: "Partner", email: "", phone: "", notes: "Owns the FWISD CTE pilot decision (DHJ zone)." },
    { name: "Jennifer Trippett", role: "Platform / CTO", org: "Missing Piece Tech", type: "Vendor", email: "", phone: "", notes: "Built Umoja; owns DNS/Cloudflare. Professional but territorial." },
    { name: "Grant Writer", role: "Grant writer", org: "TBD", type: "Vendor", email: "", phone: "", notes: "Supports grant submissions." },
  ],
  programs: [
    { name: "Umoja", entity: "UYN", category: "Product", status: "Priority", notes: "Learning platform. 90-day priority." },
    { name: "Seed to Legacy (S2L)", entity: "UYN", category: "Product", status: "Priority", notes: "Mentorship / CTE curriculum. 90-day priority." },
    { name: "Legacy Steps", entity: "UYN", category: "Product", status: "Active", notes: "" },
    { name: "Griot", entity: "UYN", category: "Product", status: "In Development", notes: "One-liner needed (closes entity map)." },
    { name: "Forge", entity: "UYN", category: "Product", status: "In Development", notes: "One-liner needed." },
    { name: "Insight", entity: "UYN", category: "Product", status: "In Development", notes: "One-liner needed." },
    { name: "PVY After-School", entity: "PVY", category: "Program", status: "Priority", notes: "Community-integrated enrichment. 90-day priority." },
    { name: "Pathways in Practice", entity: "PVY", category: "Program", status: "Active", notes: "In-school/after-school CTE pilot with FWISD." },
    { name: "Sankofa Legacy School", entity: "Sankofa", category: "School", status: "Active", notes: "K-5 microschool. DHJ / 76106. Accreditation Nov 2026." },
  ],
  tasks: [
    { task: "Define Griot / Forge / Insight one-liners", related: "UYN Products", owner: "Juleon", status: "To Do", due: "", notes: "Closes the entity map." },
    { task: "Map student journey by age band", related: "Entity map", owner: "Juleon", status: "To Do", due: "", notes: "" },
    { task: "Migrate SendGrid to Sankofa account", related: "Sankofa website", owner: "Waleed", status: "To Do", due: "", notes: "" },
    { task: "Stand up CRM / data layer", related: "Ecosystem", owner: "Waleed", status: "In Progress", due: "", notes: "This tool." },
    { task: "Build Drive folder structure", related: "Ecosystem", owner: "Waleed", status: "Done", due: "", notes: "Apps Script run." },
    { task: "Submit SCORE business plan", related: "Sankofa", owner: "Juleon", status: "Done", due: "", notes: "" },
  ],
};

const KEY = "pvle-crm-db";
const money = (n) => (n ? "$" + Number(n).toLocaleString() : "\u2014");
const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- field schemas ---------- */
const SCHEMA = {
  pipeline: [
    { k: "name", label: "Opportunity" }, { k: "funder", label: "Funder / source" },
    { k: "entity", label: "Entity", type: "entity" },
    { k: "type", label: "Type", type: "select", opts: ["Grant", "Contract", "Voucher", "Donation", "Other"] },
    { k: "amount", label: "Amount ($)", type: "number" },
    { k: "stage", label: "Stage", type: "select", opts: STAGES },
    { k: "owner", label: "Owner" }, { k: "decisionDate", label: "Decision date", type: "date" },
    { k: "notes", label: "Notes", type: "area" },
  ],
  contacts: [
    { k: "name", label: "Name" }, { k: "role", label: "Role" }, { k: "org", label: "Organization" },
    { k: "type", label: "Type", type: "select", opts: ["Internal", "Vendor", "Partner", "Prospect"] },
    { k: "email", label: "Email" }, { k: "phone", label: "Phone" }, { k: "notes", label: "Notes", type: "area" },
  ],
  programs: [
    { k: "name", label: "Name" }, { k: "entity", label: "Entity", type: "entity" },
    { k: "category", label: "Category", type: "select", opts: ["Product", "Program", "School"] },
    { k: "status", label: "Status", type: "select", opts: ["Priority", "Active", "In Development", "Planned"] },
    { k: "notes", label: "Notes", type: "area" },
  ],
  tasks: [
    { k: "task", label: "Task" }, { k: "related", label: "Related to" }, { k: "owner", label: "Owner" },
    { k: "status", label: "Status", type: "select", opts: ["To Do", "In Progress", "Blocked", "Done"] },
    { k: "due", label: "Due", type: "date" }, { k: "notes", label: "Notes", type: "area" },
  ],
};

/* ================= component ================= */
export default function App() {
  const [db, setDb] = useState(null);
  const [view, setView] = useState("dashboard");
  const [edit, setEdit] = useState(null); // {coll, idx|null, data}

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const r = await window.storage.get(KEY, true);
          if (live && r && r.value) { setDb(JSON.parse(r.value)); return; }
        }
      } catch (e) { /* no key yet */ }
      if (live) setDb(withIds(SEED));
    })();
    return () => { live = false; };
  }, []);

  function withIds(obj) {
    const o = JSON.parse(JSON.stringify(obj));
    Object.keys(o).forEach((k) => o[k].forEach((r) => { if (!r.id) r.id = uid(); }));
    return o;
  }
  async function persist(next) {
    setDb(next);
    try {
      if (typeof window !== "undefined" && window.storage)
        await window.storage.set(KEY, JSON.stringify(next), true);
    } catch (e) { /* keep in-memory */ }
  }
  function save(coll, idx, data) {
    const next = { ...db, [coll]: [...db[coll]] };
    if (idx === null) next[coll].unshift({ ...data, id: uid() });
    else next[coll][idx] = { ...next[coll][idx], ...data };
    persist(next); setEdit(null);
  }
  function remove(coll, idx) {
    const next = { ...db, [coll]: db[coll].filter((_, i) => i !== idx) };
    persist(next);
  }
  function moveStage(idx, dir) {
    const row = db.pipeline[idx];
    const i = STAGES.indexOf(row.stage) + dir;
    if (i < 0 || i >= STAGES.length) return;
    const next = { ...db, pipeline: [...db.pipeline] };
    next.pipeline[idx] = { ...row, stage: STAGES[i] };
    persist(next);
  }
  function resetAll() {
    if (typeof window !== "undefined" && window.confirm("Reset all records to the seeded starting data?"))
      persist(withIds(SEED));
  }

  if (!db) return (
    <div style={{ fontFamily: BODY, background: C.cream, minHeight: "100vh" }}
      className="flex items-center justify-center text-stone-500">Loading your workspace\u2026</div>
  );

  const NAV = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["pipeline", "Pipeline", KanbanSquare],
    ["contacts", "Contacts", Users],
    ["programs", "Programs", BookOpen],
    ["tasks", "Tasks", CheckSquare],
  ];

  return (
    <div style={{ fontFamily: BODY, background: C.cream, minHeight: "100vh", color: C.black }} className="flex">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap');`}</style>

      {/* sidebar */}
      <aside style={{ background: C.brown }} className="w-60 shrink-0 min-h-screen flex flex-col">
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div className="flex items-center gap-2">
            <div style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.deep})` }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold" >
              <span style={{ color: C.brown, fontFamily: DISPLAY, fontSize: 20 }}>P</span>
            </div>
            <div style={{ color: C.cream }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 19, lineHeight: 1 }}>Pura Vida</div>
              <div style={{ color: C.gold, fontSize: 10, letterSpacing: 2 }}>LEGACY ECOSYSTEM</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(([id, label, Icon]) => {
            const on = view === id;
            return (
              <button key={id} onClick={() => setView(id)}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors"
                style={{ color: on ? C.brown : "rgba(251,246,236,.78)", background: on ? C.gold : "transparent",
                  fontWeight: on ? 600 : 500 }}>
                <Icon size={17} /> {label}
              </button>
            );
          })}
        </nav>
        <button onClick={resetAll} className="m-4 flex items-center justify-center gap-2 py-2 rounded-lg text-xs"
          style={{ color: "rgba(251,246,236,.6)", border: "1px solid rgba(255,255,255,.12)" }}>
          <RotateCcw size={13} /> Reset to sample data
        </button>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0">
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.amber}, ${C.deep}, ${C.rust})` }} />
        <div className="px-8 py-7 max-w-6xl">
          {view === "dashboard" && <Dashboard db={db} go={setView} />}
          {view === "pipeline" && <Pipeline db={db} onAdd={() => setEdit({ coll: "pipeline", idx: null, data: { stage: "Researching", type: "Grant", entity: "Ecosystem" } })}
            onEdit={(i) => setEdit({ coll: "pipeline", idx: i, data: db.pipeline[i] })} onDel={(i) => remove("pipeline", i)} onMove={moveStage} />}
          {view === "contacts" && <Table coll="contacts" title="Contacts" db={db}
            cols={[["name", "Name"], ["role", "Role"], ["org", "Organization"], ["type", "Type"]]}
            onAdd={() => setEdit({ coll: "contacts", idx: null, data: { type: "Internal" } })}
            onEdit={(i) => setEdit({ coll: "contacts", idx: i, data: db.contacts[i] })} onDel={(i) => remove("contacts", i)} />}
          {view === "programs" && <Programs db={db}
            onAdd={() => setEdit({ coll: "programs", idx: null, data: { entity: "UYN", category: "Product", status: "Active" } })}
            onEdit={(i) => setEdit({ coll: "programs", idx: i, data: db.programs[i] })} onDel={(i) => remove("programs", i)} />}
          {view === "tasks" && <Tasks db={db} persist={persist}
            onAdd={() => setEdit({ coll: "tasks", idx: null, data: { status: "To Do", owner: "Juleon" } })}
            onEdit={(i) => setEdit({ coll: "tasks", idx: i, data: db.tasks[i] })} onDel={(i) => remove("tasks", i)} />}
        </div>
      </main>

      {edit && <Editor edit={edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}

/* ---------- shared bits ---------- */
function H({ title, sub, action }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 34, color: C.brown, lineHeight: 1 }}>{title}</h1>
        {sub && <p className="text-sm text-stone-500 mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function AddBtn({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white"
      style={{ background: C.deep }}>
      <Plus size={16} /> {label}
    </button>
  );
}
function Chip({ text, color }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
    style={{ background: color + "22", color }}>{text}</span>;
}
function EntityDot({ id }) {
  const e = ENTITIES.find((x) => x.id === id);
  return <span className="inline-flex items-center gap-1.5 text-xs text-stone-600">
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: entColor(id) }} />{e ? e.name.replace(" (Shared)", "") : id}</span>;
}
function IconBtn({ onClick, children }) {
  return <button onClick={onClick} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700">{children}</button>;
}
function Card({ children, className = "", style = {} }) {
  return <div className={"bg-white rounded-xl " + className} style={{ border: `1px solid ${C.line}`, ...style }}>{children}</div>;
}

/* ---------- dashboard ---------- */
function Dashboard({ db, go }) {
  const open = db.pipeline.filter((p) => p.stage !== "Declined" && p.stage !== "Awarded");
  const openVal = open.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const won = db.pipeline.filter((p) => p.stage === "Awarded").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const openTasks = db.tasks.filter((t) => t.status !== "Done").length;
  const byStage = STAGES.filter((s) => s !== "Declined").map((s) => ({
    stage: s, value: db.pipeline.filter((p) => p.stage === s).reduce((a, p) => a + (Number(p.amount) || 0), 0),
    count: db.pipeline.filter((p) => p.stage === s).length,
  }));
  const stats = [
    ["Open pipeline", money(openVal), C.deep], ["Won", money(won), C.green],
    ["Active opportunities", open.length, C.amber], ["Contacts", db.contacts.length, C.brown],
    ["Open tasks", openTasks, C.rust],
  ];
  return (
    <div>
      <H title="Dashboard" sub="Your ecosystem at a glance" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map(([label, val, color]) => (
          <Card key={label} className="p-4">
            <div className="text-xs text-stone-500">{label}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 28, color, lineHeight: 1.1 }} className="mt-1">{val}</div>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3" style={{ color: C.brown }}>Pipeline value by stage</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStage} margin={{ left: -10 }}>
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#78716c" }} />
              <YAxis tickFormatter={(v) => "$" + v / 1000 + "k"} tick={{ fontSize: 11, fill: "#78716c" }} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {byStage.map((d) => <Cell key={d.stage} fill={STAGE_COLOR[d.stage]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: C.brown }}>What needs attention</div>
            <button onClick={() => go("tasks")} className="text-xs" style={{ color: C.deep }}>All tasks \u2192</button>
          </div>
          <div className="space-y-2">
            {db.tasks.filter((t) => t.status !== "Done").slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">{t.task}</span>
                <Chip text={t.owner || "\u2014"} color={C.burnt} />
              </div>
            ))}
            {db.tasks.filter((t) => t.status !== "Done").length === 0 && <div className="text-sm text-stone-400">All caught up.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- pipeline (kanban) ---------- */
function Pipeline({ db, onAdd, onEdit, onDel, onMove }) {
  const cols = STAGES.map((s) => ({
    stage: s, items: db.pipeline.map((p, i) => ({ p, i })).filter((x) => x.p.stage === s),
  }));
  return (
    <div>
      <H title="Funding Pipeline" sub="Grants, contracts & opportunities across the ecosystem"
        action={<AddBtn onClick={onAdd} label="Add opportunity" />} />
      <div className="flex gap-3 overflow-x-auto pb-3">
        {cols.map(({ stage, items }) => {
          const sum = items.reduce((a, x) => a + (Number(x.p.amount) || 0), 0);
          return (
            <div key={stage} className="w-60 shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: STAGE_COLOR[stage] }}>{stage}</span>
                <span className="text-xs text-stone-400">{items.length}{sum ? " \u00b7 " + money(sum) : ""}</span>
              </div>
              <div className="space-y-2">
                {items.map(({ p, i }) => (
                  <div key={p.id} className="bg-white rounded-lg p-3 group" style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${entColor(p.entity)}` }}>
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-sm font-semibold text-stone-800 leading-tight">{p.name}</div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconBtn onClick={() => onEdit(i)}><Pencil size={13} /></IconBtn>
                        <IconBtn onClick={() => onDel(i)}><Trash2 size={13} /></IconBtn>
                      </div>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">{p.funder}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold" style={{ color: C.brown }}>{money(p.amount)}</span>
                      {p.owner && <Chip text={p.owner} color={C.burnt} />}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${C.cream}` }}>
                      <EntityDot id={p.entity} />
                      <div className="flex gap-0.5">
                        <IconBtn onClick={() => onMove(i, -1)}><ChevronLeft size={14} /></IconBtn>
                        <IconBtn onClick={() => onMove(i, 1)}><ChevronRight size={14} /></IconBtn>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-xs text-stone-300 px-1 py-3">\u2014</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- generic table (contacts) ---------- */
function Table({ coll, title, db, cols, onAdd, onEdit, onDel }) {
  const rows = db[coll];
  return (
    <div>
      <H title={title} sub={`${rows.length} records`} action={<AddBtn onClick={onAdd} label={"Add " + title.toLowerCase().replace(/s$/, "")} />} />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.cream }}>
            {cols.map(([, label]) => <th key={label} className="text-left font-semibold px-5 py-3 text-stone-600">{label}</th>)}
            <th className="px-5 py-3"></th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="group" style={{ borderTop: `1px solid ${C.line}` }}>
                {cols.map(([k], ci) => (
                  <td key={k} className="px-5 py-3">
                    {ci === 0 ? <span className="font-semibold text-stone-800">{r[k]}</span>
                      : k === "type" ? <Chip text={r[k]} color={C.deep} /> : <span className="text-stone-600">{r[k]}</span>}
                  </td>
                ))}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span className="opacity-0 group-hover:opacity-100">
                    <IconBtn onClick={() => onEdit(i)}><Pencil size={14} /></IconBtn>
                    <IconBtn onClick={() => onDel(i)}><Trash2 size={14} /></IconBtn>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- programs ---------- */
function Programs({ db, onAdd, onEdit, onDel }) {
  const statusColor = { Priority: C.rust, Active: C.green, "In Development": C.amber, Planned: C.gray };
  return (
    <div>
      <H title="Programs & Products" sub="The six-product suite, programs & school"
        action={<AddBtn onClick={onAdd} label="Add item" />} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {db.programs.map((p, i) => (
          <div key={p.id} className="bg-white rounded-xl p-4 group" style={{ border: `1px solid ${C.line}`, borderTop: `3px solid ${entColor(p.entity)}` }}>
            <div className="flex items-start justify-between">
              <div className="font-semibold text-stone-800">{p.name}</div>
              <span className="opacity-0 group-hover:opacity-100 flex">
                <IconBtn onClick={() => onEdit(i)}><Pencil size={13} /></IconBtn>
                <IconBtn onClick={() => onDel(i)}><Trash2 size={13} /></IconBtn>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Chip text={p.status} color={statusColor[p.status] || C.gray} />
              <span className="text-xs text-stone-400">{p.category}</span>
            </div>
            {p.notes && <div className="text-xs text-stone-500 mt-2 leading-snug">{p.notes}</div>}
            <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${C.cream}` }}><EntityDot id={p.entity} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- tasks ---------- */
function Tasks({ db, persist, onAdd, onEdit, onDel }) {
  const order = { "To Do": 0, "In Progress": 1, Blocked: 2, Done: 3 };
  const sc = { "To Do": C.gray, "In Progress": C.deep, Blocked: C.rust, Done: C.green };
  const rows = db.tasks.map((t, i) => ({ t, i })).sort((a, b) => order[a.t.status] - order[b.t.status]);
  function toggle(i) {
    const next = { ...db, tasks: [...db.tasks] };
    next.tasks[i] = { ...next.tasks[i], status: next.tasks[i].status === "Done" ? "To Do" : "Done" };
    persist(next);
  }
  return (
    <div>
      <H title="Tasks" sub={`${db.tasks.filter((t) => t.status !== "Done").length} open`} action={<AddBtn onClick={onAdd} label="Add task" />} />
      <Card className="overflow-hidden">
        {rows.map(({ t, i }, n) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3 group" style={{ borderTop: n ? `1px solid ${C.line}` : "none" }}>
            <button onClick={() => toggle(i)} className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
              style={{ border: `2px solid ${t.status === "Done" ? C.green : C.line}`, background: t.status === "Done" ? C.green : "white" }}>
              {t.status === "Done" && <span style={{ color: "white", fontSize: 10 }}>\u2713</span>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: t.status === "Done" ? "#a8a29e" : "#292524", textDecoration: t.status === "Done" ? "line-through" : "none" }}>{t.task}</div>
              <div className="text-xs text-stone-400">{t.related}{t.due ? " \u00b7 due " + t.due : ""}</div>
            </div>
            <Chip text={t.owner || "\u2014"} color={C.burnt} />
            <Chip text={t.status} color={sc[t.status]} />
            <span className="opacity-0 group-hover:opacity-100 flex">
              <IconBtn onClick={() => onEdit(i)}><Pencil size={14} /></IconBtn>
              <IconBtn onClick={() => onDel(i)}><Trash2 size={14} /></IconBtn>
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- editor modal ---------- */
function Editor({ edit, onClose, onSave }) {
  const fields = SCHEMA[edit.coll];
  const [data, setData] = useState(edit.data || {});
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const title = (edit.idx === null ? "Add " : "Edit ") + edit.coll.replace(/s$/, "");
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(28,27,32,.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ border: `1px solid ${C.line}`, maxHeight: "88vh" }}>
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white" style={{ borderBottom: `1px solid ${C.line}` }}>
          <h3 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.brown }} className="capitalize">{title}</h3>
          <IconBtn onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <div className="p-6 space-y-3">
          {fields.map((f) => (
            <div key={f.k}>
              <label className="block text-xs font-medium text-stone-500 mb-1">{f.label}</label>
              {f.type === "area" ? (
                <textarea value={data[f.k] || ""} onChange={(e) => set(f.k, e.target.value)} rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
              ) : f.type === "select" ? (
                <select value={data[f.k] || ""} onChange={(e) => set(f.k, e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-white" style={{ border: `1px solid ${C.line}` }}>
                  {f.opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "entity" ? (
                <select value={data[f.k] || ""} onChange={(e) => set(f.k, e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-white" style={{ border: `1px solid ${C.line}` }}>
                  {ENTITIES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              ) : (
                <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={data[f.k] || ""} onChange={(e) => set(f.k, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: `1px solid ${C.line}` }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 sticky bottom-0 bg-white" style={{ borderTop: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100">Cancel</button>
          <button onClick={() => onSave(edit.coll, edit.idx, data)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.deep }}>Save</button>
        </div>
      </div>
    </div>
  );
}
