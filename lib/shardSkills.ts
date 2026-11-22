// Zu welchem Skill gehoert ein Shard? Quelle: Spalte "Skill" der Wiki-Seite "Attributes/List"
// (gespeichert in data/shardSkills.json, Schluessel = Shard-ID wie "SHARD_GROVE").
// Werte: Combat, Fishing, Foraging, Farming, Mining, Taming, Enchanting, Alchemy, Hunting oder Global (kein bestimmter Skill).
// Keine Server-Zugriffe: darf auch im Browser benutzt werden.
import shardSkillsJson from "../data/shardSkills.json";

const skillByProduct: Record<string, string> = shardSkillsJson.skills;

export function shardSkillOf(productId: string): string {
  return skillByProduct[productId] ?? "Global";
}

// "FORAGING" -> "Foraging" (so steht der Skill in der Wiki-Tabelle)
export function skillWikiName(skillKey: string): string {
  return skillKey.charAt(0) + skillKey.slice(1).toLowerCase();
}

// Wie viele Shards gehoeren zu diesem Skill? 0 = der Skill hat keine eigenen Shards (z. B. Carpentry)
export function shardCountForSkill(skillKey: string): number {
  const wanted = skillWikiName(skillKey);
  return Object.values(skillByProduct).filter((skill) => skill === wanted).length;
}
