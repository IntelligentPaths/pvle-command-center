import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import "../command-center.css"; // cockpit shell + shared UI primitives
import "./tasks.css";
import { readTab } from "@/lib/sheets";
import { isNlt } from "@/lib/nlt";
import { readEntityOptions } from "@/lib/entities";
import type { Task } from "@/lib/tasks";
import TasksList from "@/components/TasksList";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [rows, entities] = await Promise.all([readTab("Tasks"), readEntityOptions()]);
  // NLT stays out of every list.
  const tasks = (rows as unknown as Task[]).filter((t) => !isNlt(t.entity) && !isNlt(t.related));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Tasks</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Tasks</h1>
          <div className="status">
            <span>
              <i />
              What&apos;s moving — the star flags this week&apos;s focus on the Command Center
            </span>
          </div>
        </div>
        <div className="hqR">
          <Link href="/" className="navlink">
            <LayoutDashboard size={15} /> Command Center
          </Link>
          <Link href="/files" className="navlink">
            <FolderOpen size={15} /> Files
          </Link>
        </div>
      </div>

      <TasksList initial={tasks} entities={entities} />
    </div>
  );
}
