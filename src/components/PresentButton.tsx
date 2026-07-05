"use client";

import { Presentation } from "lucide-react";
import { usePresent } from "./present/PresentProvider";

// Opens the ecosystem-wide ("ALL") Present view over the cockpit.
export default function PresentButton() {
  const { open } = usePresent();
  return (
    <button className="present-btn" onClick={() => open("ALL")}>
      <Presentation size={16} /> Present ecosystem
    </button>
  );
}
