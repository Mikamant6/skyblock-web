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
  banking?: { balance?: number }; // Bankguthaben des Profils (Coins)
};
export type ProfilesResponse = { profiles: SkyblockProfile[] | null };

// Zwischenspeicher: Namen 1 Stunde, Profile 1 Minute. Mojang und Hypixel
// begrenzen die Anfragen pro Adresse, deshalb fragen wir so selten wie moeglich.
const uuidCache = createTtlCache<{ uuid: string; name: string }>(
  60 * 60 * 1000,
  500,
);
const profilesCache = createTtlCache<ProfilesResponse>(60 * 1000, 200);

// Laufende Anfragen: fragen zwei Teile der Seite gleichzeitig dasselbe ab
// (Shards und Networth), wird nur EINE echte Anfrage gestellt und das
// Ergebnis geteilt. Das halbiert die Zahl der Anfragen an Mojang und Hypixel.
const inflight = new Map<string, Promise<unknown>>();

function shareRequest<T>(key: string, work: () => Promise<T>): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running !== undefined) return running;
  const promise = work().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function clearHypixelCaches(): void {
  uuidCache.clear();
  profilesCache.clear();
  inflight.clear();
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
      "Please enter a valid Minecraft name (1 to 16 characters: letters, digits, underscore).",
      400,
    );
  }

  const cacheKey = name.toLowerCase();
  const cached = uuidCache.get(cacheKey);
  if (cached !== undefined) return cached;

  return shareRequest(`uuid:${cacheKey}`, () => lookupUuid(name, cacheKey));
}

// Die eigentliche Anfrage an Mojang (nur ueber getUuid aufrufen)
async function lookupUuid(
  name: string,
  cacheKey: string,
): Promise<{ uuid: string; name: string }> {
  let response: Response;
  try {
    response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,
      { cache: "no-store" },
    );
  } catch {
    throw new UserError(
      "Mojang is currently unreachable. Please try again later.",
      502,
    );
  }

  if (response.status === 404 || response.status === 204) {
    throw new UserError(
      `Player '${name}' was not found. Is the name spelled correctly?`,
      404,
    );
  }
  if (response.status === 429) {
    throw new UserError(
      "Mojang is limiting requests right now (429). Please wait a few minutes and try again.",
      429,
    );
  }
  if (response.status !== 200) {
    throw new UserError(
      `Mojang responded with status ${response.status}. Please try again later.`,
      502,
    );
  }

  const data = (await response.json()) as { id?: unknown; name?: unknown };
  if (typeof data.id !== "string" || !/^[0-9a-f]{32}$/i.test(data.id)) {
    throw new UserError("Mojang sent an unexpected response.", 502);
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

  return shareRequest(`profiles:${uuid}`, () => requestProfiles(uuid));
}

// Die eigentliche Anfrage an Hypixel (nur ueber fetchProfiles aufrufen)
async function requestProfiles(uuid: string): Promise<ProfilesResponse> {
  // Der Key steht in der Datei .env.local und wird von Next.js beim Start geladen
  const apiKey = process.env.HYPIXEL_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    console.error(
      "HYPIXEL_API_KEY fehlt. Steht er in .env.local und wurde der Server neu gestartet?",
    );
    throw new UserError(
      "The service is not set up correctly right now (API key missing).",
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
      "Hypixel is currently unreachable. Please try again later.",
      502,
    );
  }

  if (response.status === 403) {
    console.error(
      "Hypixel hat den API-Key abgelehnt (403). Ist der Key richtig und noch gueltig?",
    );
    throw new UserError(
      "The service cannot query Hypixel right now (the API key was rejected, it has probably expired). Please try again later.",
      503,
    );
  }
  if (response.status === 429) {
    throw new UserError(
      "Too many requests to Hypixel (429). Please wait a few minutes.",
      429,
    );
  }
  if (response.status !== 200) {
    throw new UserError(
      `Hypixel responded with status ${response.status}.`,
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
): { profileName: string; member: SkyblockMember; bankBalance: number } {
  const profiles = profilesRaw.profiles ?? [];
  if (profiles.length === 0) {
    throw new UserError(
      "No SkyBlock profiles were found for this player.",
      404,
    );
  }

  const available = profiles.map((p) => p.cute_name).join(", ");
  const wanted = profileName.trim().toLowerCase();
  if (wanted === "") {
    throw new UserError(`Please enter a profile name. Available: ${available}`, 400);
  }

  const profile = profiles.find((p) => p.cute_name.toLowerCase() === wanted);
  if (profile === undefined) {
    throw new UserError(
      `Profile '${profileName.trim()}' not found. Available: ${available}`,
      404,
    );
  }

  const member = profile.members[uuid];
  if (member === undefined) {
    throw new UserError(
      `No data for this player was found in profile '${profile.cute_name}'.`,
      404,
    );
  }
  const balance = profile.banking?.balance;
  const bankBalance =
    typeof balance === "number" && Number.isFinite(balance) ? balance : 0;
  return { profileName: profile.cute_name, member, bankBalance };
}
