// Minions, Pets und Dungeons aus den Rohdaten eines Spielers.
// Alles wird vorsichtig gelesen: fehlt ein Feld oder hat es eine andere Form, bleibt es leer
// und nichts stuerzt ab. Es werden keine Level berechnet (dafuer fehlen geprueften Tabellen).

export type MinionRow = {
  key: string; // z. B. "COBBLESTONE"
  name: string; // z. B. "Cobblestone"
  highestTier: number; // hoechste hergestellte Stufe
  craftedTiers: number; // Anzahl hergestellter Stufen
};

export type PetRow = {
  type: string;
  name: string;
  rarity: string; // z. B. "LEGENDARY"
  exp: number;
  active: boolean;
  heldItem: string | null;
};

export type DungeonClassRow = { name: string; exp: number };

export type DungeonsData = {
  catacombsExp: number;
  masterExp: number;
  selectedClass: string | null;
  classes: DungeonClassRow[];
  // Abschluesse pro Floor (Index 0 = Entrance, 1 = Floor 1 ...), normal und Master
  completions: number[];
  masterCompletions: number[];
};

export function prettyName(id: string): string {
  return id
    .toLowerCase()
    .split("_")
    .filter((part) => part !== "")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Eintraege heissen "<TYP>_<STUFE>", z. B. "COBBLESTONE_5"
export function parseMinions(crafted: unknown): MinionRow[] {
  if (!Array.isArray(crafted)) return [];
  const byType = new Map<string, Set<number>>();
  for (const entry of crafted) {
    if (typeof entry !== "string") continue;
    const match = /^(.+)_(\d{1,2})$/.exec(entry);
    if (match === null) continue;
    const tiers = byType.get(match[1]) ?? new Set<number>();
    tiers.add(Number(match[2]));
    byType.set(match[1], tiers);
  }
  return [...byType.entries()]
    .map(([key, tiers]) => ({
      key,
      name: prettyName(key),
      highestTier: Math.max(...tiers),
      craftedTiers: tiers.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const RARITY_ORDER = ["MYTHIC", "LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];

export function parsePets(pets: unknown): PetRow[] {
  if (!Array.isArray(pets)) return [];
  const rows: PetRow[] = [];
  for (const pet of pets) {
    if (!isRecord(pet) || typeof pet.type !== "string") continue;
    rows.push({
      type: pet.type,
      name: prettyName(pet.type),
      rarity: typeof pet.tier === "string" ? pet.tier : "COMMON",
      exp: num(pet.exp),
      active: pet.active === true,
      heldItem: typeof pet.heldItem === "string" ? prettyName(pet.heldItem) : null,
    });
  }
  const rank = (r: string) => {
    const i = RARITY_ORDER.indexOf(r);
    return i === -1 ? RARITY_ORDER.length : i;
  };
  return rows.sort((a, b) => Number(b.active) - Number(a.active) || rank(a.rarity) - rank(b.rarity) || b.exp - a.exp);
}

// "tier_completions" ist ein Objekt wie { "0": 12, "1": 40, ..., "total": 300 }
function readCompletions(value: unknown): number[] {
  const result: number[] = [];
  if (!isRecord(value)) return result;
  for (const [field, count] of Object.entries(value)) {
    if (!/^\d{1,2}$/.test(field)) continue; // "total" usw. ignorieren
    result[Number(field)] = num(count);
  }
  for (let i = 0; i < result.length; i++) result[i] = result[i] ?? 0;
  return result;
}

export function parseDungeons(dungeons: unknown): DungeonsData {
  const empty: DungeonsData = {
    catacombsExp: 0,
    masterExp: 0,
    selectedClass: null,
    classes: [],
    completions: [],
    masterCompletions: [],
  };
  if (!isRecord(dungeons)) return empty;
  const types = isRecord(dungeons.dungeon_types) ? dungeons.dungeon_types : {};
  const normal = isRecord(types.catacombs) ? types.catacombs : {};
  const master = isRecord(types.master_catacombs) ? types.master_catacombs : {};
  const classesRaw = isRecord(dungeons.player_classes) ? dungeons.player_classes : {};
  const classes = Object.entries(classesRaw)
    .map(([key, value]) => ({ name: prettyName(key), exp: isRecord(value) ? num(value.experience) : 0 }))
    .sort((a, b) => b.exp - a.exp);
  return {
    catacombsExp: num(normal.experience),
    masterExp: num(master.experience),
    selectedClass:
      typeof dungeons.selected_dungeon_class === "string"
        ? prettyName(dungeons.selected_dungeon_class)
        : null,
    classes,
    completions: readCompletions(normal.tier_completions),
    masterCompletions: readCompletions(master.tier_completions),
  };
}
