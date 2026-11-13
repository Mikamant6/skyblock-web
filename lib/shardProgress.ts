// Fortschritt eines Shards: wie viele Stueck fehlen noch bis zum naechsten Level?
// Reine Logik. Die Tabelle steht in data/shardLevels.json: pro Seltenheit die
// kumulierte Stueckzahl, die fuer Level 0, 1, 2 ... 10 noetig ist.
import type { LevelTable } from "./shardAttributes";

export type ShardProgress = {
  level: number;
  maxLevel: number;
  nextLevel: number | null; // null = hoechstes Level erreicht
  remaining: number | null; // Stueck bis zum naechsten Level, null bei Max
};

export function getShardProgress(
  rarity: string,
  shardsSyphoned: number,
  levels: LevelTable,
): ShardProgress {
  const cumulative = levels[rarity];
  if (cumulative === undefined) {
    throw new Error(`Unbekannte Seltenheit: ${rarity}`);
  }

  let level = 0;
  for (let i = 0; i < cumulative.length; i++) {
    if (cumulative[i] <= shardsSyphoned) level = i;
  }

  const maxLevel = cumulative.length - 1;
  if (level >= maxLevel) {
    return { level, maxLevel, nextLevel: null, remaining: null };
  }
  return {
    level,
    maxLevel,
    nextLevel: level + 1,
    remaining: cumulative[level + 1] - shardsSyphoned,
  };
}
