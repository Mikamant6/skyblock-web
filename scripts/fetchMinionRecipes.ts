// EINMAL ausfuehren (im Projektordner):  npx.cmd tsx scripts/fetchMinionRecipes.ts
// Laedt fuer alle Minions (jede Stufe) das Herstellungsrezept aus dem NotEnoughUpdates-REPO (Community-Daten auf GitHub).
// Die Liste der Minions und die Item-Namen kommen von Hypixel. Ergebnis: data/minionRecipes.json.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { parseItemRecipe, stripColorCodes } from "../lib/recipeParser";

const ITEMS_URL = "https://api.hypixel.net/v2/resources/skyblock/items";
const REPO_RAW = "https://raw.githubusercontent.com/NotEnoughUpdates/NotEnoughUpdates-REPO/master/items";
const USER_AGENT = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of minion recipes)";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchItem(id: string): Promise<unknown | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${REPO_RAW}/${encodeURIComponent(id)}.json`, { headers: { "User-Agent": USER_AGENT } });
      if (response.status === 404) return null;
      if (response.ok) return await response.json();
    } catch {
      // nochmal versuchen
    }
    await sleep(500 * attempt);
  }
  return null;
}

// Aufgaben auf 4 gleichzeitige Downloads verteilen
async function runAll<T>(items: T[], work: (item: T) => Promise<void>) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      await work(items[next++]);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
}

async function main() {
  const response = await fetch(ITEMS_URL);
  if (!response.ok) throw new Error(`Hypixel antwortete mit ${response.status}`);
  const json = (await response.json()) as { items?: { id?: unknown; name?: unknown }[] };
  const nameById = new Map<string, string>();
  const generators: { id: string; key: string; tier: number; name: string }[] = [];
  for (const item of json.items ?? []) {
    if (typeof item.id !== "string" || typeof item.name !== "string") continue;
    nameById.set(item.id, item.name);
    const match = /^(.+)_GENERATOR_(\d+)$/.exec(item.id);
    if (match !== null && /^[A-Za-z' ]+ Minion [IVX]+$/.test(item.name)) {
      generators.push({ id: item.id, key: match[1], tier: Number(match[2]), name: item.name });
    }
  }
  console.log(`Minion-Stufen laut Hypixel: ${generators.length}`);

  const minions: Record<string, { name: string; tiers: Record<string, (string | null)[]> }> = {};
  const used = new Set<string>();
  let withRecipe = 0;
  await runAll(generators, async (generator) => {
    const item = await fetchItem(generator.id);
    const recipe = item === null ? null : parseItemRecipe(item);
    const entry = (minions[generator.key] ??= { name: generator.name.replace(/ Minion [IVX]+$/, ""), tiers: {} });
    if (recipe === null) return;
    withRecipe++;
    entry.tiers[String(generator.tier)] = recipe.grid.map((slot) => {
      if (slot === null) return null;
      used.add(slot.id);
      return `${slot.id}:${slot.count}`;
    });
  });
  // Typen ohne ein einziges Rezept weglassen
  for (const [key, entry] of Object.entries(minions)) if (Object.keys(entry.tiers).length === 0) delete minions[key];
  console.log(`Rezepte gefunden: ${withRecipe}`);

  // Namen der Zutaten: zuerst Hypixel, sonst der Anzeigename aus dem REPO
  const names: Record<string, string> = {};
  await runAll([...used], async (id) => {
    const known = nameById.get(id);
    if (known !== undefined) {
      names[id] = known;
      return;
    }
    const item = await fetchItem(id);
    const display = (item as { displayname?: unknown } | null)?.displayname;
    names[id] =
      typeof display === "string" && display !== ""
        ? stripColorCodes(display)
        : id.replace(/_ITEM$/, "").split("_").map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
  });

  const sortedNames = Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b)));
  const sortedMinions = Object.fromEntries(Object.entries(minions).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(
    path.join(process.cwd(), "data", "minionRecipes.json"),
    JSON.stringify({ fetchedAt: new Date().toISOString(), minions: sortedMinions, names: sortedNames }) + "\n",
    "utf8",
  );
  console.log(`Fertig. Minion-Typen: ${Object.keys(sortedMinions).length}, Zutaten: ${Object.keys(sortedNames).length}`);
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
