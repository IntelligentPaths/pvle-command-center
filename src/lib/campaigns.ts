// Shared Campaigns constants + type. Mirrors the Campaigns tab columns.
export const CAMPAIGN_OBJECTIVES = ["Awareness", "Enrollment", "Fundraising", "Engagement"] as const;
export const CAMPAIGN_STATUSES = ["Planned", "Active", "Paused", "Complete"] as const;

export const STATUS_COLOR: Record<string, string> = {
  Planned: "#B7A688",
  Active: "#7FB86A",
  Paused: "#E0821C",
  Complete: "#8C7B5C",
};

export interface Campaign {
  id: string;
  name: string;
  entity: string;
  goal: string;
  objective: string;
  start_date: string;
  end_date: string;
  owner: string;
  status: string;
  notes: string;
}
