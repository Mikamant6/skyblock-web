// Der Ablauf fuer /api/skill-detail: Details zu EINEM Skill - Level-Tabelle mit Belohnungen
// und (falls der Skill welche hat) die dazugehoerigen Collections.
import { getCollectionProgress } from "./collectionProgress";
import { getCollectionGroups } from "./collectionResources";
import { fetchProfiles, getUuid, selectMember } from "./hypixelApi";
import { UserError } from "./errors";
import { getSkillProgress } from "./skillProgress";
import { getSkillTables } from "./skillResources";
import type { SkillRow } from "./skillsService";

export type LevelRow = {
  level: number;
  totalExpRequired: number; // Gesamt-XP fuer dieses Level
  xpForLevel: number; // XP nur fuer diesen Schritt (vom vorherigen Level)
  unlocks: string[]; // Belohnungen laut Hypixel
};

export type CollectionRow = {
  id: string;
  name: string;
  amount: number;
  tier: number;
  maxTier: number;
  nextRequired: number | null;
  fraction: number;
  tiers: { tier: number; amountRequired: number; unlocks: string[] }[]; // alle Stufen mit Freischaltungen
};

export type SkillDetailResponse = {
  uuid: string;
  playerName: string;
  profileName: string;
  skill: SkillRow;
  levels: LevelRow[];
  collections: CollectionRow[]; // leer, wenn der Skill keine Collections hat
};

// Nur diese Skills nutzen (Gross-/Kleinschreibung egal): schuetzt vor beliebigen Eingaben
export async function getSkillDetail(
  playerName: string,
  profileName: string,
  skillKey: string,
): Promise<SkillDetailResponse> {
  const key = skillKey.trim().toUpperCase();
  const { uuid, name } = await getUuid(playerName);
  const [profiles, tables, groups] = await Promise.all([
    fetchProfiles(uuid),
    getSkillTables(),
    getCollectionGroups().catch(() => null), // Collections sind Zusatz: Fehler hier blockiert den Skill nicht
  ]);

  const table = tables[key];
  if (table === undefined) {
    throw new UserError(`Unknown skill '${skillKey.trim()}'.`, 404);
  }
  const selected = selectMember(profiles, uuid, profileName);
  const rawXp = selected.member.player_data?.experience?.[`SKILL_${key}`];
  const xp = typeof rawXp === "number" && Number.isFinite(rawXp) ? rawXp : 0;

  const skill: SkillRow = {
    key,
    name: table.name,
    xp,
    countsForAverage: !["RUNECRAFTING", "SOCIAL", "DUNGEONEERING"].includes(key),
    ...getSkillProgress(xp, table.levels),
  };

  const levels: LevelRow[] = table.levels.map((entry, index) => ({
    level: entry.level,
    totalExpRequired: entry.totalExpRequired,
    xpForLevel: entry.totalExpRequired - (index === 0 ? 0 : table.levels[index - 1].totalExpRequired),
    unlocks: entry.unlocks ?? [],
  }));

  const owned = selected.member.collection ?? {};
  const group = groups?.[key];
  const collections: CollectionRow[] =
    group === undefined
      ? []
      : group.items.map((item) => {
          const raw = owned[item.id];
          const amount = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
          const tiers = item.tiers.map((entry) => ({
            tier: entry.tier,
            amountRequired: entry.amountRequired,
            unlocks: entry.unlocks ?? [],
          }));
          return { id: item.id, name: item.name, amount, ...getCollectionProgress(amount, item.tiers), tiers };
        });

  return { uuid, playerName: name, profileName: selected.profileName, skill, levels, collections };
}
