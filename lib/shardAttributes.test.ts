// Tests fuer shardAttributes.ts und die Datentabellen.
// Ausfuehren mit:  npx.cmd tsx lib/shardAttributes.test.ts
import assert from "node:assert/strict";
import {
  attachShards,
  calculateLevel,
  getBazaarProductId,
} from "./shardAttributes";
import { bazaarOverrides, shardLevels, shardLookup } from "./shardData";
import stacksAfter from "./fixtures/stacksAfter.json";

// ---- 1. Zuordnung: Aliase haben Vorrang ------------------------------------
// Beide Attribute heissen aehnlich, gehoeren aber zu verschiedenen Shards.
assert.equal(shardLookup.get("humanoid_ruler")?.shardName, "Drowned");
assert.equal(shardLookup.get("humanoid_ruler_new")?.shardName, "Wetwing");
assert.equal(shardLookup.get("spider_essence")?.shardName, "Arachne");
assert.equal(shardLookup.get("hunter")?.shardName, "Bogged");
// Am 11.11.2026 per Ausschluss zugeordnet (Atlas: 183 freigeschaltete Attribute =
// 181 zugeordnete + diese beiden; nur diese zwei Shards waren maxed und fehlten)
assert.equal(shardLookup.get("undead")?.shardName, "Zombie Soldier");
assert.equal(shardLookup.get("undead_essence")?.shardName, "Revenant");
// Ein ganz normaler Shard aus der Wiki-Tabelle
assert.equal(shardLookup.get("nature_elemental")?.shardName, "Grove");
console.log("1. Zuordnung der Aliase: ok");

// ---- 2. Alle Stacks eines echten Accounts werden zugeordnet ------------------
const { matched, unmatched } = attachShards(stacksAfter, shardLookup);
assert.equal(unmatched.length, 0, "es gibt unbekannte Attribute");
assert.equal(matched.length, Object.keys(stacksAfter).length);

// Die Mengen gehen bei der Zuordnung nicht verloren
const sumStacks = Object.values(stacksAfter).reduce((a, b) => a + b, 0);
const sumMatched = matched.reduce((a, m) => a + m.shardsSyphoned, 0);
assert.equal(sumMatched, sumStacks);

// Zwei Attribute duerfen nie auf denselben Shard zeigen
const products = new Set(matched.map((m) => m.productId));
assert.equal(products.size, matched.length);
console.log(
  `2. Test-Account: ${matched.length} Shards, ${sumMatched} Stueck, 0 unbekannt: ok`,
);

// Stand vom 11.11.2026: zwei weitere Shards mit voller Stufe (64 = Uncommon max, 48 = Rare max)
const newer = attachShards({ ...stacksAfter, undead: 64, undead_essence: 48 }, shardLookup);
assert.equal(newer.unmatched.length, 0);
assert.equal(newer.matched.length, Object.keys(stacksAfter).length + 2);
const soldier = newer.matched.find((m) => m.attributeId === "undead");
const revenant = newer.matched.find((m) => m.attributeId === "undead_essence");
assert.equal(soldier?.rarity, "uncommon");
assert.equal(revenant?.rarity, "rare");
assert.equal(calculateLevel("uncommon", 64, shardLevels), 10);
assert.equal(calculateLevel("rare", 48, shardLevels), 10);
console.log("   Stand 11.11. (181 + 2 Shards): ok");

// Ein unbekanntes Attribut wird gemeldet und stoppt nichts
const unknown = attachShards({ gibt_es_nicht: 5, hunter: 2 }, shardLookup);
assert.equal(unknown.unmatched.length, 1);
assert.equal(unknown.unmatched[0].attributeId, "gibt_es_nicht");
assert.equal(unknown.matched.length, 1);
console.log("   Unbekanntes Attribut wird getrennt gemeldet: ok");

// ---- 3. Level ------------------------------------------------------------
// Bekannte Endpunkte: kumulierte Shards bis Level 10
const level10 = { common: 96, uncommon: 64, rare: 48, epic: 32, legendary: 24 };
for (const [rarity, needed] of Object.entries(level10)) {
  assert.equal(calculateLevel(rarity, 0, shardLevels), 0, `${rarity} bei 0`);
  assert.equal(calculateLevel(rarity, needed, shardLevels), 10, `${rarity} max`);
  assert.equal(calculateLevel(rarity, needed - 1, shardLevels), 9, `${rarity} -1`);
  assert.equal(calculateLevel(rarity, needed + 500, shardLevels), 10, `${rarity} drueber`);
}
// An jeder Grenze springt das Level genau dort
for (const [rarity, cumulative] of Object.entries(shardLevels)) {
  for (let level = 1; level < cumulative.length; level++) {
    assert.equal(calculateLevel(rarity, cumulative[level], shardLevels), level);
    assert.equal(calculateLevel(rarity, cumulative[level] - 1, shardLevels), level - 1);
  }
}
// Eine unbekannte Seltenheit wird nicht stillschweigend akzeptiert
assert.throws(() => calculateLevel("mythic", 5, shardLevels));
console.log("3. Level an allen Grenzen: ok");

// ---- 4. Bazaar-ID -----------------------------------------------------------
assert.equal(getBazaarProductId("SHARD_BOGGED", bazaarOverrides), "SHARD_SEA_ARCHER");
assert.equal(getBazaarProductId("SHARD_BEETLE", bazaarOverrides), "SHARD_CROPEETLE");
assert.equal(getBazaarProductId("SHARD_RAINBUG", bazaarOverrides), null);
assert.equal(getBazaarProductId("SHARD_GROVE", bazaarOverrides), "SHARD_GROVE");
assert.equal(getBazaarProductId("SHARD_WITHER_SPECTRE", bazaarOverrides), "SHARD_WITHER_SPECTER");
console.log("4. Bazaar-IDs: ok");

console.log("Alle Tests bestanden.");
