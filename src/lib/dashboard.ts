// Server-only: reads the Sheet tabs and maps them into the Command Center view model.
// Read-only for now — writes arrive with the Pipeline module.
import { readTab } from "./sheets";
import { isNlt } from "./nlt";
import { statsForProgram, money, type Enrollment } from "./enrollments";
import type { Program } from "./programs";

type Row = Record<string, string>;

export interface Zone {
  id: string;
  name: string;
  type: string;
  status: string;
  note: string;
  color: string;
}
export interface FocusTask {
  id: string;
  task: string;
  owner: string;
  done: boolean;
}
export interface ContentItem {
  id: string;
  title: string;
  dateLabel: string;
  channel: string;
  status: string;
  color: string;
}
export interface AttentionItem {
  id: string;
  title: string;
  chip: string;
  hot: boolean;
}
export interface ProgramRollupRow {
  id: string;
  name: string;
  entityShort: string;
  entityColor: string;
  active: number;
  mrr: number;
  mrrLabel: string;
}
export interface ProgramsRollup {
  totalActive: number;
  mrr: number;
  mrrLabel: string;
  annual: number;
  annualLabel: string;
  rows: ProgramRollupRow[];
}
export interface DashboardData {
  zones: Zone[];
  focus: FocusTask[];
  focusDone: number;
  content: ContentItem[];
  contentReady: { ready: number; total: number };
  funding: { totalLabel: string; activeCount: number; awaitingCount: number };
  attention: AttentionItem[];
  programs: ProgramsRollup;
  stats: { opps: number; attention: number; posts: number };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MUTED = "#8C7B5C";

const truthy = (v: string) => /^(true|yes|y|1|x|✓)$/i.test((v ?? "").trim());
const isDone = (v: string) => /^(done|complete|completed|shipped|✓)$/i.test((v ?? "").trim());
const toNumber = (v: string) => {
  const n = parseFloat((v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function parseLocalDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec((s ?? "").trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
function shortDate(d: Date, now: Date): string {
  return d.getFullYear() === now.getFullYear()
    ? `${MONTHS[d.getMonth()]} ${d.getDate()}`
    : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function compactUSD(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 ? m.toFixed(1) : m.toFixed(0)}M`;
  }
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

async function safeReadTab(tab: string): Promise<Row[]> {
  try {
    return await readTab(tab);
  } catch (e) {
    console.error(`[dashboard] readTab(${tab}) failed:`, e);
    return [];
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [rawEntities, rawTasks, rawContent, rawPipeline, rawEvents, rawPrograms, rawEnrollments] =
    await Promise.all([
      safeReadTab("Entities"),
      safeReadTab("Tasks"),
      safeReadTab("Content"),
      safeReadTab("Pipeline"),
      safeReadTab("Events"),
      safeReadTab("Programs"),
      safeReadTab("Enrollments"), // may not exist yet → [] (graceful)
    ]);

  // NLT is internal-only — never render it in any list, map, or meter. Filter it
  // out at the source (defense-in-depth) so every derived panel below is NLT-free.
  const entities = rawEntities.filter((e) => !isNlt(e.id) && !isNlt(e.name) && !isNlt(e.type));
  const tasks = rawTasks.filter((t) => !isNlt(t.entity) && !isNlt(t.related));
  const content = rawContent.filter((c) => !isNlt(c.entity));
  const pipeline = rawPipeline.filter((p) => !isNlt(p.entity));
  const events = rawEvents.filter((e) => !isNlt(e.entity) && !isNlt(e.title));

  const now = new Date();
  const today = startOfDay(now);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Entity id → primary color, for content stripes. (entities is already NLT-filtered above.)
  const entityColor = new Map(entities.map((e) => [e.id, e.color_primary || MUTED]));

  // Ecosystem zones ← Entities (type=tag, status=pulse, tagline=note).
  // Numeric progress bar intentionally skipped — no progress field in the tab yet.
  const zones: Zone[] = [...entities]
    .sort((a, b) => toNumber(a.order) - toNumber(b.order))
    .map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      status: e.status,
      note: e.tagline,
      color: e.color_primary || MUTED,
    }));

  // This week's focus ← Tasks where focus_week is TRUE (read-only; check = Done).
  const focus: FocusTask[] = tasks
    .filter((t) => truthy(t.focus_week))
    .map((t) => ({ id: t.id, task: t.task, owner: t.owner, done: isDone(t.status) }));
  const focusDone = focus.filter((f) => f.done).length;

  // Content this week ← Content within a 7-day forward window; if none land in it,
  // fall back to nearest upcoming, then most recent, so the panel isn't empty.
  const dated: { c: Row; d: Date }[] = [];
  for (const c of content) {
    const d = parseLocalDate(c.date);
    if (d) dated.push({ c, d });
  }
  dated.sort((a, b) => a.d.getTime() - b.d.getTime());
  let weekItems = dated.filter((x) => x.d >= today && x.d < weekEnd);
  if (weekItems.length === 0) {
    const upcoming = dated.filter((x) => x.d >= today).slice(0, 4);
    weekItems = upcoming.length ? upcoming : dated.slice(-4);
  }
  const contentItems: ContentItem[] = weekItems.map(({ c, d }) => ({
    id: c.id,
    title: c.title,
    dateLabel: WEEKDAYS[d.getDay()],
    channel: c.channel,
    status: c.status,
    color: entityColor.get(c.entity) || MUTED,
  }));
  const staged = /^(scheduled|ready|posted|published|approved|live)$/i;
  const contentReady = {
    ready: contentItems.filter((c) => staged.test(c.status)).length,
    total: contentItems.length,
  };

  // Funding in play ← Pipeline, summing amount where stage isn't Declined/Awarded.
  const activeDeals = pipeline.filter(
    (p) => !/^(declined|awarded|lost|closed|withdrawn)$/i.test((p.stage || "").trim()),
  );
  const fundingTotal = activeDeals.reduce((s, p) => s + toNumber(p.amount), 0);
  const awaitingCount = activeDeals.filter((p) => /submit|review|pending|await|decision/i.test(p.stage || "")).length;
  const funding = { totalLabel: compactUSD(fundingTotal), activeCount: activeDeals.length, awaitingCount };

  // Needs attention ← Events (title + date/type).
  const attention: AttentionItem[] = [...events]
    .sort((a, b) => {
      const da = parseLocalDate(a.date);
      const db = parseLocalDate(b.date);
      if (da && db) return da.getTime() - db.getTime();
      if (da) return -1;
      if (db) return 1;
      return 0;
    })
    .slice(0, 6)
    .map((e) => {
      const d = parseLocalDate(e.date);
      const nearDeadline = d ? d >= today && (d.getTime() - today.getTime()) / 86_400_000 <= 30 : false;
      const hot = /deadline|decision|urgent|due/i.test(`${e.type} ${e.title} ${e.status}`) || nearDeadline;
      const chip = d ? shortDate(d, now) : e.type || e.status || "";
      return { id: e.id, title: e.title, chip, hot };
    });

  // Programs rollup ← Programs + Enrollments (live revenue; NLT-free). The Enrollments tab
  // may not exist yet → empty rollup. Names/entities resolve at read time (referential by id).
  const programsList = rawPrograms.filter((p) => !isNlt(p.entity) && !isNlt(p.name));
  const enrollments = rawEnrollments as unknown as Enrollment[];
  const progRows: ProgramRollupRow[] = programsList
    .map((p) => {
      const st = statsForProgram(p as unknown as Program, enrollments);
      const ent = entities.find((e) => e.id === p.entity);
      return {
        id: p.id,
        name: p.name,
        entityShort: ent?.short_name || p.entity || "—",
        entityColor: ent?.color_primary || MUTED,
        active: st.activeCount,
        mrr: st.mrr,
        mrrLabel: money(st.mrr),
      };
    })
    .sort((a, b) => b.mrr - a.mrr || b.active - a.active);
  const totalMrr = progRows.reduce((s, r) => s + r.mrr, 0);
  const programs: ProgramsRollup = {
    totalActive: progRows.reduce((s, r) => s + r.active, 0),
    mrr: totalMrr,
    mrrLabel: money(totalMrr),
    annual: totalMrr * 12,
    annualLabel: money(totalMrr * 12),
    rows: progRows,
  };

  return {
    zones,
    focus,
    focusDone,
    content: contentItems,
    contentReady,
    funding,
    attention,
    programs,
    stats: { opps: activeDeals.length, attention: events.length, posts: contentItems.length },
  };
}
