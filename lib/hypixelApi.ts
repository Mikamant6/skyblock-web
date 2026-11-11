// Datenbeschaffung: Mojang (Name -> UUID) und Hypixel (SkyBlock-Profile).
// Port von R/hypixel_api.R. Laeuft nur auf dem Server: der API-Key darf nie in
// den Browser gelangen.
import { UserError } from "./errors";
import { createTtlCache } from "./ttlCache";

// Nur die Teile der Hypixel-Antwort, die wir brauchen
export type SkyblockMember = {
  attributes?: { stacks?: Record<string, number> };
};
export type SkyblockProfile = {
  cute_name: string; // Profilname, z. B. "Blueberry"
  members: Record<string, SkyblockMember>; // UUID -> Daten des Spielers
};
export type ProfilesResponse = { profiles: SkyblockProfile[] | null };

// Zwischenspeicher: Namen 10 Minuten, Profile 1 Minute
const uuidCache = createTtlCache<{ uuid: string; name: string }>(
  10 * 60 * 1000,
  500,
);
const profilesCache = createTtlCache<ProfilesResponse>(60 * 1000, 200);

export function clearHypixelCaches(): void {
  uuidCache.clear();
  profilesCache.clear();
}

// Mojang: Minecraft-Name -> UUID (eindeutige ID des Spielers)
export async function getUuid(
  playerName: string,
): Promise<{ uuid: string; name: string }> {
  const name = playerName.trim();

  // Minecraft-Namen bestehen nur aus Buchstaben, Zahlen und Unterstrich.
  // Wir pruefen das vorher: so landet nie etwas Unerwartetes in der Adresse,
  // und ungueltige Eingaben kosten keine Anfrage.
  if (!/^[A-Za-z0-9_]{1,16}$/.test(name)) {
    throw new UserError(
      "Bitte einen gueltigen Minecraft-Namen eingeben (1 bis 16 Zeichen: Buchstaben, Zahlen, Unterstrich).",
      400,
    );
  }

  const cacheKey = name.toLowerCase();
  const cached = uuidCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let response: Response;
  try {
    response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,
      { cache: "no-store" },
    );
  } catch {
    throw new UserError(
      "Mojang ist gerade nicht erreichbar. Bitte spaeter noch einmal versuchen.",
      502,
    );
  }

  if (response.status === 404 || response.status === 204) {
    throw new UserError(
      `Spieler '${name}' wurde nicht gefunden. Name richtig geschrieben?`,
      404,
    );
  }
  if (response.status !== 200) {
    throw new UserError(
      `Mojang hat mit Status ${response.status} geantwortet. Bitte spaeter noch einmal versuchen.`,
      502,
    );
  }

  const data = (await response.json()) as { id?: unknown; name?: unknown };
  if (typeof data.id !== "string" || !/^[0-9a-f]{32}$/i.test(data.id)) {
    throw new UserError("Mojang hat eine unerwartete Antwort geschickt.", 502);
  }

  const result = {
    uuid: data.id.toLowerCase(),
    name: typeof data.name === "string" ? data.name : name,
  };
  uuidCache.set(cacheKey, result);
  return result;
}

// Hypixel: alle SkyBlock-Profile eines Spielers
export async function fetchProfiles(uuid: string): Promise<ProfilesResponse> {
  const cached = profilesCache.get(uuid);
  if (cached !== undefined) return cached;

  // Der Key steht in der Datei .env.local und wird von Next.js beim Start geladen
  const apiKey = process.env.HYPIXEL_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    console.error(
      "HYPIXEL_API_KEY fehlt. Steht er in .env.local und wurde der Server neu gestartet?",
    );
    throw new UserError(
      "Der Dienst ist gerade nicht richtig eingerichtet (API-Key fehlt).",
      503,
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`,
      { headers: { "API-Key": apiKey }, cache: "no-store" },
    );
  } catch {
    throw new UserError(
      "Hypixel ist gerade nicht erreichbar. Bitte spaeter noch einmal versuchen.",
      502,
    );
  }

  if (response.status === 403) {
    console.error(
      "Hypixel hat den API-Key abgelehnt (403). Ist der Key richtig und noch gueltig?",
    );
    throw new UserError(
      "Der Dienst kann Hypixel gerade nicht abfragen (der API-Key wurde abgelehnt, vermutlich ist er abgelaufen). Bitte spaeter noch einmal versuchen.",
      503,
    );
  }
  if (response.status === 429) {
    throw new UserError(
      "Zu viele Anfragen an Hypixel (429). Bitte ein paar Minuten warten.",
      429,
    );
  }
  if (response.status !== 200) {
    throw new UserError(
      `Hypixel hat mit Status ${response.status} geantwortet.`,
      502,
    );
  }

  const data = (await response.json()) as ProfilesResponse;
  profilesCache.set(uuid, data);
  return data;
}

// Aus allen Profilen die Daten des Spielers im gewuenschten Profil herausholen.
// Der Profilname wird ohne Beachtung von Gross- und Kleinschreibung verglichen.
export function selectMember(
  profilesRaw: ProfilesResponse,
  uuid: string,
  profileName: string,
): { profileName: string; member: SkyblockMember } {
  const profiles = profilesRaw.profiles ?? [];
  if (profiles.length === 0) {
    throw new UserError(
      "Fuer diesen Spieler wurden keine SkyBlock-Profile gefunden.",
      404,
    );
  }

  const available = profiles.map((p) => p.cute_name).join(", ");
  const wanted = profileName.trim().toLowerCase();
  if (wanted === "") {
    throw new UserError(`Bitte ein Profil angeben. Vorhanden: ${available}`, 400);
  }

  const profile = profiles.find((p) => p.cute_name.toLowerCase() === wanted);
  if (profile === undefined) {
    throw new UserError(
      `Profil '${profileName.trim()}' nicht gefunden. Vorhanden: ${available}`,
      404,
    );
  }

  const member = profile.members[uuid];
  if (member === undefined) {
    throw new UserError(
      `Im Profil '${profile.cute_name}' wurden keine Daten fuer diesen Spieler gefunden.`,
      404,
    );
  }
  return { profileName: profile.cute_name, member };
}
