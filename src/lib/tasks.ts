// Shared Tasks constants + type. Mirrors the Tasks tab columns.
// (`entity` was added via migration; this tab has no updated_at column.)
export const TASK_STATUSES = ["To Do", "In Progress", "Blocked", "Done"] as const;

export const STATUS_COLOR: Record<string, string> = {
  "To Do": "#B7A688",
  "In Progress": "#E0821C",
  Blocked: "#C24B3A",
  Done: "#7FB86A",
};

export interface Task {
  id: string;
  task: string;
  related: string;
  owner: string;
  status: string;
  due: string;
  focus_week: string;
  notes: string;
  entity: string;
}

// focus_week / status are stored as sheet text; parse them the same way the
// Command Center's this-week focus does.
export const isFocus = (v: string) => /^(true|yes|y|1|x|✓)$/i.test((v ?? "").trim());
export const isDone = (v: string) => /^(done|complete|completed|✓)$/i.test((v ?? "").trim());
