import assert from "node:assert/strict";
import test from "node:test";
import { parseWikiPetList, petKey } from "./petWikiParser";

const HTML = `
<span class="invslot-item invslot-item-image" data-minetip-style="mythic" data-minetip-title="&amp;7[Lvl 1➡100] &amp;dArmadillo" data-minetip-text="&amp;8Mining Mount//&amp;6Ridable/&amp;r&amp;eRight-click to add this pet to your pet menu!//&amp;r&amp;d&amp;lMYTHIC"><span typeof="mw:File"><a href="/w/Armadillo_Pet"><img alt="Armadillo Pet" src="/images/thumb/Armadillo_Pet.png/32px-Armadillo_Pet.png?baeaf" width="32"></a></span></span>
<span class="invslot-item" data-minetip-title="&amp;fSome Item" data-minetip-text="&amp;7Not a pet"><img src="/images/thumb/Item.png/32px-Item.png"></span>
<span class="invslot-item invslot-item-image" data-minetip-title="&amp;7[Lvl 1➡100] &amp;6T-Rex" data-minetip-text="&amp;8Combat Pet//&amp;eRight-click to add this pet to your pet menu!"><img src="/images/thumb/T-Rex.png/32px-T-Rex.png"></span>
`;

test("petKey", () => {
  assert.equal(petKey("Ender Dragon"), "enderdragon");
  assert.equal(petKey("T-Rex"), "trex");
  assert.equal(petKey("T_REX"), "trex");
});

test("parseWikiPetList: nur Pets, Name ohne Level und Farbcodes", () => {
  const pets = parseWikiPetList(HTML);
  assert.deepEqual(pets.map((p) => p.name), ["Armadillo", "T-Rex"]);
  assert.equal(pets[0].key, "armadillo");
  assert.equal(pets[0].imagePath, "/images/Armadillo_Pet.png");
  assert.ok(pets[0].tooltip.includes("MYTHIC"));
});
