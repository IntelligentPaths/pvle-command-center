import React, { useState } from "react";
import {
  Flame, Check, ChevronRight, ChevronLeft,
  Bell, Compass, Radio, Sparkles, Play, X, Presentation,
} from "lucide-react";

/* ================= ecosystem data ================= */
const ENTITIES = [
  { id: "UYN", name: "Ubuntu y Nosotros", tag: "PLATFORM · 6 PRODUCTS", color: "#E0821C", pct: 72, status: "Active", note: "Umoja & S2L in priority" },
  { id: "PVY", name: "Pura Vida Youth", tag: "PROGRAMS · AFTER-SCHOOL", color: "#E7663A", pct: 58, status: "Launching", note: "FWSA flyer out to parents" },
  { id: "SNK", name: "Sankofa Legacy School", tag: "K–5 MICROSCHOOL", color: "#C33A24", pct: 40, status: "Building", note: "Founding cohort · accred. Nov" },
  { id: "DANCE", name: "Afro-Latin Dance", tag: "COMMUNITY · ADULT", color: "#C24B7A", pct: 45, status: "Active", note: "Weekly community classes" },
  { id: "ROOTS", name: "Roots Rediscovered", tag: "HERITAGE · DORMANT", color: "#7E8C3E", pct: 12, status: "Idle", note: "No active initiatives" },
];

const PRESENT = {
  UYN: {
    name: "Ubuntu y Nosotros", tagline: "The engine of the ecosystem.",
    pal: { primary: "#E0821C", deep: "#5B3A8A", ink: "#241832", bg: "#FAF7FB", soft: "#EEE7F5" },
    what: "Ubuntu y Nosotros is the platform and product layer beneath everything Pura Vida builds — the learning tools, mentorship rails, and shared systems that let every program run without reinventing the wheel.",
    who: "The programs, schools, and partners who run on Pura Vida's tools.",
    signature: "Build the infrastructure once; let every program stand on it.",
    facts: [["6", "products"], ["2", "in priority"], ["Powers", "PVY & Sankofa"], ["Shared", "infrastructure"]],
    offers: [
      ["Umoja", "The learning and community platform at the center of it all"],
      ["Seed to Legacy (S2L)", "A mentorship and career-pathway model that maps a young person's growing network"],
      ["Legacy Steps", "A guided framework for progressing learners step by step"],
      ["Griot · Forge · Insight", "Emerging products expanding the suite — more soon"],
    ],
    why: [
      ["Efficiency", "One shared platform means every program launches faster and cheaper"],
      ["Consistency", "A common experience and data model across the whole ecosystem"],
      ["Replicability", "What works in one program can be handed to the next — and to partners"],
    ],
  },
  PVY: {
    name: "Pura Vida Youth", tagline: "More than after-school care.",
    pal: { primary: "#F7A81B", deep: "#0C6F64", ink: "#12312D", bg: "#FBFDF8", soft: "#DCF0EC" },
    what: "Pura Vida Youth turns the hours after school into the best part of a kid's day — hands-on STEAM, real homework support, and mentors who connect learning to the world beyond the classroom.",
    who: "Families at partner schools like Fort Worth STEAM Academy.",
    signature: "Students learn best when they're solving real problems alongside caring mentors.",
    facts: [["Grade 6", "this fall"], ["3:30–6:00", "Mon–Fri"], ["$80", "per week"], ["30", "spots"]],
    offers: [
      ["After-school program", "Structured, supervised, and enriching — Monday through Friday"],
      ["Hands-on STEAM", "Building, designing, and creating real projects"],
      ["Homework & IXL support", "45 focused, supported minutes every day"],
      ["Caring mentors", "Positive role models who cheer kids on"],
      ["Career exploration", "A hands-on peek at engineering, media, trades, and more"],
      ["Daily healthy snack", "Fuel for the afternoon — included"],
    ],
    why: [
      ["Safe & enriching", "A place to belong after school, not just be watched"],
      ["Affordable", "$80/week all-in, with scholarships and sibling discounts"],
      ["Grows with your child", "A long-term model that deepens year after year"],
    ],
  },
  SNK: {
    name: "Sankofa Legacy School", tagline: "Scholars, leaders, and legacy-makers.",
    pal: { primary: "#E38C07", deep: "#B22714", ink: "#2A1B08", bg: "#FDF8EE", soft: "#F7E9CE" },
    what: "Sankofa Legacy School develops young people who think rigorously, know themselves deeply, create meaningfully, and contribute responsibly — through four pillars: Mastery, Identity, Creation, and Community.",
    who: "Founding families in Diamond Hill–Jarvis seeking rigorous, culturally rooted education.",
    signature: "Where your child is known, challenged, and prepared — academically, culturally, and personally.",
    note: "Sankofa — an Akan concept meaning “go back and fetch it”: reclaim the wisdom of the past to build what comes next.",
    facts: [["K–5", "grades"], ["ESA", "accepted"], ["4 pillars", "framework"], ["Nov 2026", "accreditation"]],
    offers: [
      ["Mastery", "Deep competence in core subjects through reasoning — not memorization"],
      ["Identity", "A strong sense of self grounded in cultural literacy and reflection"],
      ["Creation", "Knowledge applied — building, designing, and producing real work"],
      ["Community", "Learning to lead, collaborate, and contribute to others"],
    ],
    why: [
      ["Known by name", "A small founding cohort where every child is truly seen"],
      ["Rooted and rigorous", "Cultural grounding and high academic expectations, together"],
      ["By and for the community", "A school that reflects the families it serves"],
    ],
  },
  DANCE: {
    name: "Pura Vida Afro-Latin Dance", tagline: "Where culture moves.",
    pal: { primary: "#E7663A", deep: "#B12A5B", ink: "#3A1226", bg: "#FDF6F4", soft: "#F7DDE4" },
    what: "An adult Afro-Latin dance community celebrating heritage, connection, and joy through movement — a place to learn, sweat, and belong.",
    who: "Adults across Fort Worth building community on the dance floor.",
    signature: "Every rhythm carries a history — we dance it forward.",
    facts: [["Adult", "community"], ["Weekly", "classes"], ["All levels", "welcome"]],
    offers: [
      ["Weekly classes", "Afro-Latin styles for every level"],
      ["Community socials", "Dance, connect, and celebrate together"],
      ["Cultural celebration", "Honoring the roots of the rhythm"],
    ],
    why: [
      ["Connection", "Belonging and friendship through shared movement"],
      ["Heritage", "Celebrating Afro-Latin culture and tradition"],
      ["Joy & wellness", "Movement, energy, and joy for adults"],
    ],
  },
  ROOTS: {
    name: "Roots Rediscovered", tagline: "Reclaiming what came before.",
    pal: { primary: "#7E8C3E", deep: "#4A5A22", ink: "#2A2E14", bg: "#F9FAF0", soft: "#E6EAD2" },
    what: "A cultural heritage initiative reconnecting community to story, lineage, and roots. Currently dormant — held in reserve until the moment is right to reactivate.",
    who: "The wider Pura Vida community.",
    signature: "You can't move forward without knowing where you come from.",
    facts: [["Heritage", "focus"], ["Dormant", "status"], ["Ready", "to reactivate"]],
    offers: [
      ["Heritage programming", "Story, lineage, and cultural connection"],
      ["Held in reserve", "Ready to reactivate when the time is right"],
    ],
    why: [
      ["Identity", "Grounding the community in its own history"],
      ["Continuity", "Carrying culture forward across generations"],
    ],
  },
  ALL: {
    name: "Pura Vida Legacy Ecosystem", tagline: "One ecosystem. Many paths. A shared legacy.",
    pal: { primary: "#E3A81C", deep: "#8A3A12", ink: "#2A1B08", bg: "#FDF9EF", soft: "#F5E7CB" },
    what: "A family of youth, education, and community initiatives building competence, character, and legacy across Fort Worth — each a different on-ramp to the same mission.",
    who: "Families, funders, and partners who believe in growing the next generation of leaders.",
    signature: "Competence, character, and confidence to shape their own lives — and lift others.",
    facts: [["5", "initiatives"], ["1", "shared mission"], ["Fort Worth", "rooted"]],
    offers: [
      ["Ubuntu y Nosotros", "The platform and products powering it all"],
      ["Pura Vida Youth", "Youth programs, after-school, and STEAM"],
      ["Sankofa Legacy School", "A K–5 microschool"],
      ["Afro-Latin Dance", "An adult community that moves"],
      ["Roots Rediscovered", "Heritage, held for the right moment"],
    ],
    why: [
      ["Many on-ramps", "A path for every age — child to adult, learner to leader"],
      ["Self-reinforcing", "Each initiative strengthens the others"],
      ["Replicable", "A proven model that can grow beyond Fort Worth"],
    ],
  },
};
const ORDER = ["ALL", "UYN", "PVY", "SNK", "DANCE", "ROOTS"];
const MONO = "'IBM Plex Mono',monospace";

const SEED_QUESTS = [
  { id: 1, t: "Define Griot / Forge / Insight one-liners", who: "Juleon", done: false },
  { id: 2, t: "Schedule PVY after-school launch posts", who: "Bertha", done: false },
  { id: 3, t: "Follow up FWISD on Pathways decision", who: "Juleon", done: true },
  { id: 4, t: "Confirm Local Lift pitch deadline", who: "Waleed", done: false },
  { id: 5, t: "Map student journey by age band", who: "Juleon", done: false },
];
const ATTENTION = [
  { t: "FWISD Pathways decision", when: "~3 weeks", hot: true },
  { t: "Local Lift pitch — confirm deadline", when: "TBD", hot: true },
  { t: "Sankofa accreditation — final step", when: "Nov 2026", hot: false },
  { t: "SendGrid migration (Sankofa)", when: "soon", hot: false },
];
const CONTENT = [
  { day: "MON", t: "After-school teaser", ch: "IG", color: "#E7663A", status: "Scheduled" },
  { day: "WED", t: "Founding family story", ch: "FB", color: "#C33A24", status: "Draft" },
  { day: "THU", t: "STEAM Saturday recap", ch: "IG", color: "#E7663A", status: "Idea" },
  { day: "FRI", t: "Meet a mentor", ch: "TikTok", color: "#E7663A", status: "Idea" },
];

/* ================= bits ================= */
function Ring({ pct, size = 62, stroke = 6, color, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3A2E1F" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease", filter: `drop-shadow(0 0 4px ${color}66)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function EcoMap({ activeId }) {
  const W = 300, H = 210, cx = W / 2, cy = H / 2, R = 78;
  const nodes = ENTITIES.map((e, i) => {
    const a = (-90 + i * (360 / ENTITIES.length)) * Math.PI / 180;
    return { ...e, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const lit = (id) => activeId === "ALL" || activeId === id;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380 }}>
      {nodes.map((n) => (
        <line key={"l" + n.id} x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke={lit(n.id) ? n.color : "#00000022"} strokeWidth={lit(n.id) ? 2 : 1} strokeDasharray={lit(n.id) ? "0" : "3 3"} />
      ))}
      <circle cx={cx} cy={cy} r={20} fill="none" stroke="#00000030" strokeWidth="1.5" />
      <text x={cx} y={cy - 1} textAnchor="middle" fontFamily={MONO} fontSize="7" fontWeight="700" fill="currentColor">PURA</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontFamily={MONO} fontSize="7" fontWeight="700" fill="currentColor">VIDA</text>
      {nodes.map((n) => (
        <g key={n.id} opacity={lit(n.id) ? 1 : 0.32}>
          <circle cx={n.x} cy={n.y} r={activeId === n.id ? 13 : 9} fill={n.color}
            style={{ filter: lit(n.id) ? `drop-shadow(0 0 6px ${n.color}88)` : "none", transition: "r .3s" }} />
          <text x={n.x} y={n.y + (n.y > cy ? 22 : -14)} textAnchor="middle" fontFamily={MONO} fontSize="7.5" fontWeight="600" fill="currentColor">
            {n.name.split(" ")[0]}
          </text>
        </g>
      ))}
    </svg>
  );
}

const navBtn = (p) => ({ width: 34, height: 34, borderRadius: 10, border: `1px solid ${p.primary}44`, background: "transparent", color: p.ink, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" });

function PresentView({ id, onClose, onNav }) {
  const d = PRESENT[id], p = d.pal;
  const [tab, setTab] = useState(0);
  const tabs = ["Overview", "What we offer", "Why it matters", "Where it fits"];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: p.bg, color: p.ink, fontFamily: "'Montserrat',sans-serif", display: "flex", flexDirection: "column", animation: "ccIn .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 26px", borderBottom: `1px solid ${p.primary}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${p.primary},${p.deep})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 19 }}>{id === "ALL" ? "P" : d.name[0]}</div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{d.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: 1.5, color: p.deep, marginTop: 2 }}>PRESENT MODE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => onNav(-1)} style={navBtn(p)}><ChevronLeft size={16} /></button>
          <button onClick={() => onNav(1)} style={navBtn(p)}><ChevronRight size={16} /></button>
          <button onClick={onClose} style={{ ...navBtn(p), background: p.ink, color: p.bg, border: "none" }}><X size={16} /></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "12px 26px 0", flexWrap: "wrap" }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 1, padding: "7px 13px", borderRadius: 20, cursor: "pointer", border: `1px solid ${tab === i ? "transparent" : p.primary + "44"}`, background: tab === i ? p.ink : "transparent", color: tab === i ? p.bg : p.ink, textTransform: "uppercase" }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "28px 26px 40px", maxWidth: 940, width: "100%", margin: "0 auto" }}>
        {tab === 0 && (
          <div style={{ animation: "ccRise .35s ease both" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: p.deep }}>PURA VIDA LEGACY ECOSYSTEM</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(38px,7vw,68px)", fontWeight: 700, lineHeight: 1, letterSpacing: "-1px", margin: "12px 0 0", color: p.ink }}>{d.tagline}</h1>
            <p style={{ fontSize: "clamp(14px,2vw,18px)", lineHeight: 1.5, maxWidth: 640, marginTop: 18, color: p.ink }}>{d.what}</p>
            {d.signature && <div style={{ marginTop: 20, paddingLeft: 16, borderLeft: `3px solid ${p.primary}`, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(17px,2.6vw,23px)", color: p.deep, maxWidth: 600, lineHeight: 1.3 }}>“{d.signature}”</div>}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "8px 14px", borderRadius: 24, background: p.soft }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: p.deep }}>FOR</span>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{d.who}</span>
            </div>
            {d.note && <div style={{ marginTop: 14, fontSize: 11.5, fontStyle: "italic", color: p.ink, opacity: .62, maxWidth: 560, lineHeight: 1.45 }}>{d.note}</div>}
            <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
              {d.facts.map((f, i) => (
                <div key={i} style={{ minWidth: 116, padding: "16px 20px", borderRadius: 14, background: "#fff", border: `1px solid ${p.primary}33`, borderTop: `4px solid ${p.primary}` }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, color: p.deep, lineHeight: 1 }}>{f[0]}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: p.ink, opacity: .6, marginTop: 5, textTransform: "uppercase" }}>{f[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 1 && (
          <div style={{ animation: "ccRise .35s ease both" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: p.ink, marginBottom: 20 }}>What we offer</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {d.offers.map((o, i) => (
                <div key={i} style={{ padding: "20px 22px", borderRadius: 16, background: "#fff", border: `1px solid ${p.primary}2a`, borderLeft: `4px solid ${p.primary}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: p.soft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: p.deep }}>{i + 1}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, fontWeight: 600, color: p.ink }}>{o[0]}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: p.ink, opacity: .75, marginTop: 10, lineHeight: 1.45 }}>{o[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 2 && (
          <div style={{ animation: "ccRise .35s ease both" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: p.ink, marginBottom: 20 }}>Why it matters</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
              {d.why.map((w, i) => (
                <div key={i} style={{ padding: "20px 22px", borderRadius: 16, background: p.soft, border: `1px solid ${p.primary}22` }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, fontWeight: 600, color: p.deep }}>{w[0]}</div>
                  <div style={{ fontSize: 12.5, color: p.ink, opacity: .82, marginTop: 8, lineHeight: 1.45 }}>{w[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 3 && (
          <div style={{ animation: "ccRise .35s ease both", textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: p.ink, marginBottom: 6 }}>Where it fits</h2>
            <p style={{ fontSize: 13, color: p.ink, opacity: .7, maxWidth: 460, margin: "0 auto 10px" }}>{id === "ALL" ? "Five initiatives, one shared mission." : `${d.name} within the Pura Vida Legacy Ecosystem.`}</p>
            <div style={{ color: p.deep, display: "flex", justifyContent: "center" }}><EcoMap activeId={id} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= COMMAND CENTER ================= */
export default function App() {
  const [quests, setQuests] = useState(SEED_QUESTS);
  const [present, setPresent] = useState(null);
  const done = quests.filter((q) => q.done).length;
  const focusPct = Math.round((done / quests.length) * 100);
  const toggle = (id) => setQuests((qs) => qs.map((q) => q.id === id ? { ...q, done: !q.done } : q));
  const nav = (dir) => { const i = ORDER.indexOf(present); setPresent(ORDER[(i + dir + ORDER.length) % ORDER.length]); };

  return (
    <div className="cc">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Montserrat:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .cc{--bg:#16120C;--panel:#201A12;--panel2:#251E14;--edge:#3A2E1F;--gold:#F5B531;--cream:#F2E7CF;--mut:#B7A688;--dim:#8C7B5C;--ok:#7FB86A;
          font-family:'Montserrat',sans-serif;background:
            radial-gradient(1200px 500px at 15% -10%, #2A2012 0%, transparent 60%),
            radial-gradient(900px 500px at 100% 0%, #241A10 0%, transparent 55%), var(--bg);
          color:var(--cream);min-height:100vh;padding:26px 28px 34px;}
        .cc *{box-sizing:border-box;}
        .serif{font-family:'Cormorant Garamond',serif;}
        .eye{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:2.5px;color:var(--dim);text-transform:uppercase;}
        .panel{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--edge);border-radius:16px;}
        .cc-fade{animation:ccRise .5s ease both;}
        @keyframes ccRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes ccIn{from{opacity:0}to{opacity:1}}
        @media (prefers-reduced-motion:reduce){.cc-fade{animation:none}}

        .hq{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:14px;}
        .hq h1{font-size:34px;font-weight:600;line-height:1;letter-spacing:-.3px;}
        .hq h1 b{color:var(--gold);font-weight:600;}
        .status{margin-top:9px;display:flex;gap:16px;flex-wrap:wrap;}
        .status span{font-size:11px;color:var(--mut);display:flex;align-items:center;gap:6px;}
        .status i{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 6px var(--gold);display:inline-block;}
        .hqR{display:flex;align-items:center;gap:12px;}
        .present-btn{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--gold),#E0821C);color:#1A140A;border:none;border-radius:12px;padding:11px 16px;font-family:'Montserrat';font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 4px 14px #F5B53133;}
        .present-btn:hover{filter:brightness(1.06);}
        .momentum{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#3A2A12,#2A2010);border:1px solid #5A431F;border-radius:14px;padding:10px 15px;}
        .momentum .n{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;color:var(--gold);line-height:1;}
        .momentum .l{font-size:9px;letter-spacing:1.5px;color:var(--mut);text-transform:uppercase;}

        .meters{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
        .meter{padding:16px;display:flex;align-items:center;gap:13px;}
        .meter .cap{font-size:10px;letter-spacing:1px;color:var(--dim);text-transform:uppercase;}
        .meter .big{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:700;line-height:1;margin-top:3px;}
        .meter .sub{font-size:10px;color:var(--mut);margin-top:3px;}
        .rval{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;}
        .barwrap{height:6px;border-radius:4px;background:#3A2E1F;margin-top:9px;overflow:hidden;}
        .bar{height:100%;border-radius:4px;}

        .grid{display:grid;grid-template-columns:1.75fr 1fr;gap:16px;align-items:start;}
        .sect-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .sect-h .t{display:flex;align-items:center;gap:8px;font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;}
        .link{font-size:10px;color:var(--dim);display:flex;align-items:center;gap:2px;cursor:pointer;}
        .link:hover{color:var(--gold);}

        .zones{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .zone{position:relative;background:var(--panel);border:1px solid var(--edge);border-left-width:3px;border-radius:13px;padding:14px 15px;overflow:hidden;transition:transform .18s,box-shadow .18s;cursor:pointer;}
        .zone:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,0,0,.4);}
        .zone:hover .pbadge{opacity:1;}
        .zone .glow{position:absolute;right:-30px;top:-30px;width:90px;height:90px;border-radius:50%;opacity:.14;filter:blur(6px);}
        .zone .znm{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;line-height:1;}
        .zone .ztag{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:1.2px;color:var(--dim);margin-top:5px;}
        .zone .znote{font-size:10px;color:var(--mut);margin-top:11px;line-height:1.35;max-width:75%;}
        .pbadge{position:absolute;right:12px;bottom:12px;display:flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.5px;opacity:.5;transition:.18s;}
        .zbar{height:5px;border-radius:3px;background:#3A2E1F;margin-top:11px;overflow:hidden;}
        .zbar i{display:block;height:100%;border-radius:3px;}
        .pulse{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-family:'IBM Plex Mono',monospace;color:var(--mut);}
        .dot{width:6px;height:6px;border-radius:50%;}

        .focus{padding:16px;}
        .fbar{height:8px;border-radius:5px;background:#3A2E1F;overflow:hidden;margin:4px 0 14px;}
        .fbar i{display:block;height:100%;background:linear-gradient(90deg,#F5B531,#E7663A);border-radius:5px;transition:width .5s ease;}
        .quest{display:flex;align-items:center;gap:11px;padding:9px 0;border-top:1px solid var(--edge);}
        .quest:first-of-type{border-top:none;}
        .qbox{width:19px;height:19px;border-radius:6px;border:2px solid #5A4A2C;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;}
        .qbox.on{background:var(--ok);border-color:var(--ok);}
        .qt{font-size:11.5px;font-weight:500;line-height:1.25;}
        .qt.on{color:var(--dim);text-decoration:line-through;}
        .qwho{font-family:'IBM Plex Mono',monospace;font-size:8.5px;color:var(--dim);margin-top:2px;letter-spacing:.5px;}

        .att{padding:15px 16px;margin-top:16px;}
        .arow{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--edge);}
        .arow:first-of-type{border-top:none;}
        .achip{font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 7px;border-radius:6px;white-space:nowrap;}
        .hot{background:#3A1E12;color:#F0916A;border:1px solid #6A3418;}
        .cool{background:#2A2314;color:var(--mut);border:1px solid var(--edge);}

        .content{padding:15px 16px;margin-top:16px;}
        .cweek{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .cslot{background:var(--panel2);border:1px solid var(--edge);border-top-width:3px;border-radius:10px;padding:10px 11px;}
        .cslot .cd{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:1px;color:var(--dim);}
        .cslot .ct{font-size:10.5px;font-weight:600;margin-top:5px;line-height:1.2;}
        .cslot .cm{display:flex;justify-content:space-between;align-items:center;margin-top:8px;}
        .cch{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--mut);}
        .cst{font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 5px;border-radius:4px;}

        @media (max-width:900px){.meters{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}.cweek{grid-template-columns:1fr 1fr}}
      `}</style>

      {present && <PresentView id={present} onClose={() => setPresent(null)} onNav={nav} />}

      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Command Center</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Welcome back, <b>Juleon.</b></h1>
          <div className="status">
            <span><i />4 opportunities in play</span>
            <span><i />2 deadlines this week</span>
            <span><i />4 posts on deck</span>
          </div>
        </div>
        <div className="hqR">
          <button className="present-btn" onClick={() => setPresent("ALL")}><Presentation size={16} /> Present ecosystem</button>
          <div className="momentum"><Flame size={20} color="#F5B531" /><div><div className="n">4 wks</div><div className="l">Content streak</div></div></div>
        </div>
      </div>

      <div className="meters cc-fade">
        <div className="panel meter">
          <Ring pct={38} color="#C33A24"><span className="rval" style={{ color: "#F0A090" }}>38%</span></Ring>
          <div><div className="cap">Founding cohort</div><div className="big">9<span style={{ fontSize: 16, color: "#8C7B5C" }}>/24</span></div><div className="sub">Sankofa · spots filled</div></div>
        </div>
        <div className="panel meter">
          <Ring pct={40} color="#E7663A"><span className="rval" style={{ color: "#F0A090" }}>40%</span></Ring>
          <div><div className="cap">After-school</div><div className="big">12<span style={{ fontSize: 16, color: "#8C7B5C" }}>/30</span></div><div className="sub">PVY · interest so far</div></div>
        </div>
        <div className="panel meter" style={{ display: "block" }}>
          <div className="cap">Funding in play</div>
          <div className="big" style={{ color: "#F5B531" }}>$14K</div>
          <div className="sub">4 active · 1 awaiting decision</div>
          <div className="barwrap"><div className="bar" style={{ width: "55%", background: "linear-gradient(90deg,#F5B531,#E0821C)" }} /></div>
        </div>
        <div className="panel meter">
          <Ring pct={75} color="#E0821C"><span className="rval" style={{ color: "#F5B531" }}>3/4</span></Ring>
          <div><div className="cap">Content ready</div><div className="big">This wk</div><div className="sub">3 of 4 posts staged</div></div>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="panel cc-fade" style={{ padding: 16 }}>
            <div className="sect-h">
              <div className="t"><Compass size={18} color="#F5B531" /> Ecosystem</div>
              <span className="link">Tap a program to present <ChevronRight size={13} /></span>
            </div>
            <div className="zones">
              {ENTITIES.map((e) => (
                <div key={e.id} className="zone" style={{ borderLeftColor: e.color }} onClick={() => setPresent(e.id)}>
                  <div className="glow" style={{ background: e.color }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><div className="znm">{e.name}</div><div className="ztag">{e.tag}</div></div>
                    <div className="pulse"><span className="dot" style={{ background: e.pct > 20 ? e.color : "#6A5C40", boxShadow: e.pct > 20 ? `0 0 6px ${e.color}` : "none" }} />{e.status}</div>
                  </div>
                  <div className="znote">{e.note}</div>
                  <div className="zbar"><i style={{ width: e.pct + "%", background: e.color }} /></div>
                  <div className="pbadge" style={{ color: e.color }}><Play size={9} /> PRESENT</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel content cc-fade">
            <div className="sect-h">
              <div className="t"><Radio size={17} color="#F5B531" /> Content this week</div>
              <span className="link">Full calendar <ChevronRight size={13} /></span>
            </div>
            <div className="cweek">
              {CONTENT.map((c, i) => {
                const st = c.status === "Scheduled" ? { background: "#1E3320", color: "#8FD08A" }
                  : c.status === "Draft" ? { background: "#3A2E14", color: "#F5B531" }
                  : { background: "#2A2314", color: "#B7A688" };
                return (
                  <div key={i} className="cslot" style={{ borderTopColor: c.color }}>
                    <div className="cd">{c.day}</div><div className="ct">{c.t}</div>
                    <div className="cm"><span className="cch">{c.ch}</span><span className="cst" style={st}>{c.status}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="panel focus cc-fade">
            <div className="sect-h">
              <div className="t"><Sparkles size={17} color="#F5B531" /> This week's focus</div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#F5B531" }}>{done}/{quests.length}</span>
            </div>
            <div className="fbar"><i style={{ width: focusPct + "%" }} /></div>
            {quests.map((q) => (
              <div key={q.id} className="quest">
                <div className={"qbox" + (q.done ? " on" : "")} onClick={() => toggle(q.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle(q.id)}>
                  {q.done && <Check size={13} color="#16120C" strokeWidth={3} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className={"qt" + (q.done ? " on" : "")}>{q.t}</div>
                  <div className="qwho">{q.who.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel att cc-fade">
            <div className="sect-h"><div className="t"><Bell size={16} color="#F5B531" /> Needs attention</div></div>
            {ATTENTION.map((a, i) => (
              <div key={i} className="arow">
                <div style={{ flex: 1, fontSize: 11.5, fontWeight: 500 }}>{a.t}</div>
                <span className={"achip " + (a.hot ? "hot" : "cool")}>{a.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
