// Gemeinsames Layout aller Skill-Seiten: Tableiste zum schnellen Wechseln zwischen den Skills.
import type { ReactNode } from "react";
import SkillTabs from "./SkillTabs";

export default function SkillsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkillTabs />
      {children}
    </>
  );
}
