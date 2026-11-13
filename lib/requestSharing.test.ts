// Test: gleichzeitige gleiche Anfragen werden zusammengelegt, und Mojangs
// 429 bekommt eine verstaendliche Meldung. Start: npx.cmd tsx lib/requestSharing.test.ts
import assert from "node:assert/strict";
import { UserError } from "./errors";
import { clearHypixelCaches, getUuid } from "./hypixelApi";

async function main() {
  let calls = 0;
  const original = globalThis.fetch;

  // 1. Zwei gleichzeitige Abfragen desselben Namens: nur EINE Anfrage an Mojang
  globalThis.fetch = (async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return new Response(JSON.stringify({ id: "0".repeat(31) + "1", name: "Quantussy" }), {
      status: 200,
    });
  }) as typeof fetch;

  clearHypixelCaches();
  const [first, second] = await Promise.all([getUuid("Quantussy"), getUuid("quantussy")]);
  assert.equal(calls, 1, "gleichzeitige Abfragen muessen zusammengelegt werden");
  assert.deepEqual(first, second);

  // Danach kommt das Ergebnis aus dem Zwischenspeicher
  await getUuid("Quantussy");
  assert.equal(calls, 1);

  // 2. Mojang antwortet 429: verstaendliche Meldung, Status 429
  globalThis.fetch = (async () => new Response(null, { status: 429 })) as typeof fetch;
  clearHypixelCaches();
  await assert.rejects(
    () => getUuid("Someone"),
    (error: unknown) =>
      error instanceof UserError && error.status === 429 && /limiting requests/.test(error.message),
  );

  // 3. Nach einem Fehler ist die Anfrage nicht "haengengeblieben": neuer Versuch geht
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ id: "0".repeat(31) + "2", name: "Someone" }), {
      status: 200,
    })) as typeof fetch;
  assert.equal((await getUuid("Someone")).uuid, "0".repeat(31) + "2");

  globalThis.fetch = original;
  console.log("requestSharing: ok");
}

main();
