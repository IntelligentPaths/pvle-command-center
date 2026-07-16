// Streams an attachment's bytes from Drive (SA-owned files aren't shareable to the user's
// Google account, so we proxy the download server-side). Gated by the login proxy like all
// /api/* routes. Looks the file up by attachment id (never streams an arbitrary Drive id).
import { NextResponse } from "next/server";
import { readTab } from "@/lib/sheets";
import { ensureRelationalSchema, ATTACHMENTS_TAB } from "@/lib/schema";
import { getFileDownload } from "@/lib/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureRelationalSchema();
    const rows = await readTab(ATTACHMENTS_TAB);
    const row = rows.find((r) => r.id === id);
    if (!row || !row.drive_file_id) return new NextResponse("Not found", { status: 404 });

    const { buffer, mimeType, name } = await getFileDownload(row.drive_file_id);
    const filename = (row.filename || name).replace(/["\r\n]/g, "");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Download failed", { status: 500 });
  }
}
