// Start: npx.cmd tsx lib/collectionProgress.test.ts
import assert from "node:assert/strict";
import { getCollectionProgress } from "./collectionProgress";
import { parseCollectionResources } from "./collectionResources";

// Beispiel-Stufen (nur zum Testen)
const tiers = [
  { tier: 1, amountRequired: 50 },
  { tier: 2, amountRequired: 100 },
  { tier: 3, amountRequired: 200 },
];
assert.deepEqual(getCollectionProgress(0, tiers), { tier: 0, maxTier: 3, nextRequired: 50, fraction: 0 });
assert.deepEqual(getCollectionProgress(25, tiers), { tier: 0, maxTier: 3, nextRequired: 50, fraction: 0.5 });
assert.deepEqual(getCollectionProgress(100, tiers), { tier: 2, maxTier: 3, nextRequired: 200, fraction: 0 });
assert.deepEqual(getCollectionProgress(150, tiers), { tier: 2, maxTier: 3, nextRequired: 200, fraction: 0.5 });
assert.deepEqual(getCollectionProgress(999, tiers), { tier: 3, maxTier: 3, nextRequired: null, fraction: 1 });
assert.equal(getCollectionProgress(NaN, tiers).tier, 0);

// Parser: erwartete Form in Ordnung, Fehlformen abgelehnt
const parsed = parseCollectionResources({
  collections: {
    FARMING: {
      name: "Farming",
      items: {
        WHEAT: { name: "Wheat", tiers: [{ tier: 2, amountRequired: 100 }, { tier: 1, amountRequired: 50 }] },
        BROKEN: { name: "Broken" },
      },
    },
  },
});
assert.notEqual(parsed, null);
assert.deepEqual(parsed!.FARMING.items.map((item) => item.id), ["WHEAT"]);
assert.deepEqual(parsed!.FARMING.items[0].tiers.map((t) => t.tier), [1, 2]);
assert.equal(parseCollectionResources(null), null);
assert.equal(parseCollectionResources({ collections: {} }), null);

console.log("collectionProgress: ok");
