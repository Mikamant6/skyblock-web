// Aus den Daten eines Ausruestungsteils den Tooltip bauen, so wie er im Spiel aussieht:
// Name in der Farbe der Seltenheit, Werte, Skill-Anforderung, unten Seltenheit und Art.
// Es werden nur Angaben verwendet, die in den Daten stehen (nichts erfunden). Reine Logik, ohne Netzwerk.
import type { GearPiece } from "./levelGuides";
import { parseColoredLine, parseTooltip, type TextLine } from "./minecraftText";

const RARITY_COLOR: Record<string, string> = {
  COMMON: "f",
  UNCOMMON: "a",
  RARE: "9",
  EPIC: "5",
  LEGENDARY: "6",
  MYTHIC: "d",
  DIVINE: "b",
  SPECIAL: "c",
  VERY_SPECIAL: "c",
};

// Wie ein Wert im Spiel heisst und aussieht: Reihenfolge der Zeilen, Farbe des Werts und Symbol
const STATS: { key: string; label: string; color: string; symbol: string }[] = [
  { key: "DAMAGE", label: "Damage", color: "c", symbol: "❁" },
  { key: "STRENGTH", label: "Strength", color: "c", symbol: "❁" },
  { key: "CRITICAL_CHANCE", label: "Crit Chance", color: "9", symbol: "☣" },
  { key: "CRITICAL_DAMAGE", label: "Crit Damage", color: "9", symbol: "☠" },
  { key: "HEALTH", label: "Health", color: "a", symbol: "❤" },
  { key: "DEFENSE", label: "Defense", color: "a", symbol: "❈" },
  { key: "SWEEP", label: "Sweep", color: "a", symbol: "∮" },
  { key: "WALK_SPEED", label: "Speed", color: "a", symbol: "✦" },
  { key: "INTELLIGENCE", label: "Intelligence", color: "a", symbol: "✎" },
  { key: "FARMING_FORTUNE", label: "Farming Fortune", color: "6", symbol: "☘" },
  { key: "BONUS_PEST_CHANCE", label: "Bonus Pest Chance", color: "2", symbol: "ൠ" },
];

function escapeCodes(text: string): string {
  return text.replace(/[&§]/g, "");
}

function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildPieceTooltip(piece: GearPiece): { title: TextLine; body: TextLine[] } {
  // Fertiger Tooltip (z. B. Pets aus der Wiki): unveraendert uebernehmen
  if (piece.tooltip !== undefined) {
    return { title: parseColoredLine(piece.tooltip.title), body: parseTooltip(piece.tooltip.text) };
  }
  const rarity = (piece.rarity ?? "COMMON").toUpperCase();
  const rarityColor = RARITY_COLOR[rarity] ?? "f";
  const title = parseColoredLine(`&${rarityColor}${escapeCodes(piece.name)}`);
  const body: TextLine[] = [];

  const stats = piece.stats ?? {};
  const known = new Set(STATS.map((stat) => stat.key));
  for (const stat of STATS) {
    const value = stats[stat.key];
    if (value === undefined) continue;
    body.push(parseColoredLine(`&7${stat.label}: &${stat.color}${value >= 0 ? "+" : ""}${value}${stat.symbol}`));
  }
  // Werte, die wir nicht kennen, trotzdem anzeigen (ohne Symbol)
  for (const [key, value] of Object.entries(stats)) {
    if (known.has(key)) continue;
    body.push(parseColoredLine(`&7${titleCase(key)}: &a${value >= 0 ? "+" : ""}${value}`));
  }

  if (piece.requirement !== undefined) {
    if (body.length > 0) body.push([]);
    body.push(parseColoredLine(`&4❣ &cRequires &a${escapeCodes(piece.requirement.skill)} Skill ${piece.requirement.level}&c.`));
  }

  if (body.length > 0) body.push([]);
  const kind = piece.category === undefined ? "" : ` ${piece.category}`;
  body.push(parseColoredLine(`&${rarityColor}&l${rarity.replace("_", " ")}${kind}`));
  return { title, body };
}
