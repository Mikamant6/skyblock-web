// Verbindet Zuordnung, Level und Preise zum Shard-Wert eines Accounts.
// Port von calculate_shard_value_for_member() aus R/pipeline.R.
// Reine Logik: bekommt Stacks und Preise, gibt das Ergebnis zurueck.
import type { ShardPrices } from "./bazaarApi";
import {
  attachShards,
  calculateLevel,
  getBazaarProductId,
  type OwnedShard,
  type UnmatchedAttribute,
} from "./shardAttributes";
import { bazaarOverrides, shardLevels, shardLookup } from "./shardData";
import { calculateShardValue, type ShardValue } from "./shardValue";

// Eine Zeile pro Shard: Besitz, Level und Wert
export type ShardRow = OwnedShard &
  ShardValue & {
    level: number;
    bazaarProductId: string | null; // null = nicht handelbar
  };

export type ShardNetworth = {
  shards: ShardRow[]; // sortiert: wertvollster Shard zuerst
  unmatched: UnmatchedAttribute[]; // Attribute, die wir nicht kennen
  totals: {
    shardCount: number; // Anzahl verschiedener Shards
    pieces: number; // Stueck insgesamt
    valueRaw: number; // Wert vor Steuer
    valueAfterTax: number; // Wert nach Bazaar-Steuer
    unitsUnpriced: number; // Stueck ohne Preis (zaehlen als 0)
  };
};

export function calculateShardNetworth(
  stacks: Record<string, number>,
  prices: ShardPrices,
  taxRate: number = 0.0125,
): ShardNetworth {
  const { matched, unmatched } = attachShards(stacks, shardLookup);

  const shards: ShardRow[] = matched.map((shard) => {
    const bazaarProductId = getBazaarProductId(shard.productId, bazaarOverrides);
    // Kein Bazaar-Produkt oder kein Preis in der Liste: alle Preise fehlen
    const price =
      bazaarProductId === null ? undefined : prices[bazaarProductId];

    const value = calculateShardValue(
      shard.shardsSyphoned,
      price?.sellOfferPrice ?? null,
      price?.instantSellPrice ?? null,
      price?.weeklyInstantBuys ?? null,
      taxRate,
    );

    return {
      ...shard,
      ...value,
      level: calculateLevel(shard.rarity, shard.shardsSyphoned, shardLevels),
      bazaarProductId,
    };
  });

  // Wertvollster Shard zuerst
  shards.sort((a, b) => b.valueRaw - a.valueRaw);

  const sum = (pick: (row: ShardRow) => number) =>
    shards.reduce((total, row) => total + pick(row), 0);

  return {
    shards,
    unmatched,
    totals: {
      shardCount: shards.length,
      pieces: sum((r) => r.shardsSyphoned),
      valueRaw: sum((r) => r.valueRaw),
      valueAfterTax: sum((r) => r.valueAfterTax),
      unitsUnpriced: sum((r) => r.unitsUnpriced),
    },
  };
}
