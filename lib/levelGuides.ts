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
};

export type GearItem = {
  slot: string; // z. B. "Armor", "Tool", "Accessory", "Pet"
  name: string; // Name des Gegenstands oder Sets
  note?: string; // optional: Hinweis (woher, warum)
  id?: string; // optional: Item-ID eines einzelnen Gegenstands
  icon?: string; // optional: Bild des einzelnen Gegenstands
  tooltip?: { title: string; text: string }; // optional: fertiger Tooltip mit Farbcodes (siehe GearPiece)
  countsAs?: string[]; // optional: wie bei GearPiece (gilt fuer einen einzelnen Gegenstand)
  pieces?: GearPiece[]; // optional: Teile eines Sets (z. B. 4 Ruestungsteile)
  flow?: boolean; // optional: true = die Teile sind ein Weg von links nach rechts (z. B. Spruce Axe -> Treecapitator), mit Pfeilen dazwischen
};

export type LevelRange = {
  from: number;
  to: number;
  gear: GearItem[];
};

export type LevelGuide = { ranges: LevelRange[] };

// Skills, die einen Guide-Tab haben (nur die 5 Haupt-Skills). Alle anderen Skills bekommen keinen Guide.
// Hier aendern, wenn ein weiterer Skill dazukommt (Reiter, Uebersicht und Adressen richten sich danach).
export const GUIDE_SKILLS: string[] = ["FARMING", "MINING", "COMBAT", "FORAGING", "FISHING"];

const guides = levelGuidesJson as unknown as Record<string, LevelGuide>;

export function getLevelGuide(skillKey: string): LevelGuide {
  return guides[skillKey] ?? { ranges: [] };
}

// Die Teile eines Eintrags als Liste (ein einzelner Gegenstand zaehlt als ein Teil).
// IDs, die mit "PET:" beginnen, sind Pets (aus dem Pet-Menue, nicht aus den Inventaren), z. B. "PET:RABBIT".
export function piecesOf(item: GearItem): GearPiece[] {
  if (item.pieces !== undefined) return item.pieces;
  if (item.id === undefined) return [];
  return [{ name: item.name, id: item.id, icon: item.icon, tooltip: item.tooltip, countsAs: item.countsAs }];
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

// Ruestung und Axt: spaeter im Guide = besser. Besitzt man ein Teil einer spaeteren Stufe (gleicher Slot, z. B. Helmet
// oder Axt), gilt das Teil einer frueheren Stufe auch als vorhanden, nicht nur bei direkt craftbaren Upgrades
// (z. B. Park Armor, wenn man schon Helix Armor traegt). Das ist so gewollt: der Guide ist ein allgemeiner Weg
// (z. B. geht kaum jemand nach Galatea noch in den Park, deshalb zaehlt der Treecapitator auch mit einem Fig Hew).
// Zusaetzlich gilt weiter "countsAs" fuer Upgrades, die im Guide nicht vorkommen.
const PROGRESSION_SLOTS = new Set(["HELMET", "CHESTPLATE", "LEGGINGS", "BOOTS", "AXE"]);

function addArmorProgression(skillKey: string, result: Record<string, string[]>): void {
  const entries: { piece: GearPiece; slot: string }[] = [];
  for (const range of getLevelGuide(skillKey).ranges) {
    for (const item of range.gear) {
      for (const piece of piecesOf(item)) {
        // Einzelne Gegenstaende haben keine Art am Teil: dann zaehlt der Slot des Eintrags (z. B. "Axe")
        const slot = (piece.category ?? item.slot).toUpperCase();
        if (PROGRESSION_SLOTS.has(slot)) entries.push({ piece, slot });
      }
    }
  }
  // Von hinten nach vorne: so wirkt auch eine Kette (Park <- Canopy <- Fig <- Helix) ueber mehrere Stufen
  for (let index = entries.length - 1; index >= 0; index--) {
    const { piece, slot } = entries[index];
    if (result[piece.id] !== undefined) continue;
    const better = entries.slice(index + 1).find((other) => other.slot === slot && other.piece.id !== piece.id && result[other.piece.id] !== undefined);
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
