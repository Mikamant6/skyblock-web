// Start: npx.cmd tsx lib/minecraftText.test.ts
import assert from "node:assert/strict";
import { parseColoredLine, parseTooltip, stripColorCodes } from "./minecraftText";

// Farbe wechselt mitten in der Zeile
assert.deepEqual(parseColoredLine("&7Grants &c+2  Health&7."), [
  { text: "Grants ", color: "#AAAAAA", bold: false },
  { text: "+2  Health", color: "#FF5555", bold: false },
  { text: ".", color: "#AAAAAA", bold: false },
]);

// Fett, und eine neue Farbe setzt Fett zurueck
assert.deepEqual(parseColoredLine("&f&lCOMMON &8(ID C1)"), [
  { text: "COMMON ", color: "#FFFFFF", bold: true },
  { text: "(ID C1)", color: "#555555", bold: false },
]);

// Zeilen: "/" = neue Zeile, "//" = Leerzeile dazwischen
const lines = parseTooltip("&6Name I/&7Text//&7Ende");
assert.equal(lines.length, 4);
assert.deepEqual(lines[2], []); // Leerzeile
assert.equal(lines[3][0].text, "Ende");

// Unbekannte Codes bleiben als Text, ein einzelnes & am Ende ebenfalls
assert.equal(parseColoredLine("A & B")[0].text, "A & B");
assert.equal(parseColoredLine("Ende&")[0].text, "Ende&");
assert.equal(stripColorCodes("&6Nature &lElemental"), "Nature Elemental");

console.log("minecraftText: ok");
