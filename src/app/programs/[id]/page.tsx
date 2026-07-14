import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, ChevronLeft } from "lucide-react";
import "../../command-center.css";
import "../programs.css";
import "./detail.css";
import { readTab } from "@/lib/sheets";
import { ensureRelationalSchema, ENROLLMENTS_TAB } from "@/lib/schema";
import { readEntityOptions } from "@/lib/entities";
import { isNlt } from "@/lib/nlt";
import type { Program } from "@/lib/programs";
import type { Enrollment } from "@/lib/enrollments";
import type { Contact } from "@/lib/contacts";
import ProgramDetail from "@/components/ProgramDetail";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureRelationalSchema();
  const [programRows, enrollRows, contactRows, entities] = await Promise.all([
    readTab("Programs"),
    readTab(ENROLLMENTS_TAB),
    readTab("Contacts"),
    readEntityOptions(),
  ]);

  const program = (programRows as unknown as Program[]).find((p) => p.id === id);
  // Not found, or NLT — never expose.
  if (!program || isNlt(program.entity) || isNlt(program.name)) notFound();

  const enrollments = (enrollRows as unknown as Enrollment[]).filter((e) => e.program_id === id);
  const contacts = (contactRows as unknown as Contact[]).filter((c) => !isNlt(c.entity) && !isNlt(c.org));

  return (
    <div className="cc">
      <div className="hq cc-fade">
        <div>
          <div className="eye">Pura Vida Legacy Ecosystem · Program</div>
          <h1 className="serif" style={{ marginTop: 8 }}>{program.name}</h1>
          <div className="crumbs">
            <Link href="/programs" className="crumb">
              <ChevronLeft size={12} /> All programs
            </Link>
          </div>
        </div>
        <div className="hqR">
          <Link href="/programs" className="navlink">
            Programs
          </Link>
          <Link href="/" className="navlink">
            <LayoutDashboard size={15} /> Command Center
          </Link>
        </div>
      </div>

      <ProgramDetail program={program} enrollments={enrollments} contacts={contacts} entities={entities} />
    </div>
  );
}
