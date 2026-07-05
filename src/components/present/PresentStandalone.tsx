"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import PresentOverlay from "./PresentOverlay";
import type { PresentData } from "@/lib/present";

// Full-page /present route: opens the overlay immediately; Close returns to the cockpit.
export default function PresentStandalone({
  data,
  initialId,
  initialTab,
}: {
  data: PresentData;
  initialId: string;
  initialTab?: number;
}) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState(initialId);
  const close = useCallback(() => router.push("/"), [router]);
  const nav = useCallback(
    (dir: -1 | 1) =>
      setCurrentId((cur) => {
        const i = data.order.indexOf(cur);
        return data.order[(i + dir + data.order.length) % data.order.length];
      }),
    [data],
  );
  return <PresentOverlay data={data} currentId={currentId} onClose={close} onNav={nav} initialTab={initialTab} />;
}
