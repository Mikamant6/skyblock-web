// Ablauf fuer /api/shard-costs: Name -> UUID -> Profil + Bazaar-Preise -> Kosten bis Level 10 pro Shard.
// Anders als /api/shards darf das Profil auch ganz ohne Shards sein: dann ist alles "noch offen".
import { fetchShardPrices } from "./bazaarApi";
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { bazaarOverrides, shardLevels, shardLookup } from "./shardData";
import { calculateMaxCosts, type MaxCostResult, type MaxCostRow } from "./shardMaxCost";
import { shardEntries } from "./shardInfo";

// Zeile plus Bild-Pfad der Shard-Textur (z. B. "/shards/nature_elemental.png"; null = kein Bild bekannt)
export type MaxCostRowWithImage = MaxCostRow & { image: string | null };

export type ShardMaxCostResponse = Omit<MaxCostResult, "rows"> & {
  rows: MaxCostRowWithImage[];
  uuid: string;
  playerName: string;
  profileName: string;
};

export async function getShardMaxCosts(playerName: string, profileName: string): Promise<ShardMaxCostResponse> {
  const { uuid, name } = await getUuid(playerName);
  const [profiles, prices] = await Promise.all([fetchProfiles(uuid), fetchShardPrices()]);
  const selected = selectMember(profiles, uuid, profileName);
  const stacks = selected.member.attributes?.stacks ?? {};

  const result = calculateMaxCosts([...shardLookup.values()], stacks, prices, shardLevels, bazaarOverrides);
  const imageById = new Map(shardEntries.map((entry) => [entry.attributeId, entry.image]));

  return {
    ...result,
    rows: result.rows.map((row) => ({ ...row, image: imageById.get(row.attributeId) ?? null })),
    uuid,
    playerName: name,
    profileName: selected.profileName,
  };
}
