// Slayer-Daten (feste Werte, keine Netzwerk-Zugriffe).
// Quelle fuer die XP-Schwellen: SkyBlock Wiki, Seite "Slayer" (Tabelle der Level-Anforderungen).
// Die Zahlen sind die GESAMT-XP, die fuer das jeweilige Level noetig ist.
import type { SkillLevel } from "./skillProgress";

export type SlayerType = {
  key: string; // Schluessel in den Hypixel-Daten (slayer_bosses.<key>)
  name: string; // Name des Slayers
  boss: string; // Name des Bosses
  color: string;
  levels: SkillLevel[];
};

function table(thresholds: number[]): SkillLevel[] {
  return thresholds.map((totalExpRequired, index) => ({ level: index + 1, totalExpRequired }));
}

const ZOMBIE = table([5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000]);
const SPIDER = table([5, 25, 200, 1000, 5000, 20000, 100000, 400000, 1000000]);
const WOLF_LIKE = table([10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000]);
const VAMPIRE = table([20, 75, 240, 840, 2400]);

export const SLAYER_TYPES: SlayerType[] = [
  { key: "zombie", name: "Zombie", boss: "Revenant Horror", color: "#7bc043", levels: ZOMBIE },
  { key: "spider", name: "Spider", boss: "Tarantula Broodfather", color: "#b36be0", levels: SPIDER },
  { key: "wolf", name: "Wolf", boss: "Sven Packmaster", color: "#9ca3af", levels: WOLF_LIKE },
  { key: "enderman", name: "Enderman", boss: "Voidgloom Seraph", color: "#a78bfa", levels: WOLF_LIKE },
  { key: "blaze", name: "Blaze", boss: "Inferno Demonlord", color: "#f59e0b", levels: WOLF_LIKE },
  { key: "vampire", name: "Vampire", boss: "Riftstalker Bloodfiend", color: "#e0534a", levels: VAMPIRE },
];
