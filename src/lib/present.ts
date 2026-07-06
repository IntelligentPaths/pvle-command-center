// Server-only: builds the Present-mode view models entirely from live Sheet data
// (Entities + Present_Points + Programs). NLT is never presentable.
import { readTab } from "./sheets";
import { isNlt } from "./nlt";

export interface Palette {
  primary: string;
  deep: string;
  ink: string;
  bg: string;
  soft: string;
}
export interface PresentView {
  id: string;
  name: string;
  tagline: string;
  what: string;
  who: string;
  signature: string;
  pal: Palette;
  facts: [string, string][];
  offers: [string, string][];
  why: [string, string][];
}
export interface EntityNode {
  id: string;
  name: string;
  short: string;
  color: string;
}
export interface PresentData {
  order: string[]; // ["ALL", <entity ids by order>]
  views: Record<string, PresentView>;
  nodes: EntityNode[]; // entities only, for the "Where it fits" hub-and-spoke map
}

// --- color helpers: derive a light per-entity palette from primary + deep ---
function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || "").replace("#", "");
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const v = parseInt(s || "000000", 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function toHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(hex: string, target: string, amt: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(target);
  return toHex(r1 + (r2 - r1) * amt, g1 + (g2 - g1) * amt, b1 + (b2 - b1) * amt);
}
const WHITE = "#ffffff";
const BLACK = "#000000";

function palette(primary: string, deep: string): Palette {
  const p = primary || "#E3A81C";
  const d = deep || mix(p, BLACK, 0.4);
  return {
    primary: p,
    deep: d,
    ink: mix(d, BLACK, 0.62), // dark text
    bg: mix(d, WHITE, 0.955), // near-white page background (opaque)
    soft: mix(d, WHITE, 0.86), // light tint for chips/panels
  };
}

const MUTED = "#8C7B5C";

// Ecosystem ("ALL") copy fallback.
// TODO: move this to a dedicated ECOSYSTEM row in the Entities / Present_Points tabs.
const ECOSYSTEM_FALLBACK = {
  name: "Pura Vida Legacy Ecosystem",
  tagline: "One ecosystem. Many paths. A shared legacy.",
  what: "A family of youth, education, and community initiatives building competence, character, and legacy across Fort Worth — each a different on-ramp to the same mission.",
  who: "Families, funders, and partners who believe in growing the next generation of leaders.",
  signature: "Competence, character, and confidence to shape their own lives — and lift others.",
  color_primary: "#E3A81C",
  color_deep: "#8A3A12",
  why: [
    ["Many on-ramps", "A path for every age — child to adult, learner to leader"],
    ["Self-reinforcing", "Each initiative strengthens the others"],
    ["Replicable", "A proven model that can grow beyond Fort Worth"],
  ] as [string, string][],
};

const isEcoId = (id: string) => /^(ecosystem|all|eco)$/i.test((id || "").trim());

// A failed Sheet read (e.g. no credentials at build/runtime) must never throw the
// page — degrade to an empty list, mirroring dashboard.ts's safeReadTab. The ALL
// view still works from the hardcoded ecosystem fallback.
async function safeReadTab(tab: string): Promise<Record<string, string>[]> {
  try {
    return await readTab(tab);
  } catch (e) {
    console.error(`[present] readTab(${tab}) failed:`, e);
    return [];
  }
}

export async function getPresentData(): Promise<PresentData> {
  const [rawEntities, points, programs] = await Promise.all([
    safeReadTab("Entities"),
    safeReadTab("Present_Points"),
    safeReadTab("Programs"),
  ]);

  // NLT is never presentable. (It isn't in the Entities tab today — keep it that way.)
  const entities = rawEntities
    .filter((e) => !isNlt(e.id) && !isNlt(e.name) && !isEcoId(e.id))
    .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));

  const nodes: EntityNode[] = entities.map((e) => ({
    id: e.id,
    name: e.name,
    short: e.short_name || e.id,
    color: e.color_primary || MUTED,
  }));
  const views: Record<string, PresentView> = {};

  for (const e of entities) {
    const ePrograms = programs.filter((p) => p.entity === e.id && !isNlt(p.entity));
    const ePoints = points
      .filter((pt) => pt.entity_id === e.id)
      .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));

    const isPlatform = /platform/i.test(e.type);
    const priority = ePrograms.filter((p) => /priority/i.test(p.status)).length;
    const facts: [string, string][] = [];
    if (e.type) facts.push([e.type, "role"]);
    if (ePrograms.length) {
      const one = ePrograms.length === 1;
      facts.push([String(ePrograms.length), isPlatform ? (one ? "product" : "products") : one ? "program" : "programs"]);
    }
    if (priority) facts.push([String(priority), "in priority"]);
    if (e.status) facts.push([e.status, "status"]);

    views[e.id] = {
      id: e.id,
      name: e.name,
      tagline: e.tagline,
      what: e.what,
      who: e.who,
      signature: e.signature,
      pal: palette(e.color_primary, e.color_deep),
      facts,
      offers: ePrograms.map((p) => [p.name, p.one_liner || p.description] as [string, string]),
      why: ePoints.map((pt) => [pt.title, pt.blurb] as [string, string]),
    };
  }

  // ALL / ecosystem view — prefer a real ECOSYSTEM row if the Sheet grows one.
  const ecoRow = rawEntities.find((e) => isEcoId(e.id));
  const ecoPoints = points
    .filter((pt) => isEcoId(pt.entity_id))
    .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
  views.ALL = {
    id: "ALL",
    name: ecoRow?.name || ECOSYSTEM_FALLBACK.name,
    tagline: ecoRow?.tagline || ECOSYSTEM_FALLBACK.tagline,
    what: ecoRow?.what || ECOSYSTEM_FALLBACK.what,
    who: ecoRow?.who || ECOSYSTEM_FALLBACK.who,
    signature: ecoRow?.signature || ECOSYSTEM_FALLBACK.signature,
    pal: palette(
      ecoRow?.color_primary || ECOSYSTEM_FALLBACK.color_primary,
      ecoRow?.color_deep || ECOSYSTEM_FALLBACK.color_deep,
    ),
    facts: [
      [String(entities.length), "initiatives"],
      ["1", "shared mission"],
      ["Fort Worth", "rooted"],
    ],
    offers: entities.map((e) => [e.name, e.tagline] as [string, string]),
    why: ecoPoints.length ? ecoPoints.map((pt) => [pt.title, pt.blurb] as [string, string]) : ECOSYSTEM_FALLBACK.why,
  };

  return { order: ["ALL", ...entities.map((e) => e.id)], views, nodes };
}
