// Ablauf fuer /api/owned-items: Name -> UUID -> Profil -> Inventare lesen -> welche der gefragten Gegenstaende besitzt der Spieler,
// und wo (Ruestung am Koerper, Kleiderschrank, Inventar, Enderchest, ...).
// Der Gegenstand wird an seiner ID erkannt (ExtraAttributes.id, z. B. "FARM_SUIT_HELMET").
import { parsePets } from "./extras";
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { getItemPrices, parseMemberInventories } from "./networthEngine";
import { shardLookup } from "./shardData";

export type OwnedItemsResponse = {
  uuid: string;
  playerName: string;
  profileName: string;
  inventoryApi: boolean; // false = Inventar-API des Spielers ist ausgeschaltet (Hypixel liefert dann keine Inventare)
  owned: Record<string, string[]>; // Item-ID -> Orte, an denen der Spieler ihn hat (nur gefragte IDs, die er besitzt)
  prices: Record<string, number>; // Item-ID -> Preis in Coins (SkyHelper-Preisliste, nur gefragte IDs mit bekanntem Preis)
};

// Anzeigename des Inventars (Schluessel kommen aus der Bibliothek, siehe parseItems)
const PLACE_NAMES: Record<string, string> = {
  armor: "worn",
  equipment: "equipped",
  wardrobe: "wardrobe",
  inventory: "inventory",
  enderchest: "ender chest",
  storage: "storage",
  personal_vault: "vault",
  accessories: "accessory bag",
  fishing_bag: "fishing bag",
  potion_bag: "potion bag",
  quiver: "quiver",
};

const MAX_IDS = 300;

function itemIdOf(item: unknown): string | undefined {
  const id = (item as { tag?: { ExtraAttributes?: { id?: unknown } } } | null)?.tag?.ExtraAttributes?.id;
  return typeof id === "string" ? id : undefined;
}

// Seltenheiten von niedrig nach hoch
const TIERS = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"];
function tierIndex(tier: string): number {
  return TIERS.indexOf(tier.toUpperCase());
}

// "PET:RABBIT:LEGENDARY" -> { type: "RABBIT", tier: "LEGENDARY" } (null = keine Pet-ID)
function parsePetId(id: string): { type: string; tier: string } | null {
  const parts = id.split(":");
  if (parts.length !== 3 || parts[0] !== "PET" || tierIndex(parts[2]) < 0) return null;
  return { type: parts[1], tier: parts[2] };
}

// Preise der gefragten Gegenstaende. Die Liste kennt die IDs je nach Eintrag gross oder klein geschrieben.
async function pricesFor(ids: Set<string>): Promise<Record<string, number>> {
  const all = await getItemPrices();
  const result: Record<string, number> = {};
  for (const id of ids) {
    // Pets: der Eintrag der Preisliste heisst "LVL_1_<SELTENHEIT>_<TYP>" (billigstes = Level-1-Pet dieser Seltenheit)
    const parsed = parsePetId(id);
    const key = parsed === null ? id : `LVL_1_${parsed.tier}_${parsed.type}`;
    const price = all[key] ?? all[key.toLowerCase()] ?? all[key.toUpperCase()];
    if (typeof price === "number" && Number.isFinite(price) && price > 0) result[id] = price;
  }
  return result;
}

export async function getOwnedItems(playerName: string, profileName: string, wantedIds: string[]): Promise<OwnedItemsResponse> {
  const { uuid, name } = await getUuid(playerName);
  const profiles = await fetchProfiles(uuid);
  const selected = selectMember(profiles, uuid, profileName);
  const base = { uuid, playerName: name, profileName: selected.profileName };
  const wanted = new Set(wantedIds.slice(0, MAX_IDS));
  const prices = await pricesFor(wanted);

  // Ohne "inventory" im Profil hat der Spieler die Inventar-API ausgeschaltet
  if ((selected.member as { inventory?: unknown }).inventory === undefined) {
    return { ...base, inventoryApi: false, owned: {}, prices };
  }

  const inventories = await parseMemberInventories(selected.member);
  const owned: Record<string, string[]> = {};
  // Shards stehen nicht in den Inventaren, sondern in den Attributen (Hunting Box): ID "SHARD:" + Shard-ID, z. B. "SHARD:SHARD_CROW".
  // Ein Shard zaehlt, sobald man mindestens einen davon gesammelt hat (Menge steht im Ort).
  const shardCounts = new Map<string, number>();
  for (const [attributeId, count] of Object.entries(selected.member.attributes?.stacks ?? {})) {
    const info = shardLookup.get(attributeId);
    if (info === undefined || !(count > 0)) continue;
    shardCounts.set(info.productId, (shardCounts.get(info.productId) ?? 0) + count);
  }
  for (const id of wanted) {
    if (!id.startsWith("SHARD:")) continue;
    const count = shardCounts.get(id.slice("SHARD:".length));
    if (count !== undefined) owned[id] = [`hunting box (${count} shards)`];
  }
  // Pets stehen nicht in den Inventaren, sondern im Pet-Menue: ID "PET:" + Typ + ":" + Mindest-Seltenheit,
  // z. B. "PET:RABBIT:LEGENDARY". Ein Pet zaehlt, wenn es den Typ hat und mindestens diese Seltenheit
  // (ein Mythic Rabbit erfuellt also auch "Legendary").
  const pets = parsePets(selected.member.pets_data?.pets);
  for (const id of wanted) {
    const parsed = parsePetId(id);
    if (parsed === null) continue;
    for (const pet of pets) {
      // Die API schreibt mehrteilige Typen mit Unterstrich ("JADE_DRAGON"), die Guide-IDs ohne ("JADEDRAGON"): Unterstriche ignorieren
      if (pet.type.replace(/_/g, "").toUpperCase() !== parsed.type || tierIndex(pet.rarity) < tierIndex(parsed.tier)) continue;
      const place = `${pet.rarity.toLowerCase()} pet`;
      const places = (owned[id] ??= []);
      if (!places.includes(place)) places.push(place);
    }
  }
  for (const [inventory, items] of Object.entries(inventories)) {
    if (!Array.isArray(items)) continue;
    const place = PLACE_NAMES[inventory] ?? inventory;
    for (const item of items) {
      const id = itemIdOf(item);
      if (id === undefined || !wanted.has(id)) continue;
      const places = (owned[id] ??= []);
      if (!places.includes(place)) places.push(place);
    }
  }
  return { ...base, inventoryApi: true, owned, prices };
}
