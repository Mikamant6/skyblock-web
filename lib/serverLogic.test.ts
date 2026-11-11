// Tests fuer den Serverteil. Es wird nie das echte Internet benutzt: wir tauschen
// "fetch" gegen eine Attrappe aus, die vorbereitete Antworten liefert.
// Ausfuehren mit:  npx.cmd tsx lib/serverLogic.test.ts
import assert from "node:assert/strict";
import {
  clearBazaarCache,
  extractShardPrices,
  fetchShardPrices,
  type BazaarResponse,
  type ShardPrices,
} from "./bazaarApi";
import { UserError } from "./errors";
import {
  clearHypixelCaches,
  fetchProfiles,
  getUuid,
  selectMember,
  type ProfilesResponse,
} from "./hypixelApi";
import { attachShards, getBazaarProductId } from "./shardAttributes";
import { bazaarOverrides, shardLookup } from "./shardData";
import { calculateShardNetworth } from "./shardNetworth";
import { getShardNetworth } from "./shardService";
import stacksAfter from "./fixtures/stacksAfter.json";

// ---- Hilfsmittel ---------------------------------------------------------

// Kommazahlen sind nie ganz exakt: mit winziger Toleranz vergleichen
function assertClose(actual: number, expected: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${label}: erwartet ${expected}, bekommen ${actual}`,
  );
}

// Prueft, dass ein UserError mit passendem Status und Text geworfen wurde
function userError(status: number, textPart: string) {
  return (error: unknown) => {
    assert.ok(error instanceof UserError, `kein UserError: ${String(error)}`);
    assert.equal(error.status, status);
    assert.ok(
      error.message.includes(textPart),
      `Meldung enthaelt nicht '${textPart}': ${error.message}`,
    );
    return true;
  };
}

// Die Attrappe fuer fetch: merkt sich alle Aufrufe und antwortet mit "route"
let calls: { url: string; headers: Record<string, string> }[] = [];
function installFakeFetch(route: (url: string) => Response) {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    return route(url);
  }) as unknown as typeof fetch;
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const UUID = "01596463604941e7bcfd44a70a0a2e31";

async function main() {
  // ---- A. Bazaar-Antwort in Preisliste umwandeln ------------------------------
  const fakeBazaar: BazaarResponse = {
    products: {
      SHARD_A: {
        buy_summary: [{ pricePerUnit: 100 }, { pricePerUnit: 120 }],
        sell_summary: [{ pricePerUnit: 50 }],
        quick_status: { buyMovingWeek: 16800 },
      },
      SHARD_B: { buy_summary: [], sell_summary: [{ pricePerUnit: 7 }], quick_status: {} },
      ENCHANTED_DIAMOND: { buy_summary: [{ pricePerUnit: 999 }] },
    },
  };
  const extracted = extractShardPrices(fakeBazaar);
  assert.deepEqual(Object.keys(extracted).sort(), ["SHARD_A", "SHARD_B"]);
  assert.deepEqual(extracted.SHARD_A, {
    sellOfferPrice: 100,
    instantSellPrice: 50,
    weeklyInstantBuys: 16800,
  });
  assert.deepEqual(extracted.SHARD_B, {
    sellOfferPrice: null,
    instantSellPrice: 7,
    weeklyInstantBuys: null,
  });
  // Ohne Shard-Produkte lieber melden als alles mit 0 bewerten
  assert.throws(() => extractShardPrices({ products: { X: {} } }), userError(502, "contains no shards"));
  assert.throws(() => extractShardPrices({}), userError(502, "contains no shards"));
  console.log("A. Bazaar-Antwort -> Preisliste: ok");

  // ---- B. Shard-Wert eines Accounts -------------------------------------------
  // Dein Beispiel aus R: 2500 Stueck "hunter" (= Bogged, Bazaar-ID SHARD_SEA_ARCHER)
  const examplePrices: ShardPrices = {
    SHARD_SEA_ARCHER: { sellOfferPrice: 100, instantSellPrice: 50, weeklyInstantBuys: 16800 },
  };
  const one = calculateShardNetworth({ hunter: 2500 }, examplePrices);
  assert.equal(one.shards.length, 1);
  const bogged = one.shards[0];
  assert.equal(bogged.shardName, "Bogged");
  assert.equal(bogged.bazaarProductId, "SHARD_SEA_ARCHER");
  assert.equal(bogged.level, 10);
  assert.equal(bogged.unitsSellOffer, 2400);
  assert.equal(bogged.unitsInstantSell, 100);
  assertClose(bogged.valueRaw, 245000, "valueRaw");
  assertClose(bogged.valueAfterTax, 241937.5, "valueAfterTax");
  assertClose(one.totals.valueRaw, 245000, "totals.valueRaw");

  // Rainbug ist nicht handelbar: Menge zaehlt als "ohne Preis"
  const rainbugAttribute = [...shardLookup.values()].find(
    (s) => s.productId === "SHARD_RAINBUG",
  )?.attributeId;
  assert.ok(rainbugAttribute !== undefined, "Rainbug nicht in der Zuordnung");
  const rainbug = calculateShardNetworth({ [rainbugAttribute]: 24 }, examplePrices);
  assert.equal(rainbug.shards[0].bazaarProductId, null);
  assert.equal(rainbug.totals.unitsUnpriced, 24);
  assert.equal(rainbug.totals.valueRaw, 0);

  // Handelbarer Shard, aber kein Preis in der Liste: ebenfalls "ohne Preis"
  const noPrice = calculateShardNetworth({ spider_essence: 4 }, examplePrices);
  assert.equal(noPrice.shards[0].shardName, "Arachne");
  assert.equal(noPrice.totals.unitsUnpriced, 4);

  // Unbekanntes Attribut: wird gemeldet, der Rest wird trotzdem berechnet
  const withUnknown = calculateShardNetworth({ hunter: 3, gibt_es_nicht: 5 }, examplePrices);
  assert.equal(withUnknown.unmatched.length, 1);
  assert.equal(withUnknown.totals.shardCount, 1);

  // Ganzer Test-Account mit einheitlichen Preisen: 100 Offer, 50 Instant, Limit 1000/Tag
  const { matched } = attachShards(stacksAfter, shardLookup);
  const allPrices: ShardPrices = {};
  let unpricedPieces = 0;
  for (const m of matched) {
    const id = getBazaarProductId(m.productId, bazaarOverrides);
    if (id === null) {
      unpricedPieces += m.shardsSyphoned;
    } else {
      allPrices[id] = { sellOfferPrice: 100, instantSellPrice: 50, weeklyInstantBuys: 7000 };
    }
  }
  assert.ok(Math.max(...Object.values(stacksAfter)) <= 1000, "Annahme Tagesgrenze verletzt");
  const account = calculateShardNetworth(stacksAfter, allPrices);
  assert.equal(account.totals.shardCount, 175);
  assert.equal(account.totals.pieces, 2331);
  assert.equal(account.unmatched.length, 0);
  assert.equal(account.totals.unitsUnpriced, unpricedPieces);
  // Alles passt unter die Tagesgrenze: jedes bepreiste Stueck zaehlt 100
  assertClose(account.totals.valueRaw, 100 * (2331 - unpricedPieces), "Account valueRaw");
  assertClose(account.totals.valueAfterTax, account.totals.valueRaw * 0.9875, "Account nach Steuer");
  for (let i = 1; i < account.shards.length; i++) {
    assert.ok(account.shards[i - 1].valueRaw >= account.shards[i].valueRaw, "nicht sortiert");
  }
  console.log(
    `B. Shard-Wert: Beispiel, Rainbug, ohne Preis, unbekannt, ganzer Account (${account.totals.shardCount} Shards): ok`,
  );

  // ---- C. Profil und Mitglied auswaehlen ---------------------------------------
  const profilesRaw: ProfilesResponse = {
    profiles: [
      { cute_name: "Blueberry", members: { [UUID]: { attributes: { stacks: { hunter: 2 } } } } },
      { cute_name: "Apple", members: { andere_uuid: {} } },
    ],
  };
  assert.equal(selectMember(profilesRaw, UUID, "blueberry").profileName, "Blueberry");
  assert.throws(() => selectMember({ profiles: null }, UUID, "Blueberry"), userError(404, "No SkyBlock profiles"));
  assert.throws(() => selectMember(profilesRaw, UUID, "Kiwi"), userError(404, "Available: Blueberry, Apple"));
  assert.throws(() => selectMember(profilesRaw, UUID, "  "), userError(400, "Please enter a profile name"));
  assert.throws(() => selectMember(profilesRaw, UUID, "Apple"), userError(404, "No data for this player"));
  console.log("C. Profil auswaehlen und Fehlermeldungen: ok");

  // ---- D. Mojang: Name -> UUID -------------------------------------------------
  installFakeFetch(() => json({}));
  await assert.rejects(() => getUuid("bad name!"), userError(400, "valid Minecraft name"));
  await assert.rejects(() => getUuid(""), userError(400, "valid Minecraft name"));
  assert.equal(calls.length, 0, "ungueltige Namen duerfen keine Anfrage ausloesen");

  installFakeFetch(() => new Response(null, { status: 404 }));
  await assert.rejects(() => getUuid("Unknown_One"), userError(404, "'Unknown_One' was not found"));
  installFakeFetch(() => new Response(null, { status: 204 }));
  await assert.rejects(() => getUuid("Unknown_Two"), userError(404, "not found"));
  installFakeFetch(() => new Response(null, { status: 500 }));
  await assert.rejects(() => getUuid("Mojang_Down"), userError(502, "status 500"));
  installFakeFetch(() => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(() => getUuid("Offline_Guy"), userError(502, "unreachable"));
  installFakeFetch(() => json({ id: "kaputt", name: "Weird" }));
  await assert.rejects(() => getUuid("Weird"), userError(502, "unexpected response"));

  installFakeFetch(() => json({ id: UUID.toUpperCase(), name: "Quantussy" }));
  const found = await getUuid("quantussy");
  assert.deepEqual(found, { uuid: UUID, name: "Quantussy" });
  assert.ok(calls[0].url.endsWith("/users/profiles/minecraft/quantussy"));
  await getUuid("QUANTUSSY"); // zweiter Aufruf: kommt aus dem Zwischenspeicher
  assert.equal(calls.length, 1, "zweiter Aufruf haette aus dem Speicher kommen muessen");
  console.log("D. Mojang (gueltig, ungueltig, 404, 204, 500, offline, Zwischenspeicher): ok");

  // ---- E. Hypixel: Profile ------------------------------------------------------
  clearHypixelCaches();
  installFakeFetch(() => json({}));
  delete process.env.HYPIXEL_API_KEY;
  await assert.rejects(() => fetchProfiles("a".repeat(32)), userError(503, "not set up correctly"));
  assert.equal(calls.length, 0, "ohne Key darf keine Anfrage rausgehen");

  process.env.HYPIXEL_API_KEY = "test-key";
  installFakeFetch(() => new Response(null, { status: 403 }));
  await assert.rejects(() => fetchProfiles("a".repeat(32)), userError(503, "rejected"));
  installFakeFetch(() => new Response(null, { status: 429 }));
  await assert.rejects(() => fetchProfiles("b".repeat(32)), userError(429, "Too many requests"));
  installFakeFetch(() => new Response(null, { status: 500 }));
  await assert.rejects(() => fetchProfiles("c".repeat(32)), userError(502, "status 500"));

  installFakeFetch(() => json({ success: true, profiles: profilesRaw.profiles }));
  const fetched = await fetchProfiles("d".repeat(32));
  assert.equal(fetched.profiles?.length, 2);
  assert.equal(calls[0].headers["API-Key"], "test-key", "Key muss im Header stehen");
  assert.ok(!calls[0].url.includes("test-key"), "Key darf nie in der Adresse stehen");
  assert.ok(calls[0].url.includes(`uuid=${"d".repeat(32)}`));
  await fetchProfiles("d".repeat(32));
  assert.equal(calls.length, 1, "zweiter Aufruf haette aus dem Speicher kommen muessen");
  console.log("E. Hypixel (ohne Key, 403, 429, 500, Header, Zwischenspeicher): ok");

  // ---- F. Bazaar abrufen --------------------------------------------------------
  clearBazaarCache();
  installFakeFetch(() => json(fakeBazaar));
  const bazaarFirst = await fetchShardPrices();
  assert.equal(Object.keys(bazaarFirst).length, 2);
  await fetchShardPrices();
  assert.equal(calls.length, 1, "zweiter Aufruf haette aus dem Speicher kommen muessen");
  clearBazaarCache();
  installFakeFetch(() => new Response(null, { status: 500 }));
  await assert.rejects(() => fetchShardPrices(), userError(502, "status 500"));
  installFakeFetch(() => new Response(null, { status: 429 }));
  await assert.rejects(() => fetchShardPrices(), userError(429, "Too many requests"));
  console.log("F. Bazaar abrufen: ok");

  // ---- G. Alles zusammen: getShardNetworth ---------------------------------------
  clearHypixelCaches();
  clearBazaarCache();
  let currentStacks: Record<string, number> = stacksAfter;
  const fakeProducts: NonNullable<BazaarResponse["products"]> = {};
  for (const id of Object.keys(allPrices)) {
    fakeProducts[id] = {
      buy_summary: [{ pricePerUnit: 100 }],
      sell_summary: [{ pricePerUnit: 50 }],
      quick_status: { buyMovingWeek: 7000 },
    };
  }
  installFakeFetch((url) => {
    if (url.includes("mojang.com")) return json({ id: UUID, name: "Quantussy" });
    if (url.includes("skyblock/profiles")) {
      return json({
        success: true,
        profiles: [
          { cute_name: "Blueberry", members: { [UUID]: { attributes: { stacks: currentStacks } } } },
        ],
      });
    }
    if (url.includes("skyblock/bazaar")) return json({ success: true, products: fakeProducts });
    return new Response(null, { status: 404 });
  });

  const full = await getShardNetworth("quantussy", "BLUEBERRY");
  assert.equal(full.playerName, "Quantussy");
  assert.equal(full.profileName, "Blueberry");
  assert.equal(full.totals.shardCount, 175);
  assert.equal(full.totals.pieces, 2331);
  assertClose(full.totals.valueRaw, account.totals.valueRaw, "Gesamtwert");
  assert.equal(calls.length, 3, "erwartet: Mojang, Profile, Bazaar");

  // Profil ohne Shard-Daten
  clearHypixelCaches();
  currentStacks = {};
  await assert.rejects(() => getShardNetworth("Quantussy", "Blueberry"), userError(404, "no shard data"));
  console.log("G. Gesamtablauf mit Attrappen (3 Anfragen, leere Stacks): ok");

  console.log("Alle Tests bestanden.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
