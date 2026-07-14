import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, ChevronLeft } from "lucide-react";
import "../../command-center.css";
import "../contacts.css";
import "../../detail.css";
import { readTab } from "@/lib/sheets";
import { ensureRelationalSchema, ENROLLMENTS_TAB } from "@/lib/schema";
import { readEntityOptions } from "@/lib/entities";
import { isNlt } from "@/lib/nlt";
import type { Contact } from "@/lib/contacts";
import type { Program } from "@/lib/programs";
import type { Enrollment } from "@/lib/enrollments";
import ContactDetail from "@/components/ContactDetail";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureRelationalSchema();
  const [contactRows, enrollRows, programRows, entities] = await Promise.all([
    readTab("Contacts"),
    readTab(ENROLLMENTS_TAB),
    readTab("Programs"),
    readEntityOptions(),
  ]);

  const contact = (contactRows as unknown as Contact[]).find((c) => c.id === id);
  if (!contact || isNlt(contact.entity) || isNlt(contact.org)) notFound();

  const enrollments = (enrollRows as unknown as Enrollment[]).filter((e) => e.contact_id === id);
  const programs = (programRows as unknown as Program[]).filter((p) => !isNlt(p.entity) && !isNlt(p.name));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Contact</div>
          <h1 className="serif" style={{ marginTop: 8 }}>{contact.name}</h1>
          <div className="crumbs">
            <Link href="/contacts" className="crumb">
              <ChevronLeft size={12} /> All contacts
            </Link>
          </div>
        </div>
        <div className="hqR">
          <Link href="/contacts" className="navlink">
            Contacts
          </Link>
          <Link href="/" className="navlink">
            <LayoutDashboard size={15} /> Command Center
          </Link>
        </div>
      </div>

      <ContactDetail contact={contact} enrollments={enrollments} programs={programs} entities={entities} />
    </div>
  );
}
