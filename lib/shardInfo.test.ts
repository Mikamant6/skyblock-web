// Start: npx.cmd tsx lib/shardInfo.test.ts
import assert from "node:assert/strict";
import { buildShardEntries, shardEntries } from "./shardInfo";

const map = [
  { rarity: "common", slotId: "C1", shardName: "Grove", attributeName: "Nature Elemental", attributeId: "nature_elemental", productId: "SHARD_GROVE" },
  { rarity: "common", slotId: "C2", shardName: "Mist", attributeName: "Fog Elemental", attributeId: "fog_elemental", productId: "SHARD_MIST" },
];
const info = {
  shards: [{ attributeId: "nature_elemental", title: "&fGrove Shard", tooltip: "&6X I", image: "/shards/nature_elemental.png" }],
};

const entries = buildShardEntries(map, info);
assert.equal(entries.length, 2);
assert.equal(entries[0].image, "/shards/nature_elemental.png");
assert.equal(entries[0].tooltip, "&6X I");
// Shard ohne Info: bleibt in der Liste, nur ohne Tooltip und Bild
assert.equal(entries[1].shardName, "Mist");
assert.equal(entries[1].tooltip, null);
assert.equal(entries[1].image, null);

// Die echten Daten: alle 325 Shards, jede ID nur einmal
assert.equal(shardEntries.length, 325);
assert.equal(new Set(shardEntries.map((e) => e.attributeId)).size, 325);

console.log("shardInfo: ok");
