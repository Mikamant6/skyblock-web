// Die Wiki-Tooltips benutzen Symbole aus einer Spezialschrift (Unicode-Bereich E000-F8FF).
// Normale Schriften kennen sie nicht und zeigen Kaestchen. Hier werden die bekannten durch
// die Symbole ersetzt, die auch das Spiel zeigt; alle anderen aus diesem Bereich entfallen
// (lieber kein Symbol als ein Kaestchen). Reine Logik, ohne Netzwerk.

const GLYPHS: Record<string, string> = {
  "\ue001": "\u2694", // Attack Speed
  "\ue003": "\u270e", // Intelligence
  "\ue007": "\u2620", // Crit Damage
  "\ue008": "\u2748", // Defense
  "\ue009": "\u2693", // Double Hook Chance
  "\ue00b": "\u2afd", // Ferocity
  "\ue00c": "\u2602", // Fishing Speed
  "\ue00d": "\u2741", // Strength
  "\ue010": "\u2764", // Health
  "\ue013": "\u2663", // Pet Luck
  "\ue015": "\u2e15", // Mining Speed
  "\ue016": "\u259a", // Mining Spread
  "\ue01a": "\u272f", // Magic Find
  "\ue01c": "\u2727", // Pristine
  "\ue021": "\u03b1", // Sea Creature Chance
  "\ue022": "\u2726", // Speed
  "\ue023": "\u222e", // Sweep
  "\ue027": "\u2742", // True Defense
  "\ue028": "\u2668", // Vitality
  "\ue02a": "\u2654", // Trophy Fish Chance
  "\ue051": "\u2618", // Farming Fortune
  "\ue053": "\u2618", // Mining Fortune (Ore/Block Fortune)
  "\ue054": "\u2618", // Foraging Fortune (Fig/Mangrove/Helix)
  "\ue05b": "\u2618", // Hunter Fortune
};

const PRIVATE_USE = /[\ue000-\uf8ff]/g;

// Bekannte Symbole ersetzen, unbekannte entfernen
export function replaceGlyphs(text: string): string {
  return text.replace(PRIVATE_USE, (char) => GLYPHS[char] ?? "");
}
