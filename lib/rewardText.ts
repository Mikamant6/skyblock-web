// Faerbt die Level-Belohnungen der Skills wie im Spiel (Coins gold, SkyBlock XP tuerkis ...).
// Die Hypixel-API liefert die Belohnungen als reinen Text ohne Farbcodes, zum Beispiel:
//   "+250 Coins", "+5 SkyBlock XP", "+2 Health", "+Access to The Barn",
//   "Jerry Stone Reforge", "Farmhand II   Grants +4➜8  Farming Fortune, which increases ..."
// Reine Logik, ohne Netzwerk.

export type RewardSegment = { text: string; color: string };

const GOLD = "#FFAA00";
const AQUA = "#55FFFF";
const RED = "#FF5555";
const GREEN = "#55FF55";
const BLUE = "#5555FF";
const YELLOW = "#FFFF55";
const WHITE = "#FFFFFF";
const GRAY = "#AAAAAA";
const PURPLE = "#FF55FF";
const DARK_AQUA = "#00AAAA";

// Farben der Werte wie im Spiel (kleingeschrieben)
const STAT_COLORS: Record<string, string> = {
  coins: GOLD,
  "skyblock xp": AQUA,
  health: RED,
  defense: GREEN,
  "true defense": WHITE,
  strength: RED,
  intelligence: AQUA,
  speed: WHITE,
  "crit chance": BLUE,
  "crit damage": BLUE,
  ferocity: RED,
  "attack speed": YELLOW,
  "bonus attack speed": YELLOW,
  "magic find": AQUA,
  "pet luck": PURPLE,
  "sea creature chance": DARK_AQUA,
  "fishing speed": AQUA,
  "mining speed": GOLD,
  "mining fortune": GOLD,
  "farming fortune": GOLD,
  "foraging fortune": GOLD,
  "fishing fortune": GOLD,
  "ability damage": RED,
  "mana regen": AQUA,
};

function statColor(stat: string): string | null {
  return STAT_COLORS[stat.trim().toLowerCase()] ?? null;
}

// Die API nutzt fuer Stat-Symbole (Herz, Schild ...) unsichtbare "private" Unicode-Zeichen aus dem
// Spiel-Font. In normalen Schriften waeren das Kaestchen: wir entfernen sie, der Name steht ja im Text.
export function cleanReward(text: string): string {
  return text
    .replace(/[\uE000-\uF8FF]/g, "")
    // einzelne Stat-Symbole im Text (Herz, Schild, Klee ...) entfernen; der Pfeil "➜" bleibt
    .replace(/[\u2763\u2764\u2748\u2741\u2623\u2620\u2618\u270E\u2726\u272F]/g, "")
    .trim();
}

export function colorizeReward(raw: string): RewardSegment[] {
  const text = cleanReward(raw);
  // Einfacher Wert: "+250 Coins", "+2 Health", "+5 SkyBlock XP"
  const simple = /^\+\s?([\d.,]+%?)\s+(.+)$/.exec(text);
  if (simple !== null) {
    const color = statColor(simple[2]);
    if (color !== null) return [{ text, color }];
  }

  // Freischaltung: "+Access to The Barn"
  if (/^\+?\s?Access to /i.test(text)) return [{ text, color: GREEN }];

  // Reforge: "Jerry Stone Reforge"
  if (/ Reforge$/i.test(text)) return [{ text, color: PURPLE }];

  // Verzauberungen sind im Spiel blau, Power Stones/Rezepte/Taschen gruen, Sea Creatures dunkeltuerkis
  if (/ Enchantment$/i.test(text)) return [{ text, color: BLUE }];
  if (/ Sea Creature$/i.test(text)) return [{ text, color: DARK_AQUA }];
  if (/ (Power Stone|Recipe|Bag Powers)$/i.test(text)) return [{ text, color: GREEN }];

  // Faehigkeit: "Farmhand II   Grants +4➜8  Farming Fortune, which increases ..."
  const ability = /^(.+?)\s{2,}(.*)$/.exec(text);
  if (ability !== null) {
    const segments: RewardSegment[] = [{ text: ability[1], color: GOLD }];
    const grants = /^(Grants\s+)(\+?[\d.,]+%?(?:\s?➜\s?[\d.,]+%?)?)(\s+)([A-Za-z' ]+?)(,.*|\.?)$/.exec(ability[2]);
    if (grants !== null) {
      const color = statColor(grants[4]) ?? GREEN;
      segments.push(
        { text: "  " + grants[1], color: GRAY },
        { text: grants[2] + grants[3] + grants[4], color },
        { text: grants[5], color: GRAY },
      );
    } else {
      // Beschreibung grau, Zahlen gruen wie im Spiel
      segments.push({ text: "  ", color: GRAY });
      for (const part of ability[2].split(/([\d.,]*\d(?:\s?➜\s?[\d.,]*\d)?%?)/)) {
        if (part === "") continue;
        segments.push({ text: part, color: /^\d/.test(part) ? GREEN : GRAY });
      }
    }
    return segments;
  }

  return [{ text, color: GRAY }];
}
