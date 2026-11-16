// Reine Rechenlogik fuer den XP-Planer: wie viel XP fehlt bis zu einem Ziel-Level
// und wie lange dauert das bei einer bestimmten XP-Rate pro Stunde.
import type { SkillLevel } from "./skillProgress";

// Fehlende XP bis zum Ziel-Level (0, wenn schon erreicht oder Level unbekannt)
export function xpToLevel(currentXp: number, targetLevel: number, levels: SkillLevel[]): number {
  const target = levels.find((entry) => entry.level === targetLevel);
  if (target === undefined) return 0;
  const safe = Number.isFinite(currentXp) && currentXp > 0 ? currentXp : 0;
  return Math.max(0, target.totalExpRequired - safe);
}

// Dauer fuer die fehlende XP; null, wenn keine gueltige Rate angegeben wurde
export function hoursNeeded(missingXp: number, xpPerHour: number): number | null {
  if (!Number.isFinite(xpPerHour) || xpPerHour <= 0) return null;
  return missingXp / xpPerHour;
}

// 1.5 -> "1h 30m", 0.25 -> "15m", 52 -> "2d 4h", 0 -> "0m"
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes <= 0) return "0m";
  const days = Math.floor(totalMinutes / (60 * 24));
  const hoursPart = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hoursPart > 0 ? `${days}d ${hoursPart}h` : `${days}d`;
  if (hoursPart > 0) return minutes > 0 ? `${hoursPart}h ${minutes}m` : `${hoursPart}h`;
  return `${minutes}m`;
}
