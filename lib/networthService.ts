// Der Ablauf fuer /api/networth: Name -> UUID -> Profil -> Networth.
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { calculateProfileNetworth } from "./networthEngine";
import { summarizeNetworth, type NetworthSummary } from "./networthSummary";

export type NetworthResponse = NetworthSummary & {
  uuid: string; // Spieler-ID (fuer das Skin-Bild)
  playerName: string; // Schreibweise laut Mojang
  profileName: string; // Schreibweise laut Hypixel
};

export async function getNetworth(
  playerName: string,
  profileName: string,
): Promise<NetworthResponse> {
  const { uuid, name } = await getUuid(playerName);
  const profiles = await fetchProfiles(uuid);
  const selected = selectMember(profiles, uuid, profileName);

  const raw = await calculateProfileNetworth(
    selected.member,
    selected.bankBalance,
  );

  return {
    ...summarizeNetworth(raw),
    uuid,
    playerName: name,
    profileName: selected.profileName,
  };
}
