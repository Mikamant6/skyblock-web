// Liest die Wiki-Seite "Attributes/List" und holt pro Shard den Tooltip
// (wie im Spiel, mit Farbcodes) und den Bildpfad. Reine Logik: bekommt den
// HTML-Text, gibt eine Liste zurueck.
//
// Jeder Shard steht dort so im HTML:
//   <span class="invslot-item invslot-item-image" data-minetip-style="common"
//         data-minetip-title="&amp;fGrove Shard" data-minetip-text="&amp;6Nature ...">
//     <span typeof="mw:File"><a href="/w/Grove_Shard"><img alt="Grove Shard"
//       src="/images/thumb/Grove_Shard.png/32px-Grove_Shard.png?d40eb" ...>

export type WikiShard = {
  name: string; // z. B. "Grove" (ohne " Shard")
  title: string; // Titelzeile mit Farbcodes, z. B. "&fGrove Shard"
  tooltip: string; // ganzer Tooltip mit Farbcodes
  style: string; // z. B. "common"
  imagePath: string; // Pfad des Originalbildes, z. B. "/images/Grove_Shard.png"
};

// HTML-Zeichen wie &amp; zuruecklesen
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // zuletzt, damit "&amp;lt;" nicht doppelt aufgeloest wird
}

// Aus dem Vorschaubild-Pfad den Pfad des Originals machen:
// "/images/thumb/Grove_Shard.png/32px-Grove_Shard.png?d40eb" -> "/images/Grove_Shard.png"
export function originalImagePath(src: string): string | null {
  const match = /\/images\/thumb\/([^/]+)\//.exec(src);
  return match === null ? null : `/images/${match[1]}`;
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return match === null ? null : decodeHtmlEntities(match[1]);
}

export function parseWikiShardList(html: string): WikiShard[] {
  const result: WikiShard[] = [];
  const startTag = /<span class="invslot-item[^"]*"[^>]*>/g;
  const starts = [...html.matchAll(startTag)];

  starts.forEach((start, index) => {
    const tag = start[0];
    const title = attribute(tag, "data-minetip-title");
    const tooltip = attribute(tag, "data-minetip-text");
    if (title === null || tooltip === null) return;

    // Das Bild steht zwischen diesem Tag und dem naechsten Shard-Tag
    const from = (start.index ?? 0) + tag.length;
    const to = starts[index + 1]?.index ?? html.length;
    const img = /<img [^>]*src="([^"]+)"/.exec(html.slice(from, to));
    const imagePath = img === null ? null : originalImagePath(decodeHtmlEntities(img[1]));
    if (imagePath === null) return;

    const name = title.replace(/[&§][0-9a-fk-or]/gi, "").replace(/ Shard$/, "").trim();
    result.push({
      name,
      title,
      tooltip,
      style: attribute(tag, "data-minetip-style") ?? "",
      imagePath,
    });
  });

  return result;
}
