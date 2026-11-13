// Skin eines Spielers von Mojang holen (nur Server). Der Browser bekommt das
// Skin-Bild von unserer eigenen Adresse (/api/skin) und schneidet den Kopf selbst
// aus. So haengt die Anzeige nicht von Fremddiensten ab, und deren Betreiber
// sehen die Adressen unserer Besucher nicht.
import { UserError } from "./errors";
import { createTtlCache } from "./ttlCache";

// Das Skin aendert sich selten; Mojang begrenzt die Anfragen streng
const skinCache = createTtlCache<Uint8Array>(60 * 60 * 1000, 200);
const inflight = new Map<string, Promise<Uint8Array>>();

// Reine Logik: aus der Mojang-Profilantwort die Skin-Adresse lesen.
// Gibt null zurueck, wenn etwas fehlt oder die Adresse nicht von Mojang kommt.
export function extractSkinUrl(profile: unknown): string | null {
  const properties = (profile as { properties?: unknown })?.properties;
  if (!Array.isArray(properties)) return null;
  const entry = properties.find(
    (item): item is { name: string; value: string } =>
      item?.name === "textures" && typeof item?.value === "string",
  );
  if (entry === undefined) return null;

  let textures: unknown;
  try {
    textures = JSON.parse(Buffer.from(entry.value, "base64").toString("utf8"));
  } catch {
    return null;
  }
  const url = (textures as { textures?: { SKIN?: { url?: unknown } } })?.textures
    ?.SKIN?.url;
  if (typeof url !== "string") return null;

  // Nur Mojangs Textur-Server zulassen (sonst koennte man uns auf fremde Seiten lenken)
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "textures.minecraft.net") return null;
    return `https://textures.minecraft.net${parsed.pathname}`;
  } catch {
    return null;
  }
}

export async function getSkinPng(uuid: string): Promise<Uint8Array> {
  if (!/^[0-9a-f]{32}$/.test(uuid)) {
    throw new UserError("Invalid player id.", 400);
  }
  const cached = skinCache.get(uuid);
  if (cached !== undefined) return cached;

  const running = inflight.get(uuid);
  if (running !== undefined) return running;

  const work = loadSkin(uuid).finally(() => inflight.delete(uuid));
  inflight.set(uuid, work);
  return work;
}

async function loadSkin(uuid: string): Promise<Uint8Array> {
  const profileResponse = await fetch(
    `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
    { cache: "no-store" },
  ).catch(() => null);
  if (profileResponse === null) {
    throw new UserError("Mojang is currently unreachable.", 502);
  }
  if (profileResponse.status === 429) {
    throw new UserError("Mojang is limiting skin requests right now.", 429);
  }
  if (profileResponse.status !== 200) {
    throw new UserError("Skin not found.", 404);
  }

  const skinUrl = extractSkinUrl(await profileResponse.json());
  if (skinUrl === null) throw new UserError("Skin not found.", 404);

  const imageResponse = await fetch(skinUrl, { cache: "no-store" }).catch(() => null);
  if (imageResponse === null || imageResponse.status !== 200) {
    throw new UserError("Skin could not be loaded.", 502);
  }
  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  // PNG-Kennung pruefen und die Groesse begrenzen (Skins sind wenige KB gross)
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!isPng || bytes.length > 100_000) {
    throw new UserError("Skin has an unexpected format.", 502);
  }
  skinCache.set(uuid, bytes);
  return bytes;
}
