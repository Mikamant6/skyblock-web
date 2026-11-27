// Fuer die Shard-Ansicht: pro Shard Name, Attribut, Seltenheit, Tooltip und Bild.
// Gebaut aus data/attributeMap.json (alle 325 Shards) und data/shardInfo.json
// (Tooltips und Bildpfade, geladen von scripts/fetchShardAssets.ts).
// Fehlt shardInfo.json noch (Skript nicht gelaufen), gibt es die Shards trotzdem,
// nur ohne Tooltip-Text und Bild.
import attributeMapJson from "../data/attributeMap.json";
import shardInfoJson from "../data/shardInfo.json";
import type { AttributeRow } from "./shardAttributes";

export type ShardInfoFile = {
  shards: { attributeId: string; title: string; tooltip: string; image: string }[];
};

export type ShardEntry = {
  attributeId: string; // so heisst das Attribut im Wiki (die API nutzt bei manchen Shards einen anderen Namen)
  productId: string; // z. B. "SHARD_GROVE", gleich in Wiki und API-Antwort
  shardName: string; // z. B. "Grove"
  attributeName: string; // z. B. "Nature Elemental"
  rarity: string; // "common" ... "legendary"
  title: string | null; // Titelzeile mit Farbcodes
  tooltip: string | null; // Ingame-Tooltip mit Farbcodes
  image: string | null; // z. B. "/shards/nature_elemental.png"
};

export function buildShardEntries(
  map: AttributeRow[],
  info: ShardInfoFile,
): ShardEntry[] {
  const infoById = new Map(info.shards.map((row) => [row.attributeId, row]));
  return map.map((row) => {
    const extra = infoById.get(row.attributeId);
    return {
      attributeId: row.attributeId,
      productId: row.productId,
      shardName: row.shardName,
      attributeName: row.attributeName,
      rarity: row.rarity,
      title: extra?.title ?? null,
      tooltip: extra?.tooltip ?? null,
      image: extra?.image ?? null,
    };
  });
}

export const shardEntries: ShardEntry[] = buildShardEntries(
  attributeMapJson,
  shardInfoJson as ShardInfoFile,
);
