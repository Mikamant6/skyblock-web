// Zuordnung und Level: Port von R/shard_attributes.R (ohne das Einlesen der CSVs).
// Reine Logik: kennt weder die API noch Dateien, sie bekommt nur Daten.

// Eine Zeile der Zuordnung "API-Attribut -> Shard"
export type AttributeRow = {
  rarity: string; // Seltenheit, z. B. "common"
  slotId: string;
  shardName: string;
  attributeName: string;
  attributeId: string; // so heisst das Attribut in der Hypixel-API
  productId: string; // Shard-ID, z. B. "SHARD_GROVE"
};

// Ein Alias: ein Attribut, das in der API anders heisst als im Wiki
export type AttributeAlias = {
  apiAttributeId: string;
  shardName: string;
  productId: string;
  rarity: string;
  evidence: string; // woher wir es wissen: "experiment" oder "elimination"
};

// Abweichende Bazaar-ID eines Shards (null = nicht handelbar)
export type BazaarOverride = {
  shardProductId: string;
  bazaarProductId: string | null;
  evidence: string;
};

// Level-Grenzen: pro Seltenheit die kumulierten Shards. Die Position im
// Array ist das Level (Position 0 = Level 0, Position 10 = Level 10).
export type LevelTable = Record<string, number[]>;

// Was wir ueber einen Shard wissen
export type ShardInfo = {
  attributeId: string;
  shardName: string;
  productId: string;
  rarity: string;
};

// Ein Shard, den der Account besitzt, mit der Menge
export type OwnedShard = ShardInfo & { shardsSyphoned: number };

// Ein Attribut aus dem Profil, das wir nicht kennen
export type UnmatchedAttribute = {
  attributeId: string;
  shardsSyphoned: number;
};

// Baut das Nachschlagewerk "Attribut-ID -> Shard".
// Aliase haben Vorrang: Zeilen der Wiki-Tabelle, die denselben Shard oder
// dieselbe Attribut-ID wie ein Alias haben, werden durch den Alias ersetzt.
export function buildLookup(
  rows: AttributeRow[],
  aliases: AttributeAlias[],
): Map<string, ShardInfo> {
  const aliasAttributeIds = new Set(aliases.map((a) => a.apiAttributeId));
  const aliasProductIds = new Set(aliases.map((a) => a.productId));

  const entries: ShardInfo[] = [];

  for (const row of rows) {
    if (
      aliasAttributeIds.has(row.attributeId) ||
      aliasProductIds.has(row.productId)
    ) {
      continue; // wird durch den Alias ersetzt
    }
    entries.push({
      attributeId: row.attributeId,
      shardName: row.shardName,
      productId: row.productId,
      rarity: row.rarity,
    });
  }

  for (const alias of aliases) {
    entries.push({
      attributeId: alias.apiAttributeId,
      shardName: alias.shardName,
      productId: alias.productId,
      rarity: alias.rarity,
    });
  }

  const lookup = new Map<string, ShardInfo>();
  for (const entry of entries) {
    if (lookup.has(entry.attributeId)) {
      // Dieselbe Attribut-ID zweimal waere eine unklare Zuordnung: lieber stoppen
      throw new Error(
        `Doppelte Attribut-ID in der Zuordnung: ${entry.attributeId}`,
      );
    }
    lookup.set(entry.attributeId, entry);
  }
  return lookup;
}

// Ordnet die Stacks aus dem Profil (Attribut-ID -> Menge) den Shards zu.
// Unbekannte Attribute stoppen nichts, sie werden getrennt gemeldet.
export function attachShards(
  stacks: Record<string, number>,
  lookup: Map<string, ShardInfo>,
): { matched: OwnedShard[]; unmatched: UnmatchedAttribute[] } {
  const matched: OwnedShard[] = [];
  const unmatched: UnmatchedAttribute[] = [];

  for (const [attributeId, shardsSyphoned] of Object.entries(stacks)) {
    const info = lookup.get(attributeId);
    if (info === undefined) {
      unmatched.push({ attributeId, shardsSyphoned });
    } else {
      matched.push({ ...info, shardsSyphoned });
    }
  }
  return { matched, unmatched };
}

// Level = hoechstes Level, dessen kumulierte Shard-Zahl hoechstens so gross
// ist wie die Menge, die der Account syphoniert hat.
export function calculateLevel(
  rarity: string,
  shardsSyphoned: number,
  levels: LevelTable,
): number {
  const cumulative = levels[rarity];
  if (cumulative === undefined) {
    throw new Error(`Unbekannte Seltenheit: ${rarity}`);
  }
  let level = 0;
  for (let i = 0; i < cumulative.length; i++) {
    if (cumulative[i] <= shardsSyphoned) {
      level = i;
    }
  }
  return level;
}

// Bazaar-ID eines Shards: meistens gleich der Shard-ID, ausser es gibt eine
// Ausnahme. Bei "null" gibt es keinen Bazaar-Preis (Shard nicht handelbar).
export function getBazaarProductId(
  shardProductId: string,
  overrides: BazaarOverride[],
): string | null {
  const override = overrides.find((o) => o.shardProductId === shardProductId);
  return override === undefined ? shardProductId : override.bazaarProductId;
}
