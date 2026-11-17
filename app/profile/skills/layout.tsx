// Gemeinsames Layout aller Skill-Seiten.
// Die Tableiste (SkillTabs) ist testweise ausgeblendet: zum Zurueckholen die zwei markierten Zeilen wieder aktivieren.
import type { ReactNode } from "react";
// import SkillTabs from "./SkillTabs";

export default function SkillsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* <SkillTabs /> */}
      {children}
    </>
  );
}
