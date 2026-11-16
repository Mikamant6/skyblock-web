// Start: npx.cmd tsx lib/skillResources.test.ts
import assert from "node:assert/strict";
import { parseSkillResources } from "./skillResources";

// Beispiel in der Form, wie wir sie von Hypixel erwarten (Zahlen nur zum Testen)
const sample = {
  success: true,
  skills: {
    FARMING: {
      name: "Farming",
      levels: [
        { level: 2, totalExpRequired: 175 },
        { level: 1, totalExpRequired: 50 },
      ],
    },
    BROKEN: { name: "Broken" }, // ohne Level-Liste: wird uebersprungen
  },
};
const parsed = parseSkillResources(sample);
assert.notEqual(parsed, null);
assert.deepEqual(Object.keys(parsed!), ["FARMING"]);
assert.equal(parsed!.FARMING.name, "Farming");
// Level werden aufsteigend sortiert
assert.deepEqual(parsed!.FARMING.levels.map((l) => l.level), [1, 2]);

// Falsche Formen werden abgelehnt
assert.equal(parseSkillResources(null), null);
assert.equal(parseSkillResources({}), null);
assert.equal(parseSkillResources({ skills: {} }), null);
assert.equal(parseSkillResources({ skills: { X: { name: "X", levels: [{ level: "1" }] } } }), null);

console.log("skillResources: ok");
