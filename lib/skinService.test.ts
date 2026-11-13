import assert from "node:assert/strict";
import { extractSkinUrl } from "./skinService";

function profile(textures: unknown) {
  const value = Buffer.from(JSON.stringify(textures)).toString("base64");
  return { id: "x", properties: [{ name: "textures", value }] };
}

assert.equal(
  extractSkinUrl(profile({ textures: { SKIN: { url: "http://textures.minecraft.net/texture/abc123" } } })),
  "https://textures.minecraft.net/texture/abc123",
);
// fremder Server wird abgelehnt
assert.equal(
  extractSkinUrl(profile({ textures: { SKIN: { url: "https://evil.example/texture/abc" } } })),
  null,
);
// kein Skin / kaputte Daten
assert.equal(extractSkinUrl(profile({ textures: {} })), null);
assert.equal(extractSkinUrl({ properties: [{ name: "textures", value: "%%%" }] }), null);
assert.equal(extractSkinUrl(null), null);
assert.equal(extractSkinUrl({}), null);
console.log("skinService.test: ok");
