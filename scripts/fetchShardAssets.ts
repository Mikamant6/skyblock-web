// EINMAL ausfuehren (im Projektordner):  npx.cmd tsx scripts/fetchShardAssets.ts
//
// Laedt von der Hypixel SkyBlock Wiki (Seite "Attributes/List"):
//   - zu jedem der 325 Shards den Ingame-Tooltip (Text mit Farbcodes)
//   - das Bild jedes Shards (300x300 PNG) nach public/shards/<attributeId>.png
// und schreibt die Texte nach data/shardInfo.json.
// Bereits geladene Bilder werden uebersprungen: das Skript darf man gefahrlos
// mehrmals starten. Es wartet zwischen den Bildern kurz, um die Wiki-Server zu schonen.
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseWikiShardList } from "../lib/shardWikiParser";

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const LIST_URL = `${WIKI}/w/Attributes/List`;
const USER_AGENT =
  "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of shard icons and tooltips)";
const PAUSE_MS = 250;

const root = process.cwd();
const imageDir = path.join(root, "public", "shards");

type MapRow = { shardName: string; attributeName: string; attributeId: string; rarity: string };

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
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
  const attributeMap = JSON.parse(
    await readFile(path.join(root, "data", "attributeMap.json"), "utf8"),
  ) as MapRow[];
  const byName = new Map(attributeMap.map((row) => [normalize(row.shardName), row]));

  console.log("Lade die Shard-Liste von der Wiki ...");
  const html = await (await fetchWithRetry(LIST_URL)).text();
  const wikiShards = parseWikiShardList(html);
  console.log(`Gefunden: ${wikiShards.length} Shards auf der Wiki-Seite.`);
  if (wikiShards.length < 300) {
    throw new Error("Zu wenige Shards gefunden: hat sich die Wiki-Seite geaendert? Abbruch.");
  }

  await mkdir(imageDir, { recursive: true });

  const shards: { attributeId: string; title: string; tooltip: string; image: string }[] = [];
  const unmatched: string[] = [];
  const failed: string[] = [];
  let downloaded = 0;
  let skipped = 0;

  for (const wiki of wikiShards) {
    const row = byName.get(normalize(wiki.name));
    if (row === undefined) {
      unmatched.push(wiki.name);
      continue;
    }

    const file = path.join(imageDir, `${row.attributeId}.png`);
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
        continue; // ohne Bild kein Eintrag; beim naechsten Lauf wird es erneut versucht
      }
    }

    shards.push({
      attributeId: row.attributeId,
      title: wiki.title,
      tooltip: wiki.tooltip,
      image: `/shards/${row.attributeId}.png`,
    });
  }

  await writeFile(
    path.join(root, "data", "shardInfo.json"),
    JSON.stringify({ source: LIST_URL, fetchedAt: new Date().toISOString(), shards }, null, 2) + "\n",
    "utf8",
  );

  console.log("");
  console.log(`Fertig. Eintraege in data/shardInfo.json: ${shards.length}`);
  console.log(`Bilder neu geladen: ${downloaded}, schon vorhanden: ${skipped}, fehlgeschlagen: ${failed.length}`);
  // Nur die ersten Eintraege zeigen, damit die Ausgabe lesbar bleibt
  const preview = (list: string[]) =>
    list.slice(0, 10).join("; ") + (list.length > 10 ? `; ... (+${list.length - 10} weitere)` : "");
  if (unmatched.length > 0) console.log("Ohne Entsprechung in attributeMap.json:", preview(unmatched));
  if (failed.length > 0) console.log("Fehlgeschlagen (Skript einfach nochmal starten):", preview(failed));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
