// EINMAL ausfuehren (im Projektordner):  npx.cmd tsx scripts/fetchPetAssets.ts
//
// Laedt von der Hypixel SkyBlock Wiki (Seite "Pets"):
//   - zu jedem Pet den Ingame-Tooltip (Faehigkeiten, Werte, mit Farbcodes)
//   - das Bild jedes Pets nach public/pets/<key>.png  (key = Name klein, ohne Leerzeichen, z. B. enderdragon.png)
// und schreibt die Texte nach data/petInfo.json.
// Bereits geladene Bilder werden uebersprungen: das Skript darf man gefahrlos mehrmals starten.
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseWikiPetList } from "../lib/petWikiParser";

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const LIST_URL = `${WIKI}/w/Pets`;
const USER_AGENT =
  "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of pet icons and tooltips)";
const PAUSE_MS = 250;

const root = process.cwd();
const imageDir = path.join(root, "public", "pets");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function fetchWithRetry(url: string, tries = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(1000 * attempt);
  }
  throw lastError;
}

async function main() {
  console.log("Lade die Pet-Liste von der Wiki ...");
  const html = await (await fetchWithRetry(LIST_URL)).text();
  const wikiPets = parseWikiPetList(html);
  console.log(`Gefunden: ${wikiPets.length} Pets auf der Wiki-Seite.`);
  if (wikiPets.length < 60) {
    throw new Error("Zu wenige Pets gefunden: hat sich die Wiki-Seite geaendert? Abbruch.");
  }

  await mkdir(imageDir, { recursive: true });

  const pets: { key: string; name: string; title: string; tooltip: string; image: string }[] = [];
  const failed: string[] = [];
  let downloaded = 0;
  let skipped = 0;

  for (const wiki of wikiPets) {
    const file = path.join(imageDir, `${wiki.key}.png`);
    if (await exists(file)) {
      skipped++;
    } else {
      try {
        const response = await fetchWithRetry(`${WIKI}${wiki.imagePath}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        // PNG-Dateien beginnen immer mit diesen Bytes: so erkennen wir Fehlerseiten
        if (bytes.length < 100 || bytes.readUInt32BE(0) !== 0x89504e47) {
          throw new Error("keine PNG-Datei");
        }
        await writeFile(file, bytes);
        downloaded++;
        await sleep(PAUSE_MS);
      } catch (error) {
        failed.push(`${wiki.name} (${String(error)})`);
        continue; // beim naechsten Lauf wird es erneut versucht
      }
    }
    pets.push({
      key: wiki.key,
      name: wiki.name,
      title: wiki.title,
      tooltip: wiki.tooltip,
      image: `/pets/${wiki.key}.png`,
    });
  }

  await writeFile(
    path.join(root, "data", "petInfo.json"),
    JSON.stringify({ source: LIST_URL, fetchedAt: new Date().toISOString(), pets }, null, 2) + "\n",
    "utf8",
  );

  console.log("");
  console.log(`Fertig. Eintraege in data/petInfo.json: ${pets.length}`);
  console.log(`Bilder neu geladen: ${downloaded}, schon vorhanden: ${skipped}, fehlgeschlagen: ${failed.length}`);
  if (failed.length > 0) console.log("Fehlgeschlagen (Skript einfach nochmal starten):", failed.slice(0, 10).join("; "));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
