import assert from "node:assert/strict";
import test from "node:test";
import { parseDungeons, parseMinions, parsePets, prettyName } from "./extras";

test("prettyName", () => assert.equal(prettyName("LAPIS_LAZULI"), "Lapis Lazuli"));

test("parseMinions: hoechste Stufe, ungueltige ignoriert", () => {
  const rows = parseMinions(["COBBLESTONE_1", "COBBLESTONE_5", "WHEAT_3", 7, "kaputt"]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { key: "COBBLESTONE", name: "Cobblestone", highestTier: 5, craftedTiers: 2 });
  assert.deepEqual(parseMinions(undefined), []);
});

test("parsePets: aktives zuerst, dann Seltenheit", () => {
  const rows = parsePets([
    { type: "TIGER", exp: 5, tier: "COMMON" },
    { type: "ENDER_DRAGON", exp: 100, tier: "LEGENDARY" },
    { type: "WOLF", exp: 1, tier: "RARE", active: true, heldItem: "PET_ITEM_X" },
    "x",
  ]);
  assert.deepEqual(rows.map((r) => r.type), ["WOLF", "ENDER_DRAGON", "TIGER"]);
  assert.equal(rows[0].heldItem, "Pet Item X");
});

test("parseDungeons: liest XP, Klassen und Abschluesse", () => {
  const d = parseDungeons({
    selected_dungeon_class: "mage",
    player_classes: { mage: { experience: 10 }, healer: { experience: 99 } },
    dungeon_types: {
      catacombs: { experience: 1234, tier_completions: { "0": 2, "1": 3, total: 5 } },
      master_catacombs: { experience: 50 },
    },
  });
  assert.equal(d.catacombsExp, 1234);
  assert.equal(d.masterExp, 50);
  assert.equal(d.selectedClass, "Mage");
  assert.equal(d.classes[0].name, "Healer");
  assert.deepEqual(d.completions, [2, 3]);
  assert.equal(parseDungeons(null).catacombsExp, 0);
});
