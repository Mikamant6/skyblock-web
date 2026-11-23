// Gemeinsames Layout aller Guide-Seiten: oben die Skill-Auswahl, darunter der Guide des gewaehlten Skills.
import type { ReactNode } from "react";
import GuideSkillTabs from "./GuideSkillTabs";

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <GuideSkillTabs />
      {children}
    </>
  );
}
