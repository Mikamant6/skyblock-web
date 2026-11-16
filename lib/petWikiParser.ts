// Liest die Wiki-Seite "Pets" und holt pro Pet Tooltip (mit Farbcodes) und Bildpfad.
// Gleicher Aufbau wie bei den Shards (siehe shardWikiParser.ts): jedes Pet steht als
// <span class="invslot-item" data-minetip-title="..." data-minetip-text="..."> mit einem <img> danach.
// Es zaehlen nur Eintraege, deren Tooltip "add this pet to your pet menu" enthaelt
// (so werden Pet-Items und andere Gegenstaende der Seite ausgelassen).
import { decodeHtmlEntities, originalImagePath } from "./shardWikiParser";

export type WikiPet = {
  key: string; // Name ohne Sonderzeichen, klein: "Ender Dragon" -> "enderdragon"
  name: string; // z. B. "Ender Dragon"
  title: string; // Titelzeile mit Farbcodes
  tooltip: string; // ganzer Tooltip mit Farbcodes
  imagePath: string; // Pfad des Originalbildes, z. B. "/images/Ender_Dragon.png"
};

// Gemeinsamer Schluessel: Hypixel nennt Pets "ENDER_DRAGON", die Wiki "Ender Dragon"
export function petKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return match === null ? null : decodeHtmlEntities(match[1]);
}

export function parseWikiPetList(html: string): WikiPet[] {
  const result: WikiPet[] = [];
  const seen = new Set<string>();
  const startTag = /<span class="invslot-item[^"]*"[^>]*>/g;
  const starts = [...html.matchAll(startTag)];

  starts.forEach((start, index) => {
    const tag = start[0];
    const title = attribute(tag, "data-minetip-title");
    const tooltip = attribute(tag, "data-minetip-text");
    if (title === null || tooltip === null) return;
    if (!tooltip.includes("add this pet to your pet menu")) return;

    const from = (start.index ?? 0) + tag.length;
    const to = starts[index + 1]?.index ?? html.length;
    const img = /<img [^>]*src="([^"]+)"/.exec(html.slice(from, to));
    const imagePath = img === null ? null : originalImagePath(decodeHtmlEntities(img[1]));
    if (imagePath === null) return;

    // Name = Titel ohne Farbcodes und ohne "[Lvl 1➡100] "
    const name = title
      .replace(/[&§][0-9a-fk-or]/gi, "")
      .replace(/^\[Lvl[^\]]*\]\s*/, "")
      .trim();
    const key = petKey(name);
    if (key === "" || seen.has(key)) return;
    seen.add(key);
    result.push({ key, name, title, tooltip, imagePath });
  });

  return result;
}
