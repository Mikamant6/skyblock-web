// Was kostet es, jeden Shard auf Level 10 (max) zu bringen?
// Reine Logik: bekommt Shards, Besitz, Preise und Level-Tabelle, gibt die Liste zurueck.
// Preis = "Instant Buy": man kauft sofort zum niedrigsten Verkaufsangebot (buy_summary[0] im Bazaar).
// Vereinfachung: Menge x Preis des ersten Angebots; bei sehr grossen Mengen steigt der echte Preis etwas.
import type { ShardPrices } from "./bazaarApi";
import { calculateLevel, getBazaarProductId, type BazaarOverride, type LevelTable, type ShardInfo } from "./shardAttributes";

export type MaxCostRow = {
  attributeId: string; // ID im Profil (fuer das Bild)
  shardName: string;
  productId: string;
  rarity: string;
  owned: number; // bereits syphonierte Shards
  level: number; // aktuelles Level (0 bis 10)
  maxed: boolean;
  remaining: number; // Shards, die noch bis Level 10 fehlen
  unitPrice: number | null; // Instant-Buy-Preis pro Shard; null = kein Preis / nicht handelbar
  cost: number | null; // remaining x unitPrice; null = kein Preis
};

export type MaxCostResult = {
  rows: MaxCostRow[]; // sortiert: offene Shards nach Kosten aufsteigend, dann maximierte, dann ohne Preis
  maxedCount: number;
  totalCount: number;
};

export function calculateMaxCosts(
  shards: ShardInfo[],
  stacks: Record<string, number>,
  prices: ShardPrices,
  levels: LevelTable,
  overrides: BazaarOverride[],
): MaxCostResult {
  const rows: MaxCostRow[] = shards.map((shard) => {
    const cumulative = levels[shard.rarity];
    if (cumulative === undefined) throw new Error(`Unbekannte Seltenheit: ${shard.rarity}`);
    const needForMax = cumulative[cumulative.length - 1];

    const owned = stacks[shard.attributeId] ?? 0;
    const remaining = Math.max(0, needForMax - owned);

    const bazaarId = getBazaarProductId(shard.productId, overrides);
    const unitPrice = bazaarId === null ? null : (prices[bazaarId]?.sellOfferPrice ?? null);

    return {
      attributeId: shard.attributeId,
      shardName: shard.shardName,
      productId: shard.productId,
      rarity: shard.rarity,
      owned,
      level: calculateLevel(shard.rarity, owned, levels),
      maxed: remaining === 0,
      remaining,
      unitPrice,
      cost: remaining === 0 ? 0 : unitPrice === null ? null : remaining * unitPrice,
    };
  });

  // 0 = offen mit Preis, 1 = schon maximiert, 2 = offen ohne Preis
  const group = (row: MaxCostRow) => (row.maxed ? 1 : row.cost === null ? 2 : 0);
  rows.sort((a, b) => group(a) - group(b) || (a.cost ?? 0) - (b.cost ?? 0) || a.shardName.localeCompare(b.shardName));

  return { rows, maxedCount: rows.filter((r) => r.maxed).length, totalCount: rows.length };
}
