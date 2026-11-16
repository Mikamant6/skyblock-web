// Der Ablauf fuer /api/skills: Name -> UUID -> Profil -> Skill-XP -> Level.
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { getSkillProgress, skillAverage, type SkillProgress } from "./skillProgress";
import { getSkillTables } from "./skillResources";
import { SKILL_ORDER } from "./skillMeta";

export type SkillRow = SkillProgress & {
  key: string; // z. B. "FARMING"
  name: string; // z. B. "Farming"
  xp: number; // gesamte gesammelte XP
  countsForAverage: boolean;
};

export type SkillsResponse = {
  uuid: string;
  playerName: string;
  profileName: string;
  skills: SkillRow[];
  average: number; // Skill-Average mit Nachkommastellen
};

// Diese Skills zaehlen nicht fuer den Skill-Average
const NOT_IN_AVERAGE = new Set(["RUNECRAFTING", "SOCIAL", "DUNGEONEERING"]);

export async function getSkills(
  playerName: string,
  profileName: string,
): Promise<SkillsResponse> {
  const { uuid, name } = await getUuid(playerName);
  const [profiles, tables] = await Promise.all([fetchProfiles(uuid), getSkillTables()]);
  const selected = selectMember(profiles, uuid, profileName);

  // Skill-XP stehen in player_data.experience, z. B. SKILL_FARMING
  const experience = selected.member.player_data?.experience ?? {};

  const skills: SkillRow[] = Object.values(tables)
    .map((table) => {
      const raw = experience[`SKILL_${table.key}`];
      const xp = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
      return {
        key: table.key,
        name: table.name,
        xp,
        countsForAverage: !NOT_IN_AVERAGE.has(table.key),
        ...getSkillProgress(xp, table.levels),
      };
    })
    .sort((a, b) => rank(a.key) - rank(b.key));

  return {
    uuid,
    playerName: name,
    profileName: selected.profileName,
    skills,
    average: skillAverage(skills.filter((s) => s.countsForAverage)),
  };
}

function rank(key: string): number {
  const index = SKILL_ORDER.indexOf(key);
  return index === -1 ? SKILL_ORDER.length : index;
}
