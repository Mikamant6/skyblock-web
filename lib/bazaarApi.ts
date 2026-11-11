// Datenbeschaffung: Bazaar-Preise der Shards. Port von R/bazaar_api.R.
// Der Bazaar ist ohne API-Key abrufbar.
import { UserError } from "./errors";
import { createTtlCache } from "./ttlCache";

// Preise eines Shards. null bedeutet "nicht vorhanden" (in R war das NA).
export type ShardPrice = {
  sellOfferPrice: number | null; // niedrigstes Verkaufsangebot
  instantSellPrice: number | null; // hoechstes Kaufgesuch
  weeklyInstantBuys: number | null; // Sofortkaeufe der letzten 7 Tage
};
export type ShardPrices = Record<string, ShardPrice>; // Bazaar-ID -> Preise

// Nur die Teile der Bazaar-Antwort, die wir brauchen
type BazaarOrder = { pricePerUnit?: number };
type BazaarProduct = {
  buy_summary?: BazaarOrder[];
  sell_summary?: BazaarOrder[];
  quick_status?: { buyMovingWeek?: number };
};
export type BazaarResponse = { products?: Record<string, BazaarProduct> };

// Preis des ersten (besten) Eintrags einer Orderliste. null, wenn die Liste leer ist.
function firstPrice(orders: BazaarOrder[] | undefined): number | null {
  if (orders === undefined || orders.length === 0) return null;
  const price = Number(orders[0].pricePerUnit);
  return Number.isFinite(price) ? price : null;
}

// Aus dem Bazaar eine Preisliste fuer alle Shard-Produkte machen
export function extractShardPrices(bazaarRaw: BazaarResponse): ShardPrices {
  const prices: ShardPrices = {};

  for (const [id, product] of Object.entries(bazaarRaw.products ?? {})) {
    if (!id.startsWith("SHARD_")) continue;

    const weekly = Number(product.quick_status?.buyMovingWeek);
    prices[id] = {
      sellOfferPrice: firstPrice(product.buy_summary), // Verkaufsangebote, niedrigster Preis
      instantSellPrice: firstPrice(product.sell_summary), // Kaufgesuche, hoechster Preis
      weeklyInstantBuys: Number.isFinite(weekly) ? weekly : null,
    };
  }

  // Ohne ein einziges Shard-Produkt stimmt etwas nicht. Dann lieber melden,
  // als stillschweigend alle Shards mit 0 zu bewerten.
  if (Object.keys(prices).length === 0) {
    throw new UserError(
      "Die Bazaar-Daten von Hypixel enthalten keine Shards. Bitte spaeter noch einmal versuchen.",
      502,
    );
  }
  return prices;
}

// Der Bazaar aendert sich laufend, aber nicht jede Sekunde: 1 Minute Zwischenspeicher
const bazaarCache = createTtlCache<ShardPrices>(60 * 1000, 1);

export function clearBazaarCache(): void {
  bazaarCache.clear();
}

export async function fetchShardPrices(): Promise<ShardPrices> {
  const cached = bazaarCache.get("bazaar");
  if (cached !== undefined) return cached;

  let response: Response;
  try {
    response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar", {
      cache: "no-store",
    });
  } catch {
    throw new UserError(
      "Der Bazaar ist gerade nicht erreichbar. Bitte spaeter noch einmal versuchen.",
      502,
    );
  }

  if (response.status === 429) {
    throw new UserError(
      "Zu viele Anfragen an Hypixel (429). Bitte ein paar Minuten warten.",
      429,
    );
  }
  if (response.status !== 200) {
    throw new UserError(
      `Der Bazaar hat mit Status ${response.status} geantwortet.`,
      502,
    );
  }

  const prices = extractShardPrices((await response.json()) as BazaarResponse);
  bazaarCache.set("bazaar", prices);
  return prices;
}
