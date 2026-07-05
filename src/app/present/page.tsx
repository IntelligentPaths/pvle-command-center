import { getPresentData } from "@/lib/present";
import PresentStandalone from "@/components/present/PresentStandalone";

// Full-page Present mode (also available as an overlay from the dashboard).
// e.g. /present, /present?id=SNK, /present?id=PVY&tab=1
export const dynamic = "force-dynamic";

export default async function PresentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[]; tab?: string | string[] }>;
}) {
  const sp = await searchParams;
  const idParam = Array.isArray(sp.id) ? sp.id[0] : sp.id;
  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;

  const data = await getPresentData();
  const initialId = idParam && data.views[idParam] ? idParam : "ALL";
  const initialTab = Math.max(0, Math.min(3, parseInt(tabParam || "0") || 0));
  const bg = data.views[initialId]?.pal.bg ?? "#faf7fb";

  return (
    <>
      {/* opaque backdrop so there's no dark flash before the portal overlay mounts */}
      <div style={{ position: "fixed", inset: 0, background: bg, zIndex: 1 }} aria-hidden="true" />
      <PresentStandalone data={data} initialId={initialId} initialTab={initialTab} />
    </>
  );
}
