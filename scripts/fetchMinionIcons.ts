// EINMAL ausfuehren (im Projektordner):  npx.cmd tsx scripts/fetchMinionIcons.ts
// Laedt die Bilder aller Minions (jede Stufe) von der Hypixel SkyBlock Wiki nach public/minions/<typ>-<stufe>.png
// und schreibt die Liste der geladenen Bilder nach data/minionIcons.json.
// Die Minion-Liste kommt von Hypixel (Items "<TYP>_GENERATOR_<STUFE>", Name z. B. "Gold Minion II").
// Schon geladene Bilder werden uebersprungen: das Skript darf man gefahrlos mehrmals starten.
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ITEMS_URL = "https://api.hypixel.net/v2/resources/skyblock/items";
const WIKI = "https://hypixelskyblock.minecraft.wiki";
const USER_AGENT = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of minion icons)";
const dir = path.join(process.cwd(), "public", "minions");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Job = { slug: string; wikiName: string };

async function exists(file: string): Promise<boolean> {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function download(url: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.status === 404) return null;
      if (response.status === 429) {
        await sleep(3000 * attempt); // Wiki bremst: laenger warten
        continue;
      }
      if (!response.ok) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      // PNG-Dateien beginnen immer mit diesen Bytes: so erkennen wir Fehlerseiten
      return bytes.length >= 50 && bytes.readUInt32BE(0) === 0x89504e47 ? bytes : null;
    } catch {
      await sleep(500 * attempt);
    }
  }
  return null;
}

async function main() {
  const response = await fetch(ITEMS_URL);
  if (!response.ok) throw new Error(`Hypixel antwortete mit ${response.status}`);
  const json = (await response.json()) as { items?: { id?: unknown; name?: unknown }[] };

  const jobs: Job[] = [];
  for (const item of json.items ?? []) {
    if (typeof item.id !== "string" || typeof item.name !== "string") continue;
    const match = /^(.+)_GENERATOR_(\d+)$/.exec(item.id);
    // Name muss wie "Gold Minion II" aussehen (ein Eintrag bei Hypixel ist fehlerhaft geschrieben)
    if (match === null || !/^[A-Za-z' ]+ Minion [IVX]+$/.test(item.name)) continue;
    jobs.push({ slug: `${match[1].toLowerCase()}-${match[2]}`, wikiName: item.name });
  }
  console.log(`Minion-Stufen laut Hypixel: ${jobs.length}`);

  await mkdir(dir, { recursive: true });
  const ok: string[] = [];
  const failed: string[] = [];
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      const target = path.join(dir, `${job.slug}.png`);
      if (await exists(target)) {
        ok.push(job.slug);
        continue;
      }
      const bytes = await download(`${WIKI}/images/${encodeURIComponent(job.wikiName.replace(/ /g, "_"))}.png`);
      if (bytes === null) {
        failed.push(job.wikiName);
      } else {
        await writeFile(target, bytes);
        ok.push(job.slug);
      }
      await sleep(150);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);

  ok.sort();
  await writeFile(path.join(process.cwd(), "data", "minionIcons.json"), JSON.stringify({ files: ok }, null, 2) + "\n", "utf8");
  console.log(`Fertig. Bilder: ${ok.length}, ohne Bild: ${failed.length}`);
  if (failed.length > 0) console.log("Ohne Bild:", failed.sort().join("; "));
}

main().catch((error) => {
  console.error("Abgebrochen:", error);
  process.exit(1);
});
