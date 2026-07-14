import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import "../command-center.css"; // cockpit shell + shared UI primitives
import "./content.css";
import { readTab } from "@/lib/sheets";
import { isNlt } from "@/lib/nlt";
import { readEntityOptions } from "@/lib/entities";
import type { ContentPost } from "@/lib/content";
import ContentCalendar from "@/components/ContentCalendar";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [rows, entities, campaignRows] = await Promise.all([
    readTab("Content"),
    readEntityOptions(),
    readTab("Campaigns"),
  ]);
  // NLT stays out of every list.
  const content = (rows as unknown as ContentPost[]).filter((c) => !isNlt(c.entity));
  const campaigns = campaignRows
    .filter((c) => !isNlt(c.entity))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Content</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Content Calendar</h1>
          <div className="status">
            <span>
              <i />
              Posts across the ecosystem — by date &amp; channel, linked to campaigns
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

      <ContentCalendar initial={content} entities={entities} campaigns={campaigns} />
    </div>
  );
}
