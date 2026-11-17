// EINMAL ausfuehren (im Projektordner):  npx.cmd tsx scripts/fetchRecipes.ts
//
// Sucht in den Collection-Tabellen von Hypixel alle Freischaltungen der Form "<Item> Recipe"
// und laedt die Crafting-Rezepte dazu aus dem NotEnoughUpdates-REPO (Community-Daten auf GitHub).
// Ergebnis: data/recipes.json. Items ohne Werkbank-Rezept (z. B. "Minion Recipes") werden uebersprungen.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { guessItemId, parseItemRecipe, stripColorCodes } from "../lib/recipeParser";

const ITEMS_URL = "https://api.hypixel.net/v2/resources/skyblock/items";
const COLLECTIONS_URL = "https://api.hypixel.net/v2/resources/skyblock/collections";
const REPO_RAW = "https://raw.githubusercontent.com/NotEnoughUpdates/NotEnoughUpdates-REPO/master/items";
const USER_AGENT = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of recipes)";
const PAUSE_MS = 120;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Eine Item-Datei aus dem REPO holen; null, wenn es sie nicht gibt
async function fetchItem(id: string): Promise<unknown | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${REPO_RAW}/${id}.json`, { headers: { "User-Agent": USER_AGENT } });
      if (response.status === 404) return null;
      if (response.ok) return await response.json();
    } catch {
      // nochmal versuchen
    }
    await sleep(500 * attempt);
  }
  return null;
}

// Alle "<Item> Recipe"-Freischaltungen (ohne Minion-Sammelrezepte, die heissen "... Recipes")
async function collectRecipeNames(): Promise<string[]> {
  const response = await fetch(COLLECTIONS_URL);
  if (!response.ok) throw new Error(`Hypixel antwortete mit ${response.status}`);
  const json = (await response.json()) as { collections?: Record<string, { items?: Record<string, { tiers?: { unlocks?: unknown }[] }> }> };
  const names = new Set<string>();
  for (const group of Object.values(json.collections ?? {})) {
    for (const item of Object.values(group.items ?? {})) {
      for (const tier of item.tiers ?? []) {
        if (!Array.isArray(tier.unlocks)) continue;
        for (const text of tier.unlocks) {
          const match = typeof text === "string" ? /^(.+) Recipe$/.exec(text.trim()) : null;
          if (match !== null) names.add(match[1]);
        }
      }
    }
  }
  return [...names].sort();
}

// Name -> interne IDs laut Hypixel (z. B. "Enchanted Cocoa Beans" -> ENCHANTED_COCOA). Ein Name kann mehrere IDs haben.
async function fetchIdsByName(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const response = await fetch(ITEMS_URL);
  if (!response.ok) return map;
  const json = (await response.json()) as { items?: { id?: unknown; name?: unknown }[] };
  for (const item of json.items ?? []) {
    if (typeof item.id !== "string" || typeof item.name !== "string") continue;
    map.set(item.name, [...(map.get(item.name) ?? []), item.id]);
  }
  return map;
}

async function main() {
  const idsByName = await fetchIdsByName();
  console.log(`Items laut Hypixel: ${idsByName.size}`);
  const names = await collectRecipeNames();
  console.log(`Freischaltungen mit "Recipe": ${names.length}`);

  // Schon gespeicherte Rezepte bleiben erhalten: nur fehlende werden neu gesucht
  let existing: Record<string, unknown> = {};
  try {
    existing = (JSON.parse(await readFile(path.join(process.cwd(), "data", "recipes.json"), "utf8")) as { recipes?: Record<string, unknown> }).recipes ?? {};
  } catch {
    // keine Datei: alles neu
  }

  const parsed: Record<string, { id: string; text: string | null; recipe: NonNullable<ReturnType<typeof parseItemRecipe>> }> = {};
  const missing: string[] = [];
  for (const name of names) {
    if (name in existing) continue;
    // Kandidaten: IDs von Hypixel zuerst, zuletzt die geratene ID aus dem Namen
    const candidates = [...new Set([...(idsByName.get(name) ?? []), guessItemId(name)])];
    let found = false;
    for (const id of candidates) {
      const item = await fetchItem(id);
      await sleep(PAUSE_MS);
      const recipe = item === null ? null : parseItemRecipe(item);
      if (item === null || recipe === null) continue;
      const craftText = (item as { crafttext?: unknown }).crafttext;
      parsed[name] = { id, text: typeof craftText === "string" && craftText !== "" ? craftText : null, recipe };
      found = true;
      break;
    }
    if (!found) missing.push(name);
  }

  // Anzeigenamen der Zutaten holen (einmal pro ID)
  const ingredientNames = new Map<string, string>();
  const ids = new Set<string>();
  for (const entry of Object.values(parsed)) for (const slot of entry.recipe.grid) if (slot !== null) ids.add(slot.id);
  for (const id of ids) {
    const item = await fetchItem(id);
    await sleep(PAUSE_MS);
    const display = (item as { displayname?: unknown } | null)?.displayname;
    const fallback = id.replace(/_ITEM$/, "").split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
    ingredientNames.set(id, typeof display === "string" && display !== "" ? stripColorCodes(display) : fallback);
  }

  const recipes: Record<string, unknown> = { ...existing };
  for (const [name, entry] of Object.entries(parsed)) {
    recipes[name] = {
      id: entry.id,
      craftText: entry.text,
      outputCount: entry.recipe.outputCount,
      grid: entry.recipe.grid.map((slot) => (slot === null ? null : { name: ingredientNames.get(slot.id) ?? slot.id, count: slot.count })),
    };
  }

  await writeFile(
    path.join(process.cwd(), "data", "recipes.json"),
    JSON.stringify({ source: REPO_RAW, fetchedAt: new Date().toISOString(), recipes }, null, 2) + "\n",
    "utf8",
  );
  console.log(`Fertig. Rezepte gespeichert: ${Object.keys(recipes).length} (neu: ${Object.keys(parsed).length}), ohne Werkbank-Rezept/Datei: ${missing.length}`);
  if (missing.length > 0) console.log("Ohne Rezept:", missing.join("; "));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
