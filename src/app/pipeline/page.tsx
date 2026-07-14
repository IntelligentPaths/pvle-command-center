import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import "../command-center.css"; // cockpit shell: .cc, .panel, .eye, .serif, .navlink
import "./pipeline.css";
import { readTab } from "@/lib/sheets";
import { isNlt } from "@/lib/nlt";
import { readEntityOptions } from "@/lib/entities";
import type { Opportunity } from "@/lib/pipeline";
import PipelineBoard from "@/components/PipelineBoard";

// Editing surface — always read fresh; writes revalidate this path too.
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [pipelineRows, entities] = await Promise.all([readTab("Pipeline"), readEntityOptions()]);
  // NLT stays out of every list.
  const opps = (pipelineRows as unknown as Opportunity[]).filter((o) => !isNlt(o.entity));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Pipeline</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Funding Pipeline</h1>
          <div className="status">
            <span>
              <i />
              Grants, contracts &amp; opportunities across the ecosystem
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

      <PipelineBoard initial={opps} entities={entities} />
    </div>
  );
}
