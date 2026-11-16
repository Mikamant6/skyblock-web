// Start: npx.cmd tsx lib/slayerService.test.ts
import assert from "node:assert/strict";
import { readKillsByTier } from "./slayerService";
import { getSkillProgress } from "./skillProgress";
import { SLAYER_TYPES } from "./slayerTables";

assert.deepEqual(readKillsByTier(undefined), []);
assert.deepEqual(readKillsByTier({ xp: 100, boss_kills_tier_0: 3, boss_kills_tier_2: 5 }), [3, 0, 5]);
assert.deepEqual(readKillsByTier({ boss_kills_tier_x: 3, other: 9 }), []);

// Revenant: Level 5 ab 5000 XP, Level 9 ab 1.000.000
const zombie = SLAYER_TYPES.find((type) => type.key === "zombie")!;
assert.equal(getSkillProgress(4999, zombie.levels).level, 4);
assert.equal(getSkillProgress(5000, zombie.levels).level, 5);
assert.equal(getSkillProgress(2_000_000, zombie.levels).xpForNextLevel, null);
// Vampire hat nur 5 Level
const vampire = SLAYER_TYPES.find((type) => type.key === "vampire")!;
assert.equal(getSkillProgress(2400, vampire.levels).level, 5);
assert.equal(getSkillProgress(2400, vampire.levels).xpForNextLevel, null);
// Jede Tabelle ist aufsteigend
for (const type of SLAYER_TYPES) {
  for (let i = 1; i < type.levels.length; i++) {
    assert.ok(type.levels[i].totalExpRequired > type.levels[i - 1].totalExpRequired, type.key);
  }
}

console.log("slayerService: ok");
