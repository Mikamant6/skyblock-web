// Zusaetzliche Links pro Skill zu Seiten, fuer die wir echte Daten haben (nichts erfunden).
export type SkillExtra = { label: string; href: string };

const EXTRAS: Record<string, SkillExtra[]> = {
  COMBAT: [
    { label: "Slayers", href: "/profile/slayers" },
    { label: "Dungeons", href: "/profile/dungeons" },
  ],
  TAMING: [{ label: "Pets", href: "/profile/pets" }],
};

export function getSkillExtras(skillKey: string): SkillExtra[] {
  return EXTRAS[skillKey] ?? [];
}
