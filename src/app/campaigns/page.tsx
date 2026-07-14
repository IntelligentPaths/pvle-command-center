import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import "../command-center.css"; // cockpit shell + shared UI primitives
import "./campaigns.css";
import { readTab } from "@/lib/sheets";
import { isNlt } from "@/lib/nlt";
import { readEntityOptions } from "@/lib/entities";
import type { Campaign } from "@/lib/campaigns";
import CampaignsList from "@/components/CampaignsList";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [rows, entities] = await Promise.all([readTab("Campaigns"), readEntityOptions()]);
  // NLT stays out of every list.
  const campaigns = (rows as unknown as Campaign[]).filter((c) => !isNlt(c.entity));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Campaigns</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Campaigns</h1>
          <div className="status">
            <span>
              <i />
              Marketing pushes across the ecosystem — goals, objectives &amp; timelines
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

      <CampaignsList initial={campaigns} entities={entities} />
    </div>
  );
}
