// Start: npx.cmd tsx lib/skillPlanner.test.ts
import assert from "node:assert/strict";
import { formatDuration, hoursNeeded, xpToLevel } from "./skillPlanner";

const levels = [
  { level: 1, totalExpRequired: 50 },
  { level: 2, totalExpRequired: 175 },
  { level: 3, totalExpRequired: 375 },
];
assert.equal(xpToLevel(100, 3, levels), 275);
assert.equal(xpToLevel(375, 3, levels), 0);
assert.equal(xpToLevel(9999, 3, levels), 0);
assert.equal(xpToLevel(0, 99, levels), 0); // unbekanntes Level
assert.equal(xpToLevel(NaN, 1, levels), 50);

assert.equal(hoursNeeded(1000, 500), 2);
assert.equal(hoursNeeded(1000, 0), null);
assert.equal(hoursNeeded(1000, NaN), null);

assert.equal(formatDuration(0), "0m");
assert.equal(formatDuration(0.25), "15m");
assert.equal(formatDuration(1.5), "1h 30m");
assert.equal(formatDuration(2), "2h");
assert.equal(formatDuration(52), "2d 4h");
assert.equal(formatDuration(48), "2d");

console.log("skillPlanner: ok");
