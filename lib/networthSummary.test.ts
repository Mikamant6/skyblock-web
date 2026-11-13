// Test fuer die reine Networth-Logik. Start: npx.cmd tsx lib/networthSummary.test.ts
import assert from "node:assert/strict";
import { grandTotal, summarizeNetworth } from "./networthSummary";

const raw = {
  networth: 1_000_000_000,
  unsoulboundNetworth: 900_000_000,
  noInventory: false,
  purse: 5_000_000,
  bank: 95_000_000,
  types: {
    inventory: { total: 100 },
    pets: { total: 500 },
    museum: { total: 0 }, // wird weggelassen
    armor: { total: Number.NaN }, // ungueltig -> 0 -> weggelassen
    enderchest: { total: 300 },
  },
};

const summary = summarizeNetworth(raw);
assert.equal(summary.networth, 1_000_000_000);
assert.equal(summary.purse, 5_000_000);
assert.equal(summary.bank, 95_000_000);
assert.equal(summary.noInventory, false);
// nur Werte > 0, groesster zuerst
assert.deepEqual(
  summary.categories.map((c) => c.id),
  ["pets", "enderchest", "inventory"],
);

// Fehlende/kaputte Felder werden 0, nicht NaN
const broken = summarizeNetworth({ ...raw, networth: Number.NaN, types: {} });
assert.equal(broken.networth, 0);
assert.deepEqual(broken.categories, []);
assert.equal(summarizeNetworth({ ...raw, noInventory: true }).noInventory, true);

// Gesamtwert = Networth ohne Shards + Shard-Rohwert
assert.equal(grandTotal(1_000_000_000, 217_641_625.3), 1_217_641_625.3);
assert.equal(grandTotal(0, 5), 5);
assert.equal(grandTotal(Number.NaN, 5), 5);

console.log("networthSummary: ok");
