// Enrollments + revenue math. Referential integrity by ID: an Enrollment stores only
// program_id + contact_id; program/contact NAMES are resolved at read time from their
// source tabs (never copied into the row), so a rename shows everywhere automatically.
import type { Program } from "./programs";

export const ENROLLMENT_STATUSES = ["active", "pending", "ended"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_STATUS_COLOR: Record<string, string> = {
  active: "#7FB86A",
  pending: "#F5B531",
  ended: "#8C7B5C",
};

// Mirrors the Enrollments tab columns.
export interface Enrollment {
  id: string;
  program_id: string;
  contact_id: string;
  status: string;
  start_date: string;
  end_date: string;
  rate_override: string;
  notes: string;
  created_at: string;
}

export const num = (v: string | number): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const isActive = (e: { status: string }): boolean => (e.status || "").toLowerCase() === "active";

// Normalize a rate to a monthly value for MRR. one_time & session are not
// monthly-recurring, so they contribute 0 to MRR (documented tradeoff).
export function monthlyValue(amount: number, period: string): number {
  const p = (period || "").toLowerCase();
  if (p === "monthly") return amount;
  if (p === "weekly") return (amount * 52) / 12; // e.g. $80/wk → $346.67/mo
  if (p === "annual") return amount / 12;
  return 0; // one_time, session, blank
}

// Effective monthly value of an enrollment: its rate_override (if set) else the program
// rate, normalized by the program's rate_period.
export function enrollmentMonthly(
  e: Enrollment,
  program: Pick<Program, "rate_amount" | "rate_period">,
): number {
  const amount = e.rate_override && e.rate_override.trim() ? num(e.rate_override) : num(program.rate_amount);
  return monthlyValue(amount, program.rate_period);
}

export interface ProgramStats {
  activeCount: number;
  totalCount: number;
  mrr: number; // monthly recurring revenue
  annual: number; // projected annual = mrr * 12
}

// Live rollup for one program from the raw enrollment rows (never stored/denormalized).
export function statsForProgram(program: Program, enrollments: Enrollment[]): ProgramStats {
  const forProg = enrollments.filter((e) => e.program_id === program.id);
  const active = forProg.filter(isActive);
  const mrr = active.reduce((s, e) => s + enrollmentMonthly(e, program), 0);
  return { activeCount: active.length, totalCount: forProg.length, mrr, annual: mrr * 12 };
}

// "$1,250" / "$0"
export function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}
