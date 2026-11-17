// EINMAL ausfuehren (im Projektordner):  npx.cmd tsx scripts/fetchCollectionIcons.ts
// Laedt die Bilder der Collection-Gegenstaende von der Hypixel SkyBlock Wiki nach public/collections/<slug>.png.
// Schon vorhandene Bilder werden uebersprungen: das Skript darf man gefahrlos mehrmals starten.
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { COLLECTION_ICON_FILES, collectionSlug } from "../lib/collectionIcons";

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const USER_AGENT = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of collection icons)";
const dir = path.join(process.cwd(), "public", "collections");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(dir, { recursive: true });
  let downloaded = 0;
  let skipped = 0;
  const failed: string[] = [];
  for (const [name, wikiFile] of Object.entries(COLLECTION_ICON_FILES)) {
    const target = path.join(dir, `${collectionSlug(name)}.png`);
    if (await exists(target)) {
      skipped++;
      continue;
    }
    try {
      const response = await fetch(`${WIKI}/images/${wikiFile}`, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      // PNG-Dateien beginnen immer mit diesen Bytes: so erkennen wir Fehlerseiten
      if (bytes.length < 50 || bytes.readUInt32BE(0) !== 0x89504e47) throw new Error("keine PNG-Datei");
      await writeFile(target, bytes);
      downloaded++;
      await sleep(250);
    } catch (error) {
      failed.push(`${name} (${String(error)})`);
    }
  }
  console.log(`Fertig. Neu geladen: ${downloaded}, schon vorhanden: ${skipped}, fehlgeschlagen: ${failed.length}`);
  if (failed.length > 0) console.log("Fehlgeschlagen (Skript einfach nochmal starten):", failed.join("; "));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
