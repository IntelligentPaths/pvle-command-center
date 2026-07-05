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

export interface Program {
  id: string;
  name: string;
  entity: string;
  category: string;
  status: string;
  one_liner: string;
  description: string;
  notes: string;
}
