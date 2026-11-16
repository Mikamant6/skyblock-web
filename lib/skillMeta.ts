// Anzeige-Daten pro Skill (Farbe, Kurztext). Keine Server-Zugriffe: darf auch im Browser benutzt werden.
// Der Schluessel (z. B. "FARMING") ist derselbe wie in den Hypixel-Daten, der Slug (z. B. "farming")
// steht in der Adresse /profile/skills/farming.

export type SkillMeta = { color: string; about: string };

export const SKILL_META: Record<string, SkillMeta> = {
  FARMING: { color: "#7bc043", about: "Grows by harvesting crops and farming animals. Its collections unlock many minions and recipes." },
  MINING: { color: "#8ea6bd", about: "Grows by mining ores and stone, including in the Dwarven Mines and Crystal Hollows." },
  COMBAT: { color: "#e0534a", about: "Grows by killing mobs. It also gives a bonus to critical chance." },
  FORAGING: { color: "#33a867", about: "Grows by chopping trees and gathering from the forest." },
  FISHING: { color: "#3b9edd", about: "Grows by fishing and killing sea creatures." },
  ENCHANTING: { color: "#b36be0", about: "Grows by using the Enchantment Table and the experimentation features." },
  ALCHEMY: { color: "#d86bb0", about: "Grows by brewing potions." },
  TAMING: { color: "#e9a23b", about: "Grows by leveling up pets. Higher levels give a pet luck bonus." },
  CARPENTRY: { color: "#b9854f", about: "Grows by crafting items. It increases your crafting slots." },
  RUNECRAFTING: { color: "#8b7cf0", about: "Grows by crafting and fusing runes. It does not count for the skill average." },
  SOCIAL: { color: "#4fc3a1", about: "Grows by playing together with others on a co-op. It does not count for the skill average." },
};

const FALLBACK: SkillMeta = { color: "#9ca3af", about: "" };

export function getSkillMeta(key: string): SkillMeta {
  return SKILL_META[key] ?? FALLBACK;
}

// Adresse eines Skills: "FARMING" -> "farming"
export function skillSlug(key: string): string {
  return key.toLowerCase();
}

// Die Reihenfolge, in der die Skills im Menue und auf der Uebersicht stehen
export const SKILL_ORDER = [
  "FARMING", "MINING", "COMBAT", "FORAGING", "FISHING", "ENCHANTING",
  "ALCHEMY", "TAMING", "CARPENTRY", "RUNECRAFTING", "SOCIAL",
];
