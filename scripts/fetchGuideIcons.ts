// EINMAL ausfuehren:  npx.cmd tsx scripts/fetchGuideIcons.ts   (oder ueber _fetchguide.bat)
// Laedt die fehlenden Item-Bilder der Level-Guides (data/levelGuides.json) von der Hypixel SkyBlock Wiki nach
// public/items/<slug>.png und traegt "icon" im JSON ein, wenn das Bild da ist. Schon vorhandene Bilder werden uebersprungen.
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectionSlug } from "../lib/collectionIcons";
import aliasData from "../data/recipeIconAliases.json";

const ALIASES = (aliasData as { files: Record<string, string> }).files;
const WIKI = "https://hypixelskyblock.minecraft.wiki";
const USER_AGENT = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of item icons)";
const dir = path.join(process.cwd(), "public", "items");
const jsonFile = path.join(process.cwd(), "data", "levelGuides.json");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function tryDownload(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
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
      if (file.toLowerCase().replace(/[^a-z0-9]/g, "").includes(wanted)) return await tryDownload(`${WIKI}/images/${match[1]}`);
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

type Entry = { name: string; id?: string; icon?: string; pieces?: Entry[] };

async function main() {
  await mkdir(dir, { recursive: true });
  const data = JSON.parse(await readFile(jsonFile, "utf8")) as Record<string, { ranges: { gear: Entry[] }[] }>;
  // Alle Teile ohne Bild (nur normale Items: keine Pets "PET:" und keine Shards "SHARD:")
  const todo: Entry[] = [];
  for (const guide of Object.values(data)) {
    for (const range of guide.ranges) {
      for (const item of range.gear) {
        for (const entry of item.pieces ?? [item]) {
          if (entry.id === undefined || entry.id.startsWith("PET:") || entry.id.startsWith("SHARD:")) continue;
          if (entry.icon === undefined) todo.push(entry);
        }
      }
    }
  }
  const names = [...new Set(todo.map((entry) => entry.name))];
  console.log(`Teile ohne Bild: ${names.length}`);
  const ok = new Set<string>();
  const failed: string[] = [];
  let next = 0;
  async function worker() {
    while (next < names.length) {
      const name = names[next++];
      if (await loadIcon(name)) ok.add(name);
      else failed.push(name);
      await sleep(100);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  // icon in ALLEN Eintraegen setzen, deren Bild jetzt da ist
  for (const guide of Object.values(data)) {
    for (const range of guide.ranges) {
      for (const item of range.gear) {
        for (const entry of item.pieces ?? [item]) {
          if (entry.id === undefined || entry.id.startsWith("PET:") || entry.id.startsWith("SHARD:")) continue;
          if (entry.icon === undefined && ok.has(entry.name)) entry.icon = `/items/${collectionSlug(entry.name)}.png`;
        }
      }
    }
  }
  await writeFile(jsonFile, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Fertig. Bilder geladen: ${ok.size}, ohne Bild: ${failed.length}`);
  if (failed.length > 0) console.log("Ohne Bild:", failed.sort().join("; "));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
