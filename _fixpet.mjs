// Einmalig: laedt das richtige Flying-Fish-Bild von der Wiki nach public/pets/flyingfish.png
import { writeFile, readFile } from "node:fs/promises";
const WIKI = "https://hypixelskyblock.minecraft.wiki";
const UA = "flawlesssb-asset-fetch/1.0 (hobby project, one-time fix of one pet icon)";
const candidates = ["/images/Flying_Fish_Pet.png", "/w/Special:FilePath/Flying_Fish_Pet.png"];
const log = [];
for (const c of candidates) {
  try {
    const r = await fetch(WIKI + c, { headers: { "User-Agent": UA }, redirect: "follow" });
    const b = Buffer.from(await r.arrayBuffer());
    const ok = r.ok && b.length > 100 && b.readUInt32BE(0) === 0x89504e47;
    log.push(`${c} -> HTTP ${r.status}, ${b.length} bytes, png=${ok}`);
    if (ok) { await writeFile("public/pets/flyingfish.png", b); log.push("GESCHRIEBEN: public/pets/flyingfish.png"); break; }
  } catch (e) { log.push(`${c} -> Fehler ${String(e)}`); }
}
await writeFile("_fixpet.log", log.join("\n") + "\n");
