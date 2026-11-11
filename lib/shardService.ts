// Der ganze Ablauf fuer eine Anfrage: Name -> UUID -> Profil -> Preise -> Wert.
// Port von calculate_shard_networth() aus R/pipeline.R.
import { fetchShardPrices } from "./bazaarApi";
import { UserError } from "./errors";
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { calculateShardNetworth, type ShardNetworth } from "./shardNetworth";

export type ShardNetworthResponse = ShardNetworth & {
  playerName: string; // Schreibweise laut Mojang
  profileName: string; // Schreibweise laut Hypixel
  taxRate: number;
};

const TAX_RATE = 0.0125; // Bazaar-Steuer 1,25 %

export async function getShardNetworth(
  playerName: string,
  profileName: string,
): Promise<ShardNetworthResponse> {
  const { uuid, name } = await getUuid(playerName);

  // Profil und Preise haengen nicht voneinander ab: beide Anfragen starten
  // gleichzeitig und wir warten, bis beide fertig sind
  const [profiles, prices] = await Promise.all([
    fetchProfiles(uuid),
    fetchShardPrices(),
  ]);

  const selected = selectMember(profiles, uuid, profileName);

  const stacks = selected.member.attributes?.stacks;
  if (stacks === undefined || Object.keys(stacks).length === 0) {
    throw new UserError(
      "Im Profil stehen keine Shard-Daten. Moegliche Ursachen: Es wurden noch keine Shards syphoniert, oder die Daten sind ueber die API nicht freigegeben.",
      404,
    );
  }

  return {
    ...calculateShardNetworth(stacks, prices, TAX_RATE),
    playerName: name,
    profileName: selected.profileName,
    taxRate: TAX_RATE,
  };
}
