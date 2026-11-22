// Ablauf fuer /api/shard-costs: Name -> UUID -> Profil + Bazaar-Preise -> Kosten bis Level 10 pro Shard.
// Anders als /api/shards darf das Profil auch ganz ohne Shards sein: dann ist alles "noch offen".
import { fetchShardPrices } from "./bazaarApi";
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { bazaarOverrides, shardLevels, shardLookup } from "./shardData";
import { calculateMaxCosts, type MaxCostResult } from "./shardMaxCost";

export type ShardMaxCostResponse = MaxCostResult & {
  uuid: string;
  playerName: string;
  profileName: string;
};

export async function getShardMaxCosts(playerName: string, profileName: string): Promise<ShardMaxCostResponse> {
  const { uuid, name } = await getUuid(playerName);
  const [profiles, prices] = await Promise.all([fetchProfiles(uuid), fetchShardPrices()]);
  const selected = selectMember(profiles, uuid, profileName);
  const stacks = selected.member.attributes?.stacks ?? {};

  return {
    ...calculateMaxCosts([...shardLookup.values()], stacks, prices, shardLevels, bazaarOverrides),
    uuid,
    playerName: name,
    profileName: selected.profileName,
  };
}
