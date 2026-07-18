// Shared Programs constants + type. Mirrors the Programs tab columns
// (note: this tab has no updated_at column — the write layer skips it gracefully).
export const PROGRAM_STATUSES = ["Priority", "Active", "In Development", "Planned"] as const;
export const PROGRAM_CATEGORIES = ["Product", "Program", "School"] as const;

export const STATUS_COLOR: Record<string, string> = {
  Priority: "#C24B3A",
  Active: "#7FB86A",
  "In Development": "#F5B531",
  Planned: "#B7A688",
};

// Rate period (the spec's rate_period). Blank = no rate set (informational program).
export const RATE_PERIODS = ["one_time", "weekly", "monthly", "session", "annual"] as const;
export type RatePeriod = (typeof RATE_PERIODS)[number];
export const RATE_PERIOD_LABEL: Record<string, string> = {
  one_time: "one-time",
  weekly: "/ wk",
  monthly: "/ mo",
  session: "/ session",
  annual: "/ yr",
};

export interface Program {
  id: string;
  name: string;
  entity: string;
  category: string; // program type (Product / Program / School) — the spec's "type"
  status: string;
  one_liner: string;
  description: string;
  notes: string;
  rate_amount: string;
  rate_period: string; // one of RATE_PERIODS (or "")
  capacity: string;
  created_at: string;
}
