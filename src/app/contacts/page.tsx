import Link from "next/link";
import { LayoutDashboard, FolderOpen } from "lucide-react";
import "../command-center.css"; // cockpit shell + shared UI primitives
import "./contacts.css";
import { readTab } from "@/lib/sheets";
import { isNlt } from "@/lib/nlt";
import type { Contact } from "@/lib/contacts";
import ContactsTable from "@/components/ContactsTable";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [rows, entityRows] = await Promise.all([readTab("Contacts"), readTab("Entities")]);
  // NLT stays out of every list.
  const contacts = (rows as unknown as Contact[]).filter((c) => !isNlt(c.entity) && !isNlt(c.org));
  const entities = entityRows
    .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
    .map((e) => ({ id: e.id, name: e.name, short: e.short_name || e.id, color: e.color_primary || "#8C7B5C" }));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Contacts</div>
          <h1 className="serif" style={{ marginTop: 8 }}>Contacts</h1>
          <div className="status">
            <span>
              <i />
              People across the ecosystem — team, partners &amp; vendors
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

      <ContactsTable initial={contacts} entities={entities} />
    </div>
  );
}
