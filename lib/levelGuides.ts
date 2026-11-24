// Level-Guides: pro Skill Level-Bereiche (z. B. 3-9, 10-14) und die Ausruestung, die man dort braucht.
// Die Inhalte stehen in data/levelGuides.json und werden NUR von Hand eingetragen (nichts erfunden).
// Ein Eintrag ist ein einzelner Gegenstand (mit "id") oder ein Set (mit "pieces"). Mit der ID kann die Seite
// aus der Hypixel-API zeigen, was der Spieler davon schon besitzt. Die ID ist die SkyBlock-Item-ID
// (z. B. "FARM_SUIT_HELMET"), nicht der Anzeigename; sie steht in der Hypixel-Item-Liste.
// Keine Server-Zugriffe: darf auch im Browser benutzt werden.
import levelGuidesJson from "../data/levelGuides.json";

// Ein Teil eines Sets. Die Felder ab "icon" sind fuer die Hover-Beschreibung wie im Spiel; sie stammen aus der
// Hypixel-Item-Liste (Seltenheit, Art, Werte, Skill-Anforderung) und dem lokalen Bild in public/items.
export type GearPiece = {
  name: string; // Anzeigename, z. B. "Farmhand Helmet"
  id: string; // SkyBlock-Item-ID
  icon?: string; // Bild, z. B. "/items/farmhand-helmet.png"
  rarity?: string; // z. B. "COMMON"
  category?: string; // z. B. "HELMET"
  stats?: Record<string, number>; // z. B. { DEFENSE: 10, FARMING_FORTUNE: 5 }
  requirement?: { skill: string; level: number }; // z. B. Farming 3
  // Fertiger Tooltip mit Farbcodes (z. B. bei Pets aus der Wiki-Liste). Hat Vorrang vor Werten/Anforderung.
  tooltip?: { title: string; text: string };
  // Weitere Item-IDs, die dieses Teil ersetzen: Besitzt man eines davon, gilt das Teil als vorhanden
  // (z. B. Fig Hew gilt als bekommen, wenn man den Figstone Splitter hat, die spaetere Stufe).
  countsAs?: string[];
  // Andere Item-IDs, unter denen dasselbe Teil vorkommen kann (z. B. alter und neuer Name in den Daten).
  // Besitzt man eines davon, gilt das Teil als vorhanden (ohne "via"-Hinweis).
  altIds?: string[];
  // Reforge, die auf diesem Teil sitzen soll (z. B. "Moonglade"); wird im Namen angezeigt ("Moonglade Helix Chopper")
  reforge?: string;
  // Kleiner farbiger Hinweis rechts neben dem Namen, z. B. { text: "for Starlyn Contest", color: "#FF55FF" }
  tag?: { text: string; color: string };
};

// Aufklappbare Zusatzinfo zu einem Eintrag, z. B. { label: "Enchantments", lines: ["Efficiency V", ...] } oder "Pet item"
export type GearDetail = { label: string; lines: string[] };

export type GearItem = {
  slot: string; // z. B. "Armor", "Tool", "Accessory", "Pet"
  name: string; // Name des Gegenstands oder Sets
  note?: string; // optional: Hinweis (woher, warum)
  id?: string; // optional: Item-ID eines einzelnen Gegenstands
  icon?: string; // optional: Bild des einzelnen Gegenstands
  tooltip?: { title: string; text: string }; // optional: fertiger Tooltip mit Farbcodes (siehe GearPiece)
  countsAs?: string[]; // optional: wie bei GearPiece (gilt fuer einen einzelnen Gegenstand)
  altIds?: string[]; // optional: wie bei GearPiece (gilt fuer einen einzelnen Gegenstand)
  // optional: Angaben fuer den Tooltip eines einzelnen Gegenstands (wie bei GearPiece)
  rarity?: string;
  stats?: Record<string, number>;
  requirement?: { skill: string; level: number };
  tag?: { text: string; color: string }; // Hinweis neben dem Namen (siehe GearPiece)
  crop?: string; // optional (Farming): Eintrag gilt nur fuer diese Pflanze (Kennung aus "crops"), z. B. "WHEAT"
  reforge?: string; // Reforge fuer alle Teile des Eintrags (ein Teil kann mit "reforge" am Teil eine eigene haben)
  details?: GearDetail[]; // aufklappbare Zusatzinfos (Enchantments, Reforge-Optionen, Pet-Item)
  pieces?: GearPiece[]; // optional: Teile eines Sets (z. B. 4 Ruestungsteile)
  flow?: boolean; // optional: true = die Teile sind ein Weg von links nach rechts (z. B. Spruce Axe -> Treecapitator), mit Pfeilen dazwischen
};

export type LevelRange = {
  from: number;
  to: number;
  label?: string; // optional: Name des Reiters statt "Level von-bis" (z. B. "Hypermaxed")
  gear: GearItem[];
};

export type LevelGuide = {
  ranges: LevelRange[];
  crops?: { id: string; label: string }[]; // optional (Farming): Pflanzen zur Auswahl, jede hat ihr eigenes Werkzeug
};

// Skills, die einen Guide-Tab haben (nur die 5 Haupt-Skills). Alle anderen Skills bekommen keinen Guide.
// Hier aendern, wenn ein weiterer Skill dazukommt (Reiter, Uebersicht und Adressen richten sich danach).
export const GUIDE_SKILLS: string[] = ["FARMING", "MINING", "COMBAT", "FORAGING", "FISHING"];

const guides = levelGuidesJson as unknown as Record<string, LevelGuide>;

export function getLevelGuide(skillKey: string): LevelGuide {
  return guides[skillKey] ?? { ranges: [] };
}

// Die Teile eines Eintrags als Liste (ein einzelner Gegenstand zaehlt als ein Teil).
// IDs, die mit "PET:" beginnen, sind Pets (aus dem Pet-Menue, nicht aus den Inventaren), z. B. "PET:RABBIT:EPIC".
// IDs, die mit "SHARD:" beginnen, sind Attribute Shards (aus dem Hunting Box), z. B. "SHARD:SHARD_CROW".
export function piecesOf(item: GearItem): GearPiece[] {
  if (item.pieces !== undefined) return item.pieces;
  if (item.id === undefined) return [];
  return [
    {
      name: item.name,
      id: item.id,
      icon: item.icon,
      tooltip: item.tooltip,
      countsAs: item.countsAs,
      altIds: item.altIds,
      rarity: item.rarity,
      stats: item.stats,
      requirement: item.requirement,
      reforge: item.reforge,
      tag: item.tag,
    },
  ];
}

// Anzeigename eines Teils mit Reforge davor, z. B. "Moonglade Helix Chopper"
export function pieceLabel(item: GearItem, piece: GearPiece): string {
  const reforge = piece.reforge ?? item.reforge;
  return reforge === undefined ? piece.name : `${reforge} ${piece.name}`;
}

// Alle Item-IDs eines Skills (zum Abfragen, was der Spieler besitzt)
export function itemIdsOf(skillKey: string): string[] {
  const ids = new Set<string>();
  for (const range of getLevelGuide(skillKey).ranges) {
    for (const item of range.gear) {
      for (const piece of piecesOf(item)) {
        ids.add(piece.id);
        for (const other of piece.countsAs ?? []) ids.add(other);
        for (const other of piece.altIds ?? []) ids.add(other);
      }
    }
  }
  return [...ids];
}

// Besitz-Liste um Teile erweitern, die durch eine bessere Stufe ersetzt wurden (siehe "countsAs").
// Als Fundort steht dann z. B. "via Figstone Splitter". Ohne Daten (null) bleibt es null.
export function withUpgradeOwnership(skillKey: string, owned: Record<string, string[]> | null): Record<string, string[]> | null {
  if (owned === null) return null;
  const result = { ...owned };
  for (const range of getLevelGuide(skillKey).ranges) {
    for (const item of range.gear) {
      for (const piece of piecesOf(item)) {
        if (result[piece.id] !== undefined) continue;
        const alias = (piece.altIds ?? []).find((id) => owned[id] !== undefined);
        if (alias !== undefined) {
          result[piece.id] = owned[alias];
          continue;
        }
        if (piece.countsAs === undefined) continue;
        const hit = piece.countsAs.find((id) => owned[id] !== undefined);
        if (hit === undefined) continue;
        result[piece.id] = [`via ${nameForId(skillKey, hit)}`];
      }
    }
  }
  addArmorProgression(skillKey, result);
  return result;
}

// Ruestung, Waffen/Werkzeuge und Equipment: spaeter im Guide = besser. Besitzt man ein Teil einer spaeteren Stufe
// (gleicher Slot, z. B. Helmet, Axt, Necklace, Rod), gilt das Teil einer frueheren Stufe auch als vorhanden, nicht nur bei
// direkt craftbaren Upgrades (z. B. Park Armor, wenn man schon Helix Armor traegt). Das ist so gewollt: der Guide ist ein
// allgemeiner Weg (z. B. geht kaum jemand nach Galatea noch in den Park, deshalb zaehlt der Treecapitator auch mit einem Fig Hew).
// Zusaetzlich gilt weiter "countsAs" fuer Upgrades, die im Guide nicht vorkommen.
// Teile eines Sets zaehlen nach ihrer Art (Helmet, Necklace, ...), Einzelteile und Wege ("flow") nach dem Slot des Eintrags.
// Sets ohne "category" an den Teilen (z. B. Pest-Ausruestung) gehoeren zu keiner Kette.
const PROGRESSION_SLOTS = new Set(["HELMET", "CHESTPLATE", "LEGGINGS", "BOOTS", "AXE", "PICKAXE", "SWORD", "HOE", "ROD", "LAVA ROD", "NECKLACE", "CLOAK", "BELT", "GLOVES"]);
// Arten, die im Spiel denselben Equipment-Slot meinen
const SLOT_ALIASES: Record<string, string> = { BRACELET: "GLOVES", GAUNTLET: "GLOVES" };

function progressionSlot(item: GearItem, piece: GearPiece): string {
  const raw = item.pieces !== undefined && item.flow !== true ? (piece.category ?? item.slot) : item.slot;
  const slot = raw.toUpperCase();
  return SLOT_ALIASES[slot] ?? slot;
}

function addArmorProgression(skillKey: string, result: Record<string, string[]>): void {
  const entries: { piece: GearPiece; slot: string; crop?: string }[] = [];
  // Ein Teil kann in mehreren Bereichen stehen (z. B. Helix Chopper in 25-57). Die Reihenfolge der Kette richtet sich nach
  // dem ersten Auftreten, sonst wuerde ein spaeter wiederholtes Teil (z. B. Magma Rod bei 45-60) das Hellfire Rod "ersetzen".
  const seen = new Set<string>();
  for (const range of getLevelGuide(skillKey).ranges) {
    for (const item of range.gear) {
      for (const piece of piecesOf(item)) {
        if (seen.has(piece.id)) continue;
        seen.add(piece.id);
        const slot = progressionSlot(item, piece);
        if (PROGRESSION_SLOTS.has(slot)) entries.push({ piece, slot, crop: item.crop });
      }
    }
  }
  // Von hinten nach vorne: so wirkt auch eine Kette (Park <- Canopy <- Fig <- Helix) ueber mehrere Stufen
  for (let index = entries.length - 1; index >= 0; index--) {
    const { piece, slot, crop } = entries[index];
    if (result[piece.id] !== undefined) continue;
    // Werkzeuge verschiedener Pflanzen sind getrennte Ketten; Eintraege ohne Pflanze (z. B. Rookie Hoe) gelten fuer alle
    const better = entries
      .slice(index + 1)
      .find(
        (other) =>
          other.slot === slot &&
          other.piece.id !== piece.id &&
          (crop === undefined || other.crop === undefined || other.crop === crop) &&
          result[other.piece.id] !== undefined,
      );
    if (better === undefined) continue;
    // War das bessere Teil selbst nur "via ..." vorhanden, den echten Besitz weiterreichen (nicht "via Canopy Mask")
    const known = result[better.piece.id];
    result[piece.id] = known[0]?.startsWith("via ") ? known : [`via ${better.piece.name}`];
  }
}

// Anzeigename zu einer Item-ID (aus den Guide-Daten), sonst die ID selbst
function nameForId(skillKey: string, id: string): string {
  for (const range of getLevelGuide(skillKey).ranges) {
    for (const item of range.gear) for (const piece of piecesOf(item)) if (piece.id === id) return piece.name;
  }
  // Nicht im Guide: aus der ID einen lesbaren Namen machen (HELIX_CHOPPER -> Helix Chopper)
  return id
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
