// Start: npx.cmd tsx lib/shardProgress.test.ts
import assert from "node:assert/strict";
import { calculateLevel } from "./shardAttributes";
import levels from "../data/shardLevels.json";
import { getShardProgress } from "./shardProgress";

// common: 0, 1, 4, 9, 15, 22, 30, 40, 54, 72, 96
assert.deepEqual(getShardProgress("common", 0, levels), { level: 0, maxLevel: 10, nextLevel: 1, remaining: 1 });
assert.deepEqual(getShardProgress("common", 1, levels), { level: 1, maxLevel: 10, nextLevel: 2, remaining: 3 });
assert.deepEqual(getShardProgress("common", 3, levels), { level: 1, maxLevel: 10, nextLevel: 2, remaining: 1 });
assert.deepEqual(getShardProgress("common", 4, levels), { level: 2, maxLevel: 10, nextLevel: 3, remaining: 5 });
// Hoechstes Level: nichts mehr bis zum naechsten
assert.deepEqual(getShardProgress("common", 96, levels), { level: 10, maxLevel: 10, nextLevel: null, remaining: null });
assert.equal(getShardProgress("common", 500, levels).remaining, null);
// legendary: 0, 1, 2, 3, 5, ... -> bei 4 Stueck: Level 3, noch 1 bis Level 4
assert.deepEqual(getShardProgress("legendary", 4, levels), { level: 3, maxLevel: 10, nextLevel: 4, remaining: 1 });

// Level stimmt mit der bestehenden Berechnung ueberein (alle Seltenheiten, alle Mengen 0 bis 120)
for (const rarity of Object.keys(levels)) {
  for (let n = 0; n <= 120; n++) {
    assert.equal(getShardProgress(rarity, n, levels).level, calculateLevel(rarity, n, levels));
  }
}
assert.throws(() => getShardProgress("mythic", 1, levels));

console.log("shardProgress: ok");
