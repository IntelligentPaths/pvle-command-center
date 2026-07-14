import Link from "next/link";
import { Compass, Sparkles, Bell, Radio, ChevronRight, Check, FolderOpen, Coins, Users, BookOpen, CheckSquare, Megaphone, CalendarDays } from "lucide-react";
import { contentStatusStyle } from "@/lib/content";
import "./command-center.css";
import { getDashboardData } from "@/lib/dashboard";
import { getPresentData } from "@/lib/present";
import PresentButton from "@/components/PresentButton";
import PresentProvider from "@/components/present/PresentProvider";
import EcosystemZones from "@/components/present/EcosystemZones";

// Reads the Sheet at request time — must NOT prerender at build (no credentials
// available then). force-dynamic + revalidate 0 → rendered per request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server-rendered progress ring (plain SVG — no client JS).
function Ring({ pct, color, label }: { pct: number; color: string; label: string }) {
  const size = 62;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3A2E1F" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-plex-mono), monospace",
          fontSize: 13,
          fontWeight: 600,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default async function CommandCenter() {
  const [d, presentData] = await Promise.all([getDashboardData(), getPresentData()]);
  const focusPct = d.focus.length ? Math.round((d.focusDone / d.focus.length) * 100) : 0;
  const contentPct = d.contentReady.total ? Math.round((d.contentReady.ready / d.contentReady.total) * 100) : 0;

  return (
    <PresentProvider data={presentData}>
    <div className="cc">
      {/* Header */}
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Command Center</div>
          <h1 className="serif" style={{ marginTop: 8 }}>
            Welcome back, <b>Juleon.</b>
          </h1>
          <div className="status">
            <span>
              <i />
              {d.stats.opps} {d.stats.opps === 1 ? "opportunity" : "opportunities"} in play
            </span>
            <span>
              <i />
              {d.stats.attention} on the radar
            </span>
            <span>
              <i />
              {d.stats.posts} {d.stats.posts === 1 ? "post" : "posts"} this week
            </span>
          </div>
        </div>
        <div className="hqR">
          <Link href="/pipeline" className="navlink">
            <Coins size={15} /> Pipeline
          </Link>
          <Link href="/contacts" className="navlink">
            <Users size={15} /> Contacts
          </Link>
          <Link href="/programs" className="navlink">
            <BookOpen size={15} /> Programs
          </Link>
          <Link href="/tasks" className="navlink">
            <CheckSquare size={15} /> Tasks
          </Link>
          <Link href="/campaigns" className="navlink">
            <Megaphone size={15} /> Campaigns
          </Link>
          <Link href="/content" className="navlink">
            <CalendarDays size={15} /> Content
          </Link>
          <Link href="/files" className="navlink">
            <FolderOpen size={15} /> Files
          </Link>
          <PresentButton />
        </div>
      </div>

      {/* Meters */}
      <div className="meters cc-fade">
        {/* Enrollment + revenue — live from Programs × Enrollments */}
        <div className="panel meter" style={{ display: "block" }}>
          <div className="cap">Active enrollments</div>
          <div className="big">{d.programs.totalActive}</div>
          <div className="sub">
            across {d.programs.rows.length} {d.programs.rows.length === 1 ? "program" : "programs"}
          </div>
        </div>
        <div className="panel meter" style={{ display: "block" }}>
          <div className="cap">Monthly recurring</div>
          <div className="big" style={{ color: "var(--gold)" }}>{d.programs.mrrLabel}</div>
          <div className="sub">{d.programs.annualLabel} projected / yr</div>
        </div>

        {/* Funding in play — live from Pipeline */}
        <div className="panel meter" style={{ display: "block" }}>
          <div className="cap">Funding in play</div>
          <div className="big" style={{ color: "var(--gold)" }}>{d.funding.totalLabel}</div>
          <div className="sub">
            {d.funding.activeCount} active
            {d.funding.awaitingCount ? ` · ${d.funding.awaitingCount} awaiting decision` : ""}
          </div>
        </div>

        {/* Content ready — live from Content */}
        <div className="panel meter">
          <Ring pct={contentPct} color="#E0821C" label={`${d.contentReady.ready}/${d.contentReady.total}`} />
          <div>
            <div className="cap">Content ready</div>
            <div className="big">This wk</div>
            <div className="sub">
              {d.contentReady.ready} of {d.contentReady.total} staged
            </div>
          </div>
        </div>
      </div>

      {/* Programs & revenue — per-program breakdown (NLT-free) */}
      {d.programs.rows.length > 0 && (
        <div className="panel cc-fade prog-panel">
          <div className="sect-h">
            <div className="t">
              <BookOpen size={18} color="#F5B531" /> Programs &amp; revenue
            </div>
            <Link href="/programs" className="link">
              All programs <ChevronRight size={13} />
            </Link>
          </div>
          <div className="prog-summary">
            <span>
              <b>{d.programs.totalActive}</b> active enrollments
            </span>
            <span>
              <b>{d.programs.mrrLabel}</b> MRR
            </span>
            <span>
              <b>{d.programs.annualLabel}</b> projected / yr
            </span>
          </div>
          <div className="prog-rows">
            {d.programs.rows.map((p) => (
              <Link key={p.id} href={`/programs/${p.id}`} className="prog-row">
                <span className="prog-dot" style={{ background: p.entityColor }} />
                <span className="prog-name">{p.name}</span>
                <span className="prog-ent">{p.entityShort}</span>
                <span className="prog-active">
                  {p.active} {p.active === 1 ? "enrolled" : "enrolled"}
                </span>
                <span className="prog-mrr">{p.mrrLabel}/mo</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid">
        <div>
          {/* Ecosystem */}
          <div className="panel cc-fade" style={{ padding: 16 }}>
            <div className="sect-h">
              <div className="t">
                <Compass size={18} color="#F5B531" /> Ecosystem
              </div>
            </div>
            <EcosystemZones zones={d.zones} />
          </div>

          {/* Content this week */}
          <div className="panel content cc-fade">
            <div className="sect-h">
              <div className="t">
                <Radio size={17} color="#F5B531" /> Content this week
              </div>
              <Link href="/content" className="link">
                Full calendar <ChevronRight size={13} />
              </Link>
            </div>
            {d.content.length === 0 ? (
              <div className="empty">No content scheduled for this week.</div>
            ) : (
              <div className="cweek">
                {d.content.map((c) => (
                  <div key={c.id} className="cslot" style={{ borderTopColor: c.color }}>
                    <div className="cd">{c.dateLabel}</div>
                    <div className="ct">{c.title}</div>
                    <div className="cm">
                      <span className="cch">{c.channel}</span>
                      <span className="cst" style={contentStatusStyle(c.status)}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {/* This week's focus (read-only) */}
          <div className="panel focus cc-fade">
            <div className="sect-h">
              <div className="t">
                <Sparkles size={17} color="#F5B531" /> This week&apos;s focus
              </div>
              <span className="fcount">
                {d.focusDone}/{d.focus.length}
              </span>
            </div>
            <div className="fbar">
              <i style={{ width: `${focusPct}%` }} />
            </div>
            {d.focus.length === 0 ? (
              <div className="empty">No focus tasks flagged for this week.</div>
            ) : (
              d.focus.map((q) => (
                <div key={q.id} className="quest">
                  {/* Read-only: reflects status == Done. Toggling comes with the Pipeline module. */}
                  <div className={"qbox" + (q.done ? " on" : "")} aria-hidden="true">
                    {q.done && <Check size={13} color="#16120C" strokeWidth={3} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={"qt" + (q.done ? " on" : "")}>{q.task}</div>
                    {q.owner && <div className="qwho">{q.owner.toUpperCase()}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Needs attention */}
          <div className="panel att cc-fade">
            <div className="sect-h">
              <div className="t">
                <Bell size={16} color="#F5B531" /> Needs attention
              </div>
            </div>
            {d.attention.length === 0 ? (
              <div className="empty">Nothing flagged right now.</div>
            ) : (
              d.attention.map((a) => (
                <div key={a.id} className="arow">
                  <div style={{ flex: 1, fontSize: 11.5, fontWeight: 500 }}>{a.title}</div>
                  {a.chip && <span className={"achip " + (a.hot ? "hot" : "cool")}>{a.chip}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </PresentProvider>
  );
}
