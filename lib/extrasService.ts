// Der Ablauf fuer /api/extras: Name -> UUID -> Profil -> Minions, Pets, Dungeons.
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import {
  parseDungeons,
  parseMinions,
  parsePets,
  type DungeonsData,
  type MinionRow,
  type PetRow,
} from "./extras";

export type ExtrasResponse = {
  uuid: string;
  playerName: string;
  profileName: string;
  minions: MinionRow[];
  pets: PetRow[];
  dungeons: DungeonsData;
};

export async function getExtras(playerName: string, profileName: string): Promise<ExtrasResponse> {
  const { uuid, name } = await getUuid(playerName);
  const profiles = await fetchProfiles(uuid);
  const selected = selectMember(profiles, uuid, profileName);
  const member = selected.member;
  return {
    uuid,
    playerName: name,
    profileName: selected.profileName,
    minions: parseMinions(member.player_data?.crafted_generators),
    pets: parsePets(member.pets_data?.pets),
    dungeons: parseDungeons(member.dungeons),
  };
}
