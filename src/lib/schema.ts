// Relational-tab schema, created/extended on demand (server-side). Non-destructive:
// ensureTab creates a tab with headers if absent, or adds any missing columns if present.
import { ensureTab } from "./sheets";

export const PROGRAMS_TAB = "Programs";
export const ENROLLMENTS_TAB = "Enrollments";

// Programs keeps its existing columns; the last four are added by this migration.
// (The spec's "type" is the existing `category` column — see CLAUDE.md.)
export const PROGRAMS_HEADERS = [
  "id", "name", "entity", "category", "status",
  "one_liner", "description", "notes",
  "rate_amount", "rate_period", "capacity", "created_at",
];

export const ENROLLMENTS_HEADERS = [
  "id", "program_id", "contact_id", "status",
  "start_date", "end_date", "rate_override", "notes", "created_at",
];

// Idempotent; the resolved promise is cached per server instance (retried on failure).
let ensured: Promise<void> | null = null;
export function ensureRelationalSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await ensureTab(PROGRAMS_TAB, PROGRAMS_HEADERS);
      await ensureTab(ENROLLMENTS_TAB, ENROLLMENTS_HEADERS);
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}
