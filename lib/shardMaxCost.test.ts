// Test fuer calculateMaxCosts: npx.cmd tsx lib/shardMaxCost.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateMaxCosts } from "./shardMaxCost";

const levels = { common: [0, 1, 4, 9, 15, 22, 30, 40, 54, 72, 96], legendary: [0, 1, 2, 3, 5, 7, 9, 12, 15, 19, 24] };
const shards = [
  { attributeId: "a", shardName: "Alpha", productId: "SHARD_ALPHA", rarity: "common" },
  { attributeId: "b", shardName: "Beta", productId: "SHARD_BETA", rarity: "legendary" },
  { attributeId: "c", shardName: "Gamma", productId: "SHARD_GAMMA", rarity: "legendary" },
  { attributeId: "d", shardName: "Delta", productId: "SHARD_DELTA", rarity: "legendary" },
];
const price = (p: number | null) => ({ sellOfferPrice: p, instantSellPrice: null, weeklyInstantBuys: null });
const prices = { SHARD_ALPHA: price(10), SHARD_BETA: price(100), SHARD_GAMMA: price(5) }; // Delta ohne Preis

test("Kosten bis Level 10, Sortierung und Gruppen", () => {
  // Alpha: 96 fehlen x 10 = 960; Beta: 24-10 = 14 x 100 = 1400; Gamma: schon 24 = maximiert; Delta: ohne Preis
  const result = calculateMaxCosts(shards, { a: 0, b: 10, c: 24 }, prices, levels, []);
  assert.deepEqual(result.rows.map((r) => r.shardName), ["Alpha", "Beta", "Gamma", "Delta"]);
  assert.equal(result.rows[0].cost, 960);
  assert.equal(result.rows[1].cost, 1400);
  assert.equal(result.rows[1].remaining, 14);
  assert.equal(result.rows[2].maxed, true);
  assert.equal(result.rows[2].cost, 0);
  assert.equal(result.rows[3].cost, null);
  assert.equal(result.maxedCount, 1);
  assert.equal(result.totalCount, 4);
});

test("mehr als noetig besessen: nichts fehlt", () => {
  const result = calculateMaxCosts([shards[0]], { a: 500 }, prices, levels, []);
  assert.equal(result.rows[0].remaining, 0);
  assert.equal(result.rows[0].level, 10);
});

test("Bazaar-Override ohne Handel: kein Preis", () => {
  const result = calculateMaxCosts([shards[0]], {}, prices, levels, [{ shardProductId: "SHARD_ALPHA", bazaarProductId: null, evidence: "x" }]);
  assert.equal(result.rows[0].unitPrice, null);
  assert.equal(result.rows[0].cost, null);
});
