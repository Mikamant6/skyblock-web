// EINMAL ausfuehren (im Projektordner):  node scripts/fetchGuideSources.mjs
// Laedt Tutorial-Seiten der Hypixel SkyBlock Wiki und speichert sie als reinen Text in _guide_src/<Seite>.txt.
// Damit kann man den Guide pro Skill nach der Wiki aufbauen (nur Lesen, es wird nichts am Projekt veraendert).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const PAGES = ["Tutorial:Maxing_Items", "Tutorial:Reforging_Guide", "Pet_Items", "Tutorial:Pet_Guide", "Tutorial:Enchanting_Guide", "Enchantments/Tool", "Enchantments/Sword", "Enchantments/Armor", "Enchantments/Fishing_Rod", "Enchantments/Axe", "Reforging/Sword", "Reforging/Armor", "Reforging/Equipment", "Reforging/Tool", "Reforging/Axe", "Reforging/Fishing_Rod"];
const UA = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of guide pages)";
const outDir = path.join(process.cwd(), "_guide_src");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  // Bilder: Dateiname (enthaelt oft den Item-Namen)
  s = s.replace(/<img[^>]*?alt="([^"]*)"[^>]*>/gi, (_, alt) => (alt ? ` [${alt.replace(/\.(png|gif|webp)$/i, "")}] ` : " "));
  s = s.replace(/<\/(tr|p|div|h[1-6]|ul|ol|table|section)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "\n- ").replace(/<(td|th)[^>]*>/gi, " | ");
  s = s.replace(/<h([1-6])[^>]*>/gi, (_, n) => "\n" + "#".repeat(Number(n)) + " ");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  s = s.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

await mkdir(outDir, { recursive: true });
const log = [];
for (const page of PAGES) {
  try {
    const r = await fetch(`${WIKI}/w/${page}`, { headers: { "User-Agent": UA } });
    if (!r.ok) { log.push(`${page}: HTTP ${r.status}`); continue; }
    const text = toText(await r.text());
    await writeFile(path.join(outDir, `${page.replace(/[:/]/g, "_")}.txt`), text, "utf8");
    log.push(`${page}: OK ${text.length} Zeichen`);
  } catch (e) {
    log.push(`${page}: Fehler ${String(e)}`);
  }
  await sleep(300);
}
await writeFile(path.join(outDir, "_log.txt"), log.join("\n"), "utf8");
console.log(log.join("\n"));
