// Tests fuer calculateShardValue: dieselben Faelle wie in R (03_calculation.R).
// Ausfuehren mit:  npx tsx lib/shardValue.test.ts
import assert from "node:assert/strict";
import { calculateShardValue } from "./shardValue";

// Kommazahlen sind im Computer nie ganz exakt, deshalb vergleichen wir mit
// einer winzigen Toleranz statt mit "genau gleich".
function assertClose(actual: number, expected: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${label}: erwartet ${expected}, bekommen ${actual}`,
  );
}

// Test 1: 2500 Shards, Sell-Offer 100, Instant-Sell 50, Wochenmenge 16800
const t1 = calculateShardValue(2500, 100, 50, 16800);
assertClose(t1.unitsSellOffer, 2400, "Test 1 unitsSellOffer");
assertClose(t1.unitsInstantSell, 100, "Test 1 unitsInstantSell");
assertClose(t1.unitsUnpriced, 0, "Test 1 unitsUnpriced");
assertClose(t1.valueRaw, 245000, "Test 1 valueRaw");
assertClose(t1.valueAfterTax, 241937.5, "Test 1 valueAfterTax");

// Test 2: kein Sell-Offer-Preis
const t2 = calculateShardValue(300, null, 50, 16800);
assertClose(t2.unitsSellOffer, 0, "Test 2 unitsSellOffer");
assertClose(t2.unitsInstantSell, 300, "Test 2 unitsInstantSell");
assertClose(t2.unitsUnpriced, 0, "Test 2 unitsUnpriced");
assertClose(t2.valueRaw, 15000, "Test 2 valueRaw");
assertClose(t2.valueAfterTax, 14812.5, "Test 2 valueAfterTax");

// Test 3: kein Instant-Sell-Preis
const t3 = calculateShardValue(2500, 100, null, 16800);
assertClose(t3.unitsSellOffer, 2400, "Test 3 unitsSellOffer");
assertClose(t3.unitsInstantSell, 0, "Test 3 unitsInstantSell");
assertClose(t3.unitsUnpriced, 100, "Test 3 unitsUnpriced");
assertClose(t3.valueRaw, 240000, "Test 3 valueRaw");
assertClose(t3.valueAfterTax, 237000, "Test 3 valueAfterTax");

console.log("Alle 3 Tests bestanden.");