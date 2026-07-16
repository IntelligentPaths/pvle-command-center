// Streams a Drive file by id for the Files browser (SA-owned files aren't shareable to a
// user's Google account, so we proxy; user-owned files under the folder are readable by
// the SA too). Login-gated; refuses NLT by name.
import { NextResponse } from "next/server";
import { getFileDownload, isNltFolder } from "@/lib/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = (searchParams.get("fileId") ?? "").trim();
  if (!fileId) return new NextResponse("fileId required", { status: 400 });

  try {
    const { buffer, mimeType, name } = await getFileDownload(fileId);
    if (isNltFolder(name)) return new NextResponse("Not found", { status: 404 });
    const filename = name.replace(/["\r\n]/g, "");
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
