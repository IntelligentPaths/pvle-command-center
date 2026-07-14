// Shared entity-option source for every module's dropdowns / filters / badges.
//
// Entities live in the `Entities` tab. This reads them, filters out NLT (which must
// NEVER appear in any list/dropdown/map — CLAUDE.md hard rule; previously each page
// mapped entities WITHOUT this filter, a latent leak this centralizes and closes), and
// appends the synthetic "Ecosystem" option for cross-entity / ecosystem-level items
// (e.g. an ecosystem-level hire). "Ecosystem" is intentionally NOT a row in the Entities
// tab — that tab drives the Present per-entity pitch screens and the dashboard map, and
// "Ecosystem" is a selection bucket, not a pitchable brand.
import { readTab } from "./sheets";
import { isNlt } from "./nlt";

export interface EntityOpt {
  id: string;
  name: string;
  short: string;
  color: string;
}

export const ENTITY_FALLBACK_COLOR = "#8C7B5C";

// Cross-entity / ecosystem-level bucket. Its accent (antique gold) is palette-consistent
// yet distinct from the bright UI gold (#F5B531) and the entities' warm oranges/reds/teal.
export const ECOSYSTEM_ID = "ecosystem";
export const ECOSYSTEM_OPTION: EntityOpt = {
  id: ECOSYSTEM_ID,
  name: "Ecosystem",
  short: "ECO",
  color: "#C9A227",
};

// Map one raw `Entities` row → an option.
export function toEntityOpt(e: Record<string, string>): EntityOpt {
  return {
    id: e.id,
    name: e.name,
    short: e.short_name || e.id,
    color: e.color_primary || ENTITY_FALLBACK_COLOR,
  };
}

// The option list for selection + resolution across modules: real entities
// (NLT-filtered, ordered) followed by the Ecosystem bucket. Callers pass this straight
// to their client component as `entities`.
export async function readEntityOptions(): Promise<EntityOpt[]> {
  const rows = await readTab("Entities");
  const real = rows
    .filter((e) => !isNlt(e.id) && !isNlt(e.name) && !isNlt(e.short_name))
    .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
    .map(toEntityOpt);
  return [...real, ECOSYSTEM_OPTION];
}
