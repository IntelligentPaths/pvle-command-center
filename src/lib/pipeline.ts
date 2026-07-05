// Shared Pipeline constants + types, used by the API route and the board UI.

export const STAGES = ["Researching", "Drafting", "Submitted", "Decision", "Awarded", "Declined"] as const;
export type Stage = (typeof STAGES)[number];

// Stage accents tuned for the dark cockpit.
export const STAGE_COLOR: Record<Stage, string> = {
  Researching: "#B7A688",
  Drafting: "#F5B531",
  Submitted: "#E0821C",
  Decision: "#C8792C",
  Awarded: "#7FB86A",
  Declined: "#C24B3A",
};

export const OPPORTUNITY_TYPES = ["Grant", "Contract", "Voucher", "Donation", "Other"] as const;

// Mirrors the Pipeline tab columns (one tab = one table).
export interface Opportunity {
  id: string;
  name: string;
  funder: string;
  entity: string;
  type: string;
  amount: string;
  stage: string;
  owner: string;
  decision_date: string;
  notes: string;
  updated_at: string;
}

export function isStage(s: string): s is Stage {
  return (STAGES as readonly string[]).includes(s);
}

// "$14,000" or "—" for empty/zero.
export function money(v: string | number): string {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return n && Number.isFinite(n) ? "$" + Math.round(n).toLocaleString("en-US") : "—";
}
