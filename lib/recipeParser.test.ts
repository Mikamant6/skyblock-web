import assert from "node:assert/strict";
import test from "node:test";
import { guessItemId, parseItemRecipe, parseSlot, stripColorCodes } from "./recipeParser";

test("parseSlot liest ID und Menge", () => {
  assert.deepEqual(parseSlot("POTATO_ITEM:32"), { id: "POTATO_ITEM", count: 32 });
  assert.deepEqual(parseSlot("STICK"), { id: "STICK", count: 1 });
  assert.equal(parseSlot(""), null);
  assert.equal(parseSlot(undefined), null);
  assert.equal(parseSlot("X:abc"), null);
});

test("parseItemRecipe: altes Format mit recipe", () => {
  const parsed = parseItemRecipe({
    recipe: { A1: "", A2: "POTATO_ITEM:32", A3: "", B1: "POTATO_ITEM:32", B2: "POTATO_ITEM:32", B3: "POTATO_ITEM:32", C1: "", C2: "POTATO_ITEM:32", C3: "" },
  });
  assert.equal(parsed?.grid.length, 9);
  assert.equal(parsed?.grid[0], null);
  assert.deepEqual(parsed?.grid[4], { id: "POTATO_ITEM", count: 32 });
  assert.equal(parsed?.outputCount, 1);
});

test("parseItemRecipe: neues Format mit recipes, Schmelz-Rezepte werden ignoriert", () => {
  const parsed = parseItemRecipe({
    recipes: [{ type: "forge", inputs: ["X:1"] }, { type: "crafting", A1: "COAL:5", count: 2 }],
  });
  assert.deepEqual(parsed?.grid[0], { id: "COAL", count: 5 });
  assert.equal(parsed?.outputCount, 2);
});

test("parseItemRecipe: kein Rezept", () => {
  assert.equal(parseItemRecipe({ lore: [] }), null);
  assert.equal(parseItemRecipe({ recipe: { A1: "" } }), null);
  assert.equal(parseItemRecipe(null), null);
});

test("Namen und IDs", () => {
  assert.equal(stripColorCodes("§aEnchanted Potato"), "Enchanted Potato");
  assert.equal(guessItemId("Enchanted Potato"), "ENCHANTED_POTATO");
  assert.equal(guessItemId("Rancher's Boots"), "RANCHERS_BOOTS");
});
