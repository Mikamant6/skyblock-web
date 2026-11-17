// EINMAL ausfuehren (nach fetchRecipes):  npx.cmd tsx scripts/fetchRecipeIcons.ts
// Laedt die Bilder aller Items, die in data/recipes.json vorkommen (Ergebnisse und Zutaten),
// von der Hypixel SkyBlock Wiki nach public/items/<slug>.png und schreibt die Liste der geladenen
// Namen nach data/recipeIcons.json. Schon geladene Bilder werden uebersprungen (mehrfach startbar).
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectionSlug } from "../lib/collectionIcons";
import aliasData from "../data/recipeIconAliases.json";
import { allRecipeItemNames } from "../lib/recipes";

// Namen, die auf der Wiki anders heissen: Item-Name -> Dateiname
const ALIASES = (aliasData as { files: Record<string, string> }).files;

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const USER_AGENT = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of item icons)";
const dir = path.join(process.cwd(), "public", "items");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

// Bild-Datei direkt ueber den Namen: "Enchanted Potato" -> /images/Enchanted_Potato.png
async function tryDownload(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    // PNG-Dateien beginnen immer mit diesen Bytes: so erkennen wir Fehlerseiten
    return bytes.length >= 50 && bytes.readUInt32BE(0) === 0x89504e47 ? bytes : null;
  } catch {
    return null;
  }
}

// Zweiter Versuch: auf der Seite des Items das Bild suchen, dessen Dateiname den Item-Namen enthaelt
async function findViaPage(name: string): Promise<Buffer | null> {
  try {
    const response = await fetch(`${WIKI}/w/${encodeURIComponent(name.replace(/ /g, "_"))}`, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const html = await response.text();
    const wanted = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const match of html.matchAll(/src="\/images\/(?:thumb\/)?([^"?\/]+?\.png)/g)) {
      const file = decodeURIComponent(match[1]);
      if (file.toLowerCase().replace(/[^a-z0-9]/g, "").includes(wanted)) {
        return await tryDownload(`${WIKI}/images/${match[1]}`);
      }
    }
  } catch {
    // ignorieren: Item bekommt dann kein Bild
  }
  return null;
}

async function loadIcon(name: string): Promise<boolean> {
  const target = path.join(dir, `${collectionSlug(name)}.png`);
  if (await exists(target)) return true;
  const alias = ALIASES[name];
  const bytes =
    (await tryDownload(`${WIKI}/images/${encodeURIComponent(name.replace(/ /g, "_"))}.png`)) ??
    (alias === undefined ? null : await tryDownload(`${WIKI}/images/${encodeURIComponent(alias)}`)) ??
    (await findViaPage(name));
  if (bytes === null) return false;
  await writeFile(target, bytes);
  return true;
}

async function main() {
  await mkdir(dir, { recursive: true });
  const names = allRecipeItemNames();
  console.log(`Items in Rezepten: ${names.length}`);
  const ok: string[] = [];
  const failed: string[] = [];
  let next = 0;
  // 4 Downloads gleichzeitig, mit kleiner Pause: schnell, aber schonend fuer die Wiki
  async function worker() {
    while (next < names.length) {
      const name = names[next++];
      (await loadIcon(name)) ? ok.push(name) : failed.push(name);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);

  ok.sort();
  await writeFile(path.join(process.cwd(), "data", "recipeIcons.json"), JSON.stringify({ names: ok }, null, 2) + "\n", "utf8");
  console.log(`Fertig. Bilder: ${ok.length}, ohne Bild: ${failed.length}`);
  if (failed.length > 0) console.log("Ohne Bild:", failed.sort().join("; "));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
