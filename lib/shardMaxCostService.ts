// Ablauf fuer /api/shard-costs: Name -> UUID -> Profil + Bazaar-Preise -> Kosten bis Level 10 pro Shard.
// Anders als /api/shards darf das Profil auch ganz ohne Shards sein: dann ist alles "noch offen".
import { fetchShardPrices } from "./bazaarApi";
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { attributeMap, bazaarOverrides, shardLevels, shardLookup } from "./shardData";
import { calculateMaxCosts, type MaxCostResult, type MaxCostRow } from "./shardMaxCost";
import { shardEntries } from "./shardInfo";
import { shardSkillOf } from "./shardSkills";

// Zeile plus Bild-Pfad der Shard-Textur (z. B. "/shards/nature_elemental.png"; null = kein Bild bekannt)
// und Skill des Shards (z. B. "Foraging", laut Wiki; "Global" = kein bestimmter Skill)
export type MaxCostRowWithImage = MaxCostRow & { image: string | null; skill: string };

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
  // Bild ueber die Shard-ID suchen, nicht ueber die Attribut-ID: bei Shards mit Alias heisst das Attribut
  // in der API anders als in der Wiki-Tabelle (z. B. Loch Emperor), das Bild gehoert aber zur Wiki-ID.
  const imageByAttribute = new Map(shardEntries.map((entry) => [entry.attributeId, entry.image]));
  const imageByProduct = new Map(attributeMap.map((row) => [row.productId, imageByAttribute.get(row.attributeId) ?? null]));

  return {
    ...result,
    rows: result.rows.map((row) => ({ ...row, image: imageByProduct.get(row.productId) ?? null, skill: shardSkillOf(row.productId) })),
    uuid,
    playerName: name,
    profileName: selected.profileName,
  };
}
