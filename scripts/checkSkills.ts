// Prueft EINMAL, ob die oeffentlichen Hypixel-Tabellen (Skills und Collections) die erwartete Form haben.
// Start: npx.cmd tsx scripts/checkSkills.ts
import { parseCollectionResources } from "../lib/collectionResources";
import { parseSkillResources } from "../lib/skillResources";

const skillsResponse = await fetch("https://api.hypixel.net/v2/resources/skyblock/skills");
console.log("Skills - Status:", skillsResponse.status);
const skills = parseSkillResources(await skillsResponse.json());
if (skills === null) {
  console.log("PROBLEM: Die Skill-Antwort hat nicht die erwartete Form.");
} else {
  for (const table of Object.values(skills)) {
    const last = table.levels[table.levels.length - 1];
    const withUnlocks = table.levels.filter((l) => (l.unlocks ?? []).length > 0).length;
    console.log(
      `${table.key}: ${table.name}, ${table.levels.length} Level, Level ${last.level} ab ${last.totalExpRequired} XP, ${withUnlocks} Level mit Belohnungs-Text`,
    );
  }
}

const collectionsResponse = await fetch("https://api.hypixel.net/v2/resources/skyblock/collections");
console.log("\nCollections - Status:", collectionsResponse.status);
const collections = parseCollectionResources(await collectionsResponse.json());
if (collections === null) {
  console.log("PROBLEM: Die Collection-Antwort hat nicht die erwartete Form.");
} else {
  for (const group of Object.values(collections)) {
    console.log(`${group.key}: ${group.name}, ${group.items.length} Collections`);
  }
}
