// Minion-Bilder: public/minions/<typ>-<stufe>.png (geladen mit scripts/fetchMinionIcons.ts).
import iconData from "../data/minionIcons.json";

const FILES = new Set((iconData as { files: string[] }).files);

// Bild fuer einen Minion-Typ (z. B. "COBBLESTONE") in der hoechsten hergestellten Stufe.
// Gibt es diese Stufe nicht, wird die naechstniedrigere genommen; ohne jedes Bild: null.
export function minionIconPath(key: string, tier: number): string | null {
  const base = key.toLowerCase();
  for (let current = Math.min(Math.max(Math.floor(tier), 1), 20); current >= 1; current--) {
    if (FILES.has(`${base}-${current}`)) return `/minions/${base}-${current}.png`;
  }
  return null;
}
