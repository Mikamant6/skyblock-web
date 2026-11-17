// Upgrade-Rezepte aller Minions (jede Stufe) und die Liste aller Minion-Typen.
// Die Daten stehen in data/minionRecipes.json und werden mit scripts/fetchMinionRecipes.ts geladen
// (Liste von Hypixel, Rezepte aus dem NotEnoughUpdates-REPO).
import data from "../data/minionRecipes.json";

type MinionData = {
  minions: Record<string, { name: string; tiers: Record<string, (string | null)[]> }>;
  names: Record<string, string>; // Item-ID -> Anzeigename
};
const DATA = data as unknown as MinionData;

export type MinionType = { key: string; name: string; maxTier: number };
export type MinionRecipeSlot = { id: string; name: string; count: number } | null;

// Alle bekannten Minion-Typen (z. B. WHEAT) mit der hoechsten Stufe, fuer die wir ein Rezept haben
export function allMinionTypes(): MinionType[] {
  return Object.entries(DATA.minions).map(([key, info]) => ({
    key,
    name: info.name,
    maxTier: Math.max(0, ...Object.keys(info.tiers).map(Number)),
  }));
}

// Das Rezept, aus dem Stufe `tier` hergestellt wird (3x3, 9 Felder); null, wenn es keins gibt
export function minionRecipe(key: string, tier: number): MinionRecipeSlot[] | null {
  const raw = DATA.minions[key]?.tiers[String(tier)];
  if (raw === undefined) return null;
  return raw.map((cell) => {
    if (cell === null) return null;
    const [id, countText] = cell.split(":");
    const count = Number(countText);
    return { id, name: DATA.names[id] ?? id, count: Number.isFinite(count) && count > 0 ? count : 1 };
  });
}

// "WHEAT_GENERATOR_3" -> { key: "WHEAT", tier: 3 }; alles andere -> null
export function parseMinionItemId(id: string): { key: string; tier: number } | null {
  const match = /^(.+)_GENERATOR_(\d+)$/.exec(id);
  return match === null ? null : { key: match[1], tier: Number(match[2]) };
}

// Namen aller Zutaten, die keine Minions sind (fuer das Bilder-Skript)
export function minionIngredientNames(): string[] {
  return [...new Set(Object.entries(DATA.names).filter(([id]) => parseMinionItemId(id) === null).map(([, name]) => name))];
}
