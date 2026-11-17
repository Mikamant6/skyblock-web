import assert from "node:assert/strict";
import test from "node:test";
import { colorizeReward } from "./rewardText";

test("Coins gold, SkyBlock XP tuerkis, Health rot", () => {
  assert.equal(colorizeReward("+250 Coins")[0].color, "#FFAA00");
  assert.equal(colorizeReward("+5 SkyBlock XP")[0].color, "#55FFFF");
  assert.equal(colorizeReward("+2 Health")[0].color, "#FF5555");
  assert.equal(colorizeReward("+3 Defense")[0].color, "#55FF55");
});

test("Freischaltung gruen, Reforge lila, Unbekanntes grau", () => {
  assert.equal(colorizeReward("+Access to The Barn")[0].color, "#55FF55");
  assert.equal(colorizeReward("Jerry Stone Reforge")[0].color, "#FF55FF");
  assert.deepEqual(colorizeReward("Something new"), [{ text: "Something new", color: "#AAAAAA" }]);
  assert.equal(colorizeReward("+7 Unknown Stat")[0].color, "#AAAAAA");
});

test("Faehigkeit: Name gold, Wert in Stat-Farbe, Rest grau; Text bleibt vollstaendig", () => {
  const text = "Farmhand II   Grants +4➜8  Farming Fortune, which increases your chance for multiple crops.";
  const segments = colorizeReward(text);
  assert.equal(segments[0].text, "Farmhand II");
  assert.equal(segments[0].color, "#FFAA00");
  assert.equal(segments[2].text, "+4➜8  Farming Fortune");
  assert.equal(segments[2].color, "#FFAA00");
  assert.equal(segments[3].color, "#AAAAAA");
  // Zusammengesetzt ergibt sich der Originaltext (bis auf die Leerzeichen zwischen Name und Text)
  assert.equal(segments.map((s) => s.text).join("").replace(/\s+/g, " "), text.replace(/\s+/g, " "));
});

test("private Symbol-Zeichen der API werden entfernt und trotzdem gefaerbt", () => {
  assert.equal(colorizeReward("+2 Health")[0].color, "#FF5555");
  assert.equal(colorizeReward("+0.5% Crit Chance")[0].color, "#5555FF");
  const ability = colorizeReward("Farmhand I   Grants +4  Farming Fortune, which increases your chance for multiple crops.");
  assert.equal(ability[2].color, "#FFAA00");
  assert.ok(!ability.some((s) => /[-]/.test(s.text)));
});

test("Verzauberung blau, Power Stone gruen, Zahlen in Beschreibungen gruen", () => {
  assert.equal(colorizeReward("Sunder Enchantment")[0].color, "#5555FF");
  assert.equal(colorizeReward("Rock Candy Power Stone")[0].color, "#55FF55");
  const w = colorizeReward("Warrior II   Deal 4➜8% more damage to mobs.");
  assert.ok(w.some((s) => s.color === "#55FF55" && s.text.includes("4➜8%")));
  assert.equal(w.map((s) => s.text).join("").replace(/\s+/g, " "), "Warrior II Deal 4➜8% more damage to mobs.");
  const c = colorizeReward("Charming I   Grants +2 ❣ Charm Chance.");
  assert.ok(!c.some((s) => s.text.includes("❣")));
});
