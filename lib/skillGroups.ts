// Zuordnung von Minions und Pets zu Skills, fuer die Sortierung "nach Skill".
// Minions: von Hand gepflegt (Spielwissen, nicht aus der API). Pets: aus der ersten Tooltip-Zeile der Wiki ("Combat Pet").

// Reihenfolge der Gruppen wie im Spiel-Menue
export const SKILL_ORDER = ["Farming", "Mining", "Combat", "Foraging", "Fishing", "Enchanting", "Alchemy", "Taming", "Hunting", "All Skills", "Other"] as const;
export type SkillGroup = (typeof SKILL_ORDER)[number];

export function skillRank(skill: SkillGroup): number {
  return SKILL_ORDER.indexOf(skill);
}

const MINION_SKILLS: Record<string, SkillGroup> = {
  // Farming
  WHEAT: "Farming", CARROT: "Farming", POTATO: "Farming", PUMPKIN: "Farming", MELON: "Farming", MUSHROOM: "Farming",
  COCOA: "Farming", CACTUS: "Farming", SUGAR_CANE: "Farming", NETHER_WARTS: "Farming", CHICKEN: "Farming",
  COW: "Farming", PIG: "Farming", RABBIT: "Farming", SHEEP: "Farming",
  // Mining
  COBBLESTONE: "Mining", COAL: "Mining", IRON: "Mining", GOLD: "Mining", DIAMOND: "Mining", LAPIS: "Mining",
  EMERALD: "Mining", REDSTONE: "Mining", QUARTZ: "Mining", OBSIDIAN: "Mining", GLOWSTONE: "Mining", GRAVEL: "Mining",
  SAND: "Mining", RED_SAND: "Mining", ENDER_STONE: "Mining", ICE: "Mining", SNOW: "Mining", MYCELIUM: "Mining",
  HARD_STONE: "Mining", MITHRIL: "Mining",
  // Combat
  ZOMBIE: "Combat", SKELETON: "Combat", SPIDER: "Combat", CAVESPIDER: "Combat", CREEPER: "Combat", GHAST: "Combat",
  SLIME: "Combat", BLAZE: "Combat", MAGMA_CUBE: "Combat", ENDERMAN: "Combat", REVENANT: "Combat",
  TARANTULA: "Combat", VAMPIRE: "Combat", VOIDLING: "Combat", INFERNO: "Combat",
  // Foraging
  OAK: "Foraging", BIRCH: "Foraging", SPRUCE: "Foraging", DARK_OAK: "Foraging", ACACIA: "Foraging", JUNGLE: "Foraging",
  FLOWER: "Foraging", SUNFLOWER: "Foraging",
  // Fishing
  FISHING: "Fishing", CLAY: "Fishing", LILY_PAD: "Fishing",
};

export function minionSkill(key: string): SkillGroup {
  return MINION_SKILLS[key] ?? "Other";
}

// "&8Combat Pet" / "&8Mining Mount" / "&8All Skills" -> Skill-Gruppe
export function petSkillFromTooltip(tooltip: string | undefined): SkillGroup {
  if (tooltip === undefined) return "Other";
  const first = tooltip.split("/")[0].replace(/&./g, "").trim();
  for (const skill of SKILL_ORDER) if (skill !== "Other" && first.startsWith(skill)) return skill;
  return "Other";
}
