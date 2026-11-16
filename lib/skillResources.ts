// Holt die XP-Tabellen der Skills von Hypixel (oeffentliche Adresse, kein Key noetig):
// https://api.hypixel.net/v2/resources/skyblock/skills
// Die Tabellen aendern sich selten, deshalb bleiben sie 6 Stunden im Zwischenspeicher.
// Nur auf dem Server benutzen.
import { UserError } from "./errors";
import { createTtlCache } from "./ttlCache";
import type { SkillLevel } from "./skillProgress";

export type SkillTable = { key: string; name: string; levels: SkillLevel[] };
export type SkillTables = Record<string, SkillTable>; // Schluessel wie "FARMING"

const cache = createTtlCache<SkillTables>(6 * 60 * 60 * 1000, 1);
let running: Promise<SkillTables> | null = null;

// Prueft und bereinigt die Antwort. Gibt null zurueck, wenn sie nicht die erwartete Form hat.
export function parseSkillResources(raw: unknown): SkillTables | null {
  if (typeof raw !== "object" || raw === null) return null;
  const skills = (raw as { skills?: unknown }).skills;
  if (typeof skills !== "object" || skills === null) return null;

  const result: SkillTables = {};
  for (const [key, value] of Object.entries(skills as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) continue;
    const entry = value as { name?: unknown; levels?: unknown };
    if (typeof entry.name !== "string" || !Array.isArray(entry.levels)) continue;

    const levels: SkillLevel[] = [];
    for (const item of entry.levels) {
      const level = (item as { level?: unknown })?.level;
      const total = (item as { totalExpRequired?: unknown })?.totalExpRequired;
      if (typeof level !== "number" || typeof total !== "number") return null;
      // "unlocks" (Belohnungen des Levels) ist optional; nur Texte werden uebernommen
      const rawUnlocks = (item as { unlocks?: unknown })?.unlocks;
      const unlocks = Array.isArray(rawUnlocks)
        ? rawUnlocks.filter((text): text is string => typeof text === "string")
        : [];
      levels.push({ level, totalExpRequired: total, unlocks });
    }
    levels.sort((a, b) => a.level - b.level);
    if (levels.length > 0) result[key] = { key, name: entry.name, levels };
  }
  return Object.keys(result).length > 0 ? result : null;
}

export async function getSkillTables(): Promise<SkillTables> {
  const cached = cache.get("tables");
  if (cached !== undefined) return cached;
  // Zwei gleichzeitige Anfragen teilen sich eine echte Anfrage
  if (running === null) {
    running = requestTables().finally(() => {
      running = null;
    });
  }
  return running;
}

async function requestTables(): Promise<SkillTables> {
  let response: Response;
  try {
    response = await fetch("https://api.hypixel.net/v2/resources/skyblock/skills", {
      cache: "no-store",
    });
  } catch {
    throw new UserError("Hypixel is currently unreachable. Please try again later.", 502);
  }
  if (response.status !== 200) {
    throw new UserError(`Hypixel responded with status ${response.status}.`, 502);
  }
  const tables = parseSkillResources(await response.json());
  if (tables === null) {
    console.error("Skill-Tabellen von Hypixel haben nicht die erwartete Form.");
    throw new UserError("The skill data from Hypixel had an unexpected format.", 502);
  }
  cache.set("tables", tables);
  return tables;
}
