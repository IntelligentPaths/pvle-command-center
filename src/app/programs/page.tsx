import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import "../command-center.css"; // cockpit shell + shared UI primitives
import "./programs.css";
import { readTab } from "@/lib/sheets";
import { isNlt } from "@/lib/nlt";
import type { Program } from "@/lib/programs";
import ProgramsBoard from "@/components/ProgramsBoard";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const [rows, entityRows] = await Promise.all([readTab("Programs"), readTab("Entities")]);
  // NLT stays out of every list.
  const programs = (rows as unknown as Program[]).filter((p) => !isNlt(p.entity));
  const entities = entityRows
    .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
    .map((e) => ({ id: e.id, name: e.name, short: e.short_name || e.id, color: e.color_primary || "#8C7B5C" }));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Programs</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Programs &amp; Products</h1>
          <div className="status">
            <span>
              <i />
              The product suite, programs &amp; school — grouped by entity
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

      <ProgramsBoard initial={programs} entities={entities} />
    </div>
  );
}
