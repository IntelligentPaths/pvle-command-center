// Shared Content constants + type. Mirrors the Content tab columns.
export const CONTENT_STATUSES = ["Idea", "Drafting", "Scheduled", "Posted"] as const;
export const CONTENT_CHANNELS = ["Instagram", "Facebook", "TikTok", "Email", "Other"] as const;

export interface ContentPost {
  id: string;
  title: string;
  date: string;
  channel: string;
  entity: string;
  campaign_id: string;
  copy: string;
  asset_link: string;
  status: string;
  owner: string;
}

// The one status-pill color treatment, shared by the full Content view and the
// Command Center's "content this week" strip so the two read as one system.
export function contentStatusStyle(status: string): { background: string; color: string } {
  const s = status.toLowerCase();
  if (/schedul|posted|publish|ready|approv|live/.test(s)) return { background: "#1E3320", color: "#8FD08A" };
  if (/draft|writ/.test(s)) return { background: "#3A2E14", color: "#F5B531" };
  return { background: "#2A2314", color: "#B7A688" };
}
