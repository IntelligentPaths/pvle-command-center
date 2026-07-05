"use client";

import { Play } from "lucide-react";
import { usePresent } from "./PresentProvider";

interface Zone {
  id: string;
  name: string;
  type: string;
  status: string;
  note: string;
  color: string;
}

// Ecosystem tiles on the Command Center — each opens that entity's Present view.
export default function EcosystemZones({ zones }: { zones: Zone[] }) {
  const { open } = usePresent();
  return (
    <div className="zones">
      {zones.map((z) => (
        <div
          key={z.id}
          className="zone"
          style={{ borderLeftColor: z.color }}
          role="button"
          tabIndex={0}
          aria-label={`Present ${z.name}`}
          onClick={() => open(z.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open(z.id);
            }
          }}
        >
          <div className="glow" style={{ background: z.color }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div className="znm">{z.name}</div>
              <div className="ztag">{z.type.toUpperCase()}</div>
            </div>
            <div className="pulse">
              <span className="dot" style={{ background: z.color, boxShadow: `0 0 6px ${z.color}` }} />
              {z.status}
            </div>
          </div>
          <div className="znote">{z.note}</div>
          <div className="pbadge" style={{ color: z.color }}>
            <Play size={9} /> PRESENT
          </div>
        </div>
      ))}
    </div>
  );
}
