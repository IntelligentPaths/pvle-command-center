"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { EntityNode, Palette, PresentData, PresentView } from "@/lib/present";

const MONO = "var(--font-plex-mono), monospace";
const SERIF = "var(--font-cormorant), serif";
const BODY = "var(--font-montserrat), sans-serif";

// Detect client hydration (createPortal needs document.body) without setState-in-effect.
const subscribeNoop = () => () => {};

function EcoMap({ nodes, activeId }: { nodes: EntityNode[]; activeId: string }) {
  const W = 300;
  const H = 210;
  const cx = W / 2;
  const cy = H / 2;
  const R = 78;
  const placed = nodes.map((e, i) => {
    const a = ((-90 + i * (360 / Math.max(1, nodes.length))) * Math.PI) / 180;
    return { ...e, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const lit = (id: string) => activeId === "ALL" || activeId === id;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380 }} aria-hidden="true">
      {placed.map((n) => (
        <line
          key={"l" + n.id}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke={lit(n.id) ? n.color : "#00000022"}
          strokeWidth={lit(n.id) ? 2 : 1}
          strokeDasharray={lit(n.id) ? "0" : "3 3"}
        />
      ))}
      <circle cx={cx} cy={cy} r={20} fill="none" stroke="#00000030" strokeWidth="1.5" />
      <text x={cx} y={cy - 1} textAnchor="middle" fontFamily={MONO} fontSize="7" fontWeight="700" fill="currentColor">PURA</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontFamily={MONO} fontSize="7" fontWeight="700" fill="currentColor">VIDA</text>
      {placed.map((n) => (
        <g key={n.id} opacity={lit(n.id) ? 1 : 0.32}>
          <circle
            cx={n.x}
            cy={n.y}
            r={activeId === n.id ? 13 : 9}
            fill={n.color}
            style={{ filter: lit(n.id) ? `drop-shadow(0 0 6px ${n.color}88)` : "none" }}
          />
          <text x={n.x} y={n.y + (n.y > cy ? 22 : -14)} textAnchor="middle" fontFamily={MONO} fontSize="7.5" fontWeight="600" fill="currentColor">
            {n.short || n.name.split(" ")[0]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Empty({ p, text }: { p: Palette; text: string }) {
  return (
    <div style={{ padding: "18px 20px", borderRadius: 14, background: p.soft, color: p.ink, opacity: 0.72, fontSize: 13, maxWidth: 440 }}>
      {text}
    </div>
  );
}

function Overview({ d, p }: { d: PresentView; p: Palette }) {
  return (
    <div className="present-rise">
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: p.deep }}>PURA VIDA LEGACY ECOSYSTEM</div>
      <h1 style={{ fontFamily: SERIF, fontSize: "clamp(38px,7vw,68px)", fontWeight: 700, lineHeight: 1, letterSpacing: "-1px", margin: "12px 0 0", color: p.ink }}>
        {d.tagline || d.name}
      </h1>
      {d.what && <p style={{ fontSize: "clamp(14px,2vw,18px)", lineHeight: 1.5, maxWidth: 640, marginTop: 18, color: p.ink }}>{d.what}</p>}
      {d.signature && (
        <div style={{ marginTop: 20, paddingLeft: 16, borderLeft: `3px solid ${p.primary}`, fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(17px,2.6vw,23px)", color: p.deep, maxWidth: 600, lineHeight: 1.3 }}>
          &ldquo;{d.signature}&rdquo;
        </div>
      )}
      {d.who && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "8px 14px", borderRadius: 24, background: p.soft }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: p.deep }}>FOR</span>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{d.who}</span>
        </div>
      )}
      {d.facts.length > 0 && (
        <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
          {d.facts.map((f, i) => (
            <div key={i} style={{ minWidth: 116, padding: "16px 20px", borderRadius: 14, background: "#fff", border: `1px solid ${p.primary}33`, borderTop: `4px solid ${p.primary}` }}>
              <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: p.deep, lineHeight: 1 }}>{f[0]}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: p.ink, opacity: 0.6, marginTop: 5, textTransform: "uppercase" }}>{f[1]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Offers({ d, p }: { d: PresentView; p: Palette }) {
  return (
    <div className="present-rise">
      <h2 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: p.ink, marginBottom: 20 }}>What we offer</h2>
      {d.offers.length === 0 ? (
        <Empty p={p} text="Offerings for this program aren't in the Sheet yet." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
          {d.offers.map((o, i) => (
            <div key={i} style={{ padding: "20px 22px", borderRadius: 16, background: "#fff", border: `1px solid ${p.primary}2a`, borderLeft: `4px solid ${p.primary}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: p.soft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontWeight: 700, color: p.deep, flex: "none" }}>{i + 1}</div>
                <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: p.ink }}>{o[0]}</div>
              </div>
              {o[1] && <div style={{ fontSize: 12.5, color: p.ink, opacity: 0.75, marginTop: 10, lineHeight: 1.45 }}>{o[1]}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Why({ d, p }: { d: PresentView; p: Palette }) {
  return (
    <div className="present-rise">
      <h2 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: p.ink, marginBottom: 20 }}>Why it matters</h2>
      {d.why.length === 0 ? (
        <Empty p={p} text="Talking points for this program aren't in the Present_Points tab yet." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          {d.why.map((w, i) => (
            <div key={i} style={{ padding: "20px 22px", borderRadius: 16, background: p.soft, border: `1px solid ${p.primary}22` }}>
              <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: p.deep }}>{w[0]}</div>
              {w[1] && <div style={{ fontSize: 12.5, color: p.ink, opacity: 0.82, marginTop: 8, lineHeight: 1.45 }}>{w[1]}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WhereItFits({ d, p, nodes, currentId }: { d: PresentView; p: Palette; nodes: EntityNode[]; currentId: string }) {
  return (
    <div className="present-rise" style={{ textAlign: "center" }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, color: p.ink, marginBottom: 6 }}>Where it fits</h2>
      <p style={{ fontSize: 13, color: p.ink, opacity: 0.7, maxWidth: 460, margin: "0 auto 10px" }}>
        {currentId === "ALL" ? `${nodes.length} initiatives, one shared mission.` : `${d.name} within the Pura Vida Legacy Ecosystem.`}
      </p>
      <div style={{ color: p.deep, display: "flex", justifyContent: "center" }}>
        <EcoMap nodes={nodes} activeId={currentId} />
      </div>
    </div>
  );
}

export default function PresentOverlay({
  data,
  currentId,
  onClose,
  onNav,
  initialTab = 0,
}: {
  data: PresentData;
  currentId: string;
  onClose: () => void;
  onNav: (dir: -1 | 1) => void;
  initialTab?: number;
}) {
  const [tab, setTab] = useState(initialTab);
  const firstRun = useRef(true);
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // Reset to Overview when the entity changes (but keep the initial tab on first mount).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setTab(0);
  }, [currentId]);

  // Esc to close, arrows to navigate; lock background scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNav(1);
      else if (e.key === "ArrowLeft") onNav(-1);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onNav]);

  const d = data.views[currentId];
  if (!hydrated || !d) return null;
  const p = d.pal;

  const tabs = ["Overview", "What we offer", "Why it matters", "Where it fits"];
  const navBtn: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${p.primary}44`,
    background: "transparent",
    color: p.ink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  const overlay = (
    <div
      className="present-root"
      role="dialog"
      aria-modal="true"
      aria-label={`${d.name} — present mode`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: p.bg,
        color: p.ink,
        fontFamily: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 26px", borderBottom: `1px solid ${p.primary}33`, flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${p.primary},${p.deep})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: 19, flex: "none" }}>
            {currentId === "ALL" ? "P" : (d.name[0] || "•")}
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{d.name}</div>
            <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: 1.5, color: p.deep, marginTop: 2 }}>PRESENT MODE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button aria-label="Previous" onClick={() => onNav(-1)} style={navBtn}><ChevronLeft size={16} /></button>
          <button aria-label="Next" onClick={() => onNav(1)} style={navBtn}><ChevronRight size={16} /></button>
          <button aria-label="Close present mode" onClick={onClose} style={{ ...navBtn, background: p.ink, color: p.bg, border: "none" }}><X size={16} /></button>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 6, padding: "12px 26px 0", flexWrap: "wrap", flex: "none" }}>
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: 1,
              padding: "7px 13px",
              borderRadius: 20,
              cursor: "pointer",
              border: `1px solid ${tab === i ? "transparent" : p.primary + "44"}`,
              background: tab === i ? p.ink : "transparent",
              color: tab === i ? p.bg : p.ink,
              textTransform: "uppercase",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* content — click the bright margin (outside the column) to close */}
      <div onClick={onClose} style={{ flex: 1, overflow: "auto" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ padding: "28px 26px 52px", maxWidth: 940, width: "100%", margin: "0 auto" }}>
          {tab === 0 && <Overview d={d} p={p} />}
          {tab === 1 && <Offers d={d} p={p} />}
          {tab === 2 && <Why d={d} p={p} />}
          {tab === 3 && <WhereItFits d={d} p={p} nodes={data.nodes} currentId={currentId} />}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
