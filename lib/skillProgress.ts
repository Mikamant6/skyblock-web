// Reine Rechenlogik fuer Skills (keine Netzwerk-Zugriffe, deshalb gut testbar).
// Aus der gesammelten Erfahrung (XP) eines Skills werden Level und Fortschritt berechnet.
// Die Tabelle kommt von Hypixel: pro Level die GESAMTE XP, die dafuer noetig ist.

export type SkillLevel = { level: number; totalExpRequired: number; unlocks?: string[] };

export type SkillProgress = {
  level: number; // aktuelles Level (0, wenn noch Level 1 fehlt)
  maxLevel: number; // hoechstes Level laut Tabelle
  xpIntoLevel: number; // XP, die seit dem aktuellen Level gesammelt wurden
  xpForNextLevel: number | null; // XP-Bedarf des naechsten Levels (null = Maximum erreicht)
  fraction: number; // Anteil am naechsten Level, 0 bis 1 (bei Maximum: 1)
};

// levels muss nach Level aufsteigend sortiert sein (Level 1, 2, 3, ...)
export function getSkillProgress(xp: number, levels: SkillLevel[]): SkillProgress {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const maxLevel = levels.length;

  // Anzahl der Level, deren Gesamt-XP schon erreicht ist
  let level = 0;
  while (level < maxLevel && levels[level].totalExpRequired <= safeXp) level++;

  const base = level === 0 ? 0 : levels[level - 1].totalExpRequired;
  if (level >= maxLevel) {
    return { level, maxLevel, xpIntoLevel: safeXp - base, xpForNextLevel: null, fraction: 1 };
  }
  const needed = levels[level].totalExpRequired - base;
  const xpIntoLevel = safeXp - base;
  return { level, maxLevel, xpIntoLevel, xpForNextLevel: needed, fraction: xpIntoLevel / needed };
}

// Skill-Average: Mittelwert der Level MIT Nachkommastellen (Level + Fortschritt zum naechsten).
// Welche Skills zaehlen, bestimmt der Aufrufer (Runecrafting und Social zaehlen nicht).
export function skillAverage(progresses: SkillProgress[]): number {
  if (progresses.length === 0) return 0;
  const sum = progresses.reduce(
    (total, p) => total + p.level + (p.xpForNextLevel === null ? 0 : p.fraction),
    0,
  );
  return sum / progresses.length;
}
