// Attribut-Name, Wirkung und "How to Hunt" jedes Shards, aus der Hypixel SkyBlock Wiki (Seite "Attributes/List").
// Gespeichert in data/shardEffects.json, Schluessel = Shard-ID wie "SHARD_GROVE" (so bleibt es auch bei Shards
// mit Alias richtig, deren Attribut in der API anders heisst). Keine Server-Zugriffe: darf auch im Browser benutzt werden.
import shardEffectsJson from "../data/shardEffects.json";

export type ShardDetail = {
  attribute: string; // z. B. "Nature Elemental"
  effect: string; // reiner Text, z. B. "Grants +2-20 Health" (Bereich = Level 1 bis Level 10)
  parts: [string, string?][]; // derselbe Text in Stuecken mit Spielfarbe, z. B. ["+2-20 ❤ Health", "#ff5555"]
  hunt: string; // so kommt man an den Shard
};

const details = shardEffectsJson.shards as unknown as Record<string, ShardDetail>;

export function shardDetailOf(productId: string): ShardDetail | null {
  return details[productId] ?? null;
}

// Nur der Attribut-Name (oder "" wenn unbekannt)
export function attributeNameOf(productId: string): string {
  return details[productId]?.attribute ?? "";
}
