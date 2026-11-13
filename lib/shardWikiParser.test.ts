// Start: npx.cmd tsx lib/shardWikiParser.test.ts
import assert from "node:assert/strict";
import { decodeHtmlEntities, originalImagePath, parseWikiShardList } from "./shardWikiParser";

// Auszug in der Form, wie ihn die Wiki-Seite liefert (zwei Shards)
const html = `
<td><span class="invslot"><span class="invslot-item invslot-item-image" data-minetip-style="common" data-minetip-title="&amp;fGrove Shard" data-minetip-text="&amp;6Nature Elemental I/&amp;7Grants &amp;c+2  Health&amp;7.//&amp;f&amp;lCOMMON FOREST SHARD &amp;8(ID C1)"><span typeof="mw:File"><a href="/w/Grove_Shard"><img alt="Grove Shard" src="/images/thumb/Grove_Shard.png/32px-Grove_Shard.png?d40eb" decoding="async" width="32"></a></span></span></span></td>
<td><span class="invslot"><span class="invslot-item invslot-item-image" data-minetip-style="rare" data-minetip-title="&amp;9Soul of the Alpha Shard" data-minetip-text="&amp;6Alpha&amp;7 &quot;x&quot;"><span typeof="mw:File"><a href="/w/Soul"><img alt="x" src="/images/thumb/Soul_of_the_Alpha_Shard.png/32px-Soul_of_the_Alpha_Shard.png" width="32"></a></span></span></span></td>`;

const shards = parseWikiShardList(html);
assert.equal(shards.length, 2);
assert.equal(shards[0].name, "Grove");
assert.equal(shards[0].style, "common");
assert.equal(shards[0].title, "&fGrove Shard");
assert.equal(shards[0].tooltip, "&6Nature Elemental I/&7Grants &c+2  Health&7.//&f&lCOMMON FOREST SHARD &8(ID C1)");
assert.equal(shards[0].imagePath, "/images/Grove_Shard.png");
assert.equal(shards[1].name, "Soul of the Alpha");
assert.equal(shards[1].tooltip, '&6Alpha&7 "x"');
assert.equal(shards[1].imagePath, "/images/Soul_of_the_Alpha_Shard.png");

assert.equal(originalImagePath("/images/Other.png"), null);
assert.equal(decodeHtmlEntities("&amp;lt;"), "&lt;"); // nur einmal aufloesen
assert.deepEqual(parseWikiShardList("<p>nichts</p>"), []);

console.log("shardWikiParser: ok");
