// Holt die Collection-Tabellen von Hypixel (oeffentliche Adresse, kein Key noetig):
// https://api.hypixel.net/v2/resources/skyblock/collections
// Pro Skill (FARMING, MINING, ...) gibt es Gegenstaende, jeder mit Stufen (Tiers),
// die ab einer bestimmten GESAMT-Menge erreicht sind. Nur auf dem Server benutzen.
import { UserError } from "./errors";
import { createTtlCache } from "./ttlCache";

export type CollectionTier = { tier: number; amountRequired: number };
export type CollectionItem = { id: string; name: string; tiers: CollectionTier[] };
export type CollectionGroup = { key: string; name: string; items: CollectionItem[] };
export type CollectionGroups = Record<string, CollectionGroup>; // Schluessel wie "FARMING"

const cache = createTtlCache<CollectionGroups>(6 * 60 * 60 * 1000, 1);
let running: Promise<CollectionGroups> | null = null;

// Prueft und bereinigt die Antwort. Gibt null zurueck, wenn sie nicht die erwartete Form hat.
export function parseCollectionResources(raw: unknown): CollectionGroups | null {
  if (typeof raw !== "object" || raw === null) return null;
  const collections = (raw as { collections?: unknown }).collections;
  if (typeof collections !== "object" || collections === null) return null;

  const result: CollectionGroups = {};
  for (const [groupKey, groupValue] of Object.entries(collections as Record<string, unknown>)) {
    if (typeof groupValue !== "object" || groupValue === null) continue;
    const group = groupValue as { name?: unknown; items?: unknown };
    if (typeof group.name !== "string" || typeof group.items !== "object" || group.items === null) continue;

    const items: CollectionItem[] = [];
    for (const [id, itemValue] of Object.entries(group.items as Record<string, unknown>)) {
      const item = itemValue as { name?: unknown; tiers?: unknown };
      if (typeof item?.name !== "string" || !Array.isArray(item.tiers)) continue;
      const tiers: CollectionTier[] = [];
      for (const tierValue of item.tiers) {
        const tier = (tierValue as { tier?: unknown })?.tier;
        const amount = (tierValue as { amountRequired?: unknown })?.amountRequired;
        if (typeof tier !== "number" || typeof amount !== "number") return null;
        tiers.push({ tier, amountRequired: amount });
      }
      tiers.sort((a, b) => a.tier - b.tier);
      if (tiers.length > 0) items.push({ id, name: item.name, tiers });
    }
    if (items.length > 0) result[groupKey] = { key: groupKey, name: group.name, items };
  }
  return Object.keys(result).length > 0 ? result : null;
}

export async function getCollectionGroups(): Promise<CollectionGroups> {
  const cached = cache.get("groups");
  if (cached !== undefined) return cached;
  if (running === null) {
    running = requestGroups().finally(() => {
      running = null;
    });
  }
  return running;
}

async function requestGroups(): Promise<CollectionGroups> {
  let response: Response;
  try {
    response = await fetch("https://api.hypixel.net/v2/resources/skyblock/collections", {
      cache: "no-store",
    });
  } catch {
    throw new UserError("Hypixel is currently unreachable. Please try again later.", 502);
  }
  if (response.status !== 200) {
    throw new UserError(`Hypixel responded with status ${response.status}.`, 502);
  }
  const groups = parseCollectionResources(await response.json());
  if (groups === null) {
    console.error("Collection-Tabellen von Hypixel haben nicht die erwartete Form.");
    throw new UserError("The collection data from Hypixel had an unexpected format.", 502);
  }
  cache.set("groups", groups);
  return groups;
}
