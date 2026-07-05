"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { PresentData } from "@/lib/present";
import PresentOverlay from "./PresentOverlay";

const PresentContext = createContext<{ open: (id: string) => void } | null>(null);

export function usePresent() {
  return useContext(PresentContext) ?? { open: () => {} };
}

// Client wrapper around the (server-rendered) dashboard. Holds the open state and
// renders the portal overlay; the Present button + ecosystem tiles call open().
export default function PresentProvider({ data, children }: { data: PresentData; children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const open = useCallback((id: string) => setOpenId(data.views[id] ? id : "ALL"), [data]);
  const close = useCallback(() => setOpenId(null), []);
  const nav = useCallback(
    (dir: -1 | 1) =>
      setOpenId((cur) => {
        if (!cur) return cur;
        const i = data.order.indexOf(cur);
        return data.order[(i + dir + data.order.length) % data.order.length];
      }),
    [data],
  );

  return (
    <PresentContext.Provider value={{ open }}>
      {children}
      {openId && <PresentOverlay data={data} currentId={openId} onClose={close} onNav={nav} />}
    </PresentContext.Provider>
  );
}
