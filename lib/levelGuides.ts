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
};

export type GearItem = {
  slot: string; // z. B. "Armor", "Tool", "Accessory", "Pet"
  name: string; // Name des Gegenstands oder Sets
  note?: string; // optional: Hinweis (woher, warum)
  id?: string; // optional: Item-ID eines einzelnen Gegenstands
  icon?: string; // optional: Bild des einzelnen Gegenstands
  tooltip?: { title: string; text: string }; // optional: fertiger Tooltip mit Farbcodes (siehe GearPiece)
  pieces?: GearPiece[]; // optional: Teile eines Sets (z. B. 4 Ruestungsteile)
  flow?: boolean; // optional: true = die Teile sind ein Weg von links nach rechts (z. B. Spruce Axe -> Treecapitator), mit Pfeilen dazwischen
};

export type LevelRange = {
  from: number;
  to: number;
  gear: GearItem[];
};

export type LevelGuide = { ranges: LevelRange[] };

const guides = levelGuidesJson as unknown as Record<string, LevelGuide>;

export function getLevelGuide(skillKey: string): LevelGuide {
  return guides[skillKey] ?? { ranges: [] };
}

// Die Teile eines Eintrags als Liste (ein einzelner Gegenstand zaehlt als ein Teil).
// IDs, die mit "PET:" beginnen, sind Pets (aus dem Pet-Menue, nicht aus den Inventaren), z. B. "PET:RABBIT".
export function piecesOf(item: GearItem): GearPiece[] {
  if (item.pieces !== undefined) return item.pieces;
  if (item.id === undefined) return [];
  return [{ name: item.name, id: item.id, icon: item.icon, tooltip: item.tooltip }];
}

// Alle Item-IDs eines Skills (zum Abfragen, was der Spieler besitzt)
export function itemIdsOf(skillKey: string): string[] {
  const ids = new Set<string>();
  for (const range of getLevelGuide(skillKey).ranges) {
    for (const item of range.gear) for (const piece of piecesOf(item)) ids.add(piece.id);
  }
  return [...ids];
}
