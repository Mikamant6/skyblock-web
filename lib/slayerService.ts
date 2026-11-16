// Der Ablauf fuer /api/slayers: Name -> UUID -> Profil -> Slayer-XP und Boss-Kills.
import { fetchProfiles, getUuid, selectMember, type SlayerBossData } from "./hypixelApi";
import { getSkillProgress, type SkillProgress } from "./skillProgress";
import { SLAYER_TYPES } from "./slayerTables";

export type SlayerRow = SkillProgress & {
  key: string;
  name: string;
  boss: string;
  color: string;
  xp: number;
  killsByTier: number[]; // Index 0 = Tier I, 1 = Tier II, ...
  totalKills: number;
};

export type SlayersResponse = {
  uuid: string;
  playerName: string;
  profileName: string;
  slayers: SlayerRow[];
  totalXp: number;
  totalKills: number;
};

// Aus den Rohdaten eines Slayers die Kills pro Tier holen. Die Felder heissen
// boss_kills_tier_0, boss_kills_tier_1, ... (Tier I = 0). Nur dieses Muster wird gelesen.
export function readKillsByTier(data: SlayerBossData | undefined): number[] {
  const result: number[] = [];
  if (data === undefined) return result;
  for (const [field, value] of Object.entries(data)) {
    const match = /^boss_kills_tier_(\d+)$/.exec(field);
    if (match === null || typeof value !== "number" || !Number.isFinite(value)) continue;
    const tier = Number(match[1]);
    if (tier > 20) continue; // Schutz vor unsinnigen Eintraegen
    result[tier] = value;
  }
  // Luecken (nicht vorhandene Tiers) als 0 auffuellen
  for (let i = 0; i < result.length; i++) result[i] = result[i] ?? 0;
  return result;
}

export async function getSlayers(
  playerName: string,
  profileName: string,
): Promise<SlayersResponse> {
  const { uuid, name } = await getUuid(playerName);
  const profiles = await fetchProfiles(uuid);
  const selected = selectMember(profiles, uuid, profileName);
  const bosses = selected.member.slayer?.slayer_bosses ?? {};

  const slayers: SlayerRow[] = SLAYER_TYPES.map((type) => {
    const data = bosses[type.key];
    const rawXp = data?.xp;
    const xp = typeof rawXp === "number" && Number.isFinite(rawXp) ? rawXp : 0;
    const killsByTier = readKillsByTier(data);
    return {
      key: type.key,
      name: type.name,
      boss: type.boss,
      color: type.color,
      xp,
      killsByTier,
      totalKills: killsByTier.reduce((sum, n) => sum + n, 0),
      ...getSkillProgress(xp, type.levels),
    };
  });

  return {
    uuid,
    playerName: name,
    profileName: selected.profileName,
    slayers,
    totalXp: slayers.reduce((sum, s) => sum + s.xp, 0),
    totalKills: slayers.reduce((sum, s) => sum + s.totalKills, 0),
  };
}
