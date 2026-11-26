// Einmalig: laedt die Wiki-Seite "Enchantments/List" als Text nach _guide_src/ (nur Lesen)
import { mkdir, writeFile } from "node:fs/promises";
const WIKI = "https://hypixelskyblock.minecraft.wiki";
const UA = "flawlesssb-asset-fetch/1.0 (hobby project, one-time download of enchantment list)";
function toText(html) {
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<\/(tr|p|div|h[1-6]|ul|ol|table|section)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "\n- ").replace(/<(td|th)[^>]*>/gi, " | ");
  s = s.replace(/<h([1-6])[^>]*>/gi, (_, n) => "\n" + "#".repeat(Number(n)) + " ");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  s = s.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
await mkdir("_guide_src", { recursive: true });
const log = [];
for (const page of ["Enchantments/List", "Enchantments"]) {
  try {
    const r = await fetch(`${WIKI}/w/${page}`, { headers: { "User-Agent": UA } });
    if (!r.ok) { log.push(`${page}: HTTP ${r.status}`); continue; }
    const text = toText(await r.text());
    await writeFile(`_guide_src/${page.replace(/[:/]/g, "_")}.txt`, text, "utf8");
    log.push(`${page}: OK ${text.length} Zeichen`);
  } catch (e) { log.push(`${page}: Fehler ${String(e)}`); }
}
await writeFile("_fetchench.log", log.join("\n") + "\n");
