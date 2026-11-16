// Start: npx.cmd tsx lib/skillProgress.test.ts
import assert from "node:assert/strict";
import { getSkillProgress, skillAverage, type SkillLevel } from "./skillProgress";

// Kleine Beispiel-Tabelle (nur zum Testen): Level 1 bei 50 XP, Level 2 bei 175, Level 3 bei 375
const table: SkillLevel[] = [
  { level: 1, totalExpRequired: 50 },
  { level: 2, totalExpRequired: 175 },
  { level: 3, totalExpRequired: 375 },
];

assert.deepEqual(getSkillProgress(0, table), { level: 0, maxLevel: 3, xpIntoLevel: 0, xpForNextLevel: 50, fraction: 0 });
assert.deepEqual(getSkillProgress(25, table), { level: 0, maxLevel: 3, xpIntoLevel: 25, xpForNextLevel: 50, fraction: 0.5 });
assert.deepEqual(getSkillProgress(50, table), { level: 1, maxLevel: 3, xpIntoLevel: 0, xpForNextLevel: 125, fraction: 0 });
assert.deepEqual(getSkillProgress(112.5, table), { level: 1, maxLevel: 3, xpIntoLevel: 62.5, xpForNextLevel: 125, fraction: 0.5 });
assert.deepEqual(getSkillProgress(375, table), { level: 3, maxLevel: 3, xpIntoLevel: 0, xpForNextLevel: null, fraction: 1 });
assert.equal(getSkillProgress(99999, table).level, 3);
// Ungueltige Werte zaehlen als 0
assert.equal(getSkillProgress(NaN, table).level, 0);
assert.equal(getSkillProgress(-5, table).level, 0);

// Average: Level 1 mit halbem Fortschritt (1,5) und Level 3 (3) -> 2,25
assert.equal(skillAverage([getSkillProgress(112.5, table), getSkillProgress(375, table)]), 2.25);
assert.equal(skillAverage([]), 0);

console.log("skillProgress: ok");
