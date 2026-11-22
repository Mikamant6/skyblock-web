"use client";
// Seite "Pets": alle Pets mit Bild, Seltenheit, XP, getragenem Item und, wenn
// data/petInfo.json gefuellt ist (scripts/fetchPetAssets.ts), den Faehigkeiten
// aus der Wiki wie im Spiel. Aktives Pet zuerst.
import petInfoJson from "../../../data/petInfo.json";
import type { PetRow } from "../../../lib/extras";
import { parseTooltip } from "../../../lib/minecraftText";
import { petKey } from "../../../lib/petWikiParser";
import { SKILL_ORDER, petSkillFromTooltip, type SkillGroup } from "../../../lib/skillGroups";
import Panel from "../../Panel.module.css";
import { formatCoins } from "../../format";
import { useState } from "react";
import ExtrasGate from "../extras/Status";
import styles from "../extras/Extras.module.css";
import PetIcon from "./PetIcon";

type PetInfo = { key: string; name: string; title: string; tooltip: string; image: string };
const petInfo = new Map(((petInfoJson as { pets: PetInfo[] }).pets ?? []).map((p) => [p.key, p]));

// Tooltip-Zeilen wie im Spiel einfaerben; die Zeile "Right-click to add ..." und die Seltenheit lassen wir weg
function TooltipLines({ tooltip }: { tooltip: string }) {
  const lines = parseTooltip(tooltip).filter(
    (line) => !line.some((segment) => segment.text.includes("Right-click to add this pet")),
  );
  return (
    <div className={styles.tip}>
      {lines.map((line, i) =>
        line.length === 0 ? (
          <div key={i} className={styles.tipBlank} />
        ) : (
          <div key={i}>
            {line.map((segment, j) => (
              <span key={j} style={{ color: segment.color, fontWeight: segment.bold ? 700 : 400 }}>
                {segment.text}
              </span>
            ))}
          </div>
        ),
      )}
    </div>
  );
}

type PetEntry = PetRow & { owned: boolean }; // owned=false: Pet aus der Wiki-Liste, das man nicht hat

export default function PetsView() {
  return <ExtrasGate>{({ pets }) => <PetsContent pets={pets} />}</ExtrasGate>;
}

function PetsContent({ pets }: { pets: PetRow[] }) {
  const [sort, setSort] = useState<"default" | "xp" | "rarity" | "name">("default");
  const [skill, setSkill] = useState<SkillGroup | "all">("all");
  const [showMissing, setShowMissing] = useState(false);
  // Eigene Pets + (optional) alle Pets der Wiki-Liste, die man nicht hat
  const ownedKeys = new Set(pets.map((p) => petKey(p.type)));
  const missing: PetEntry[] = [...petInfo.values()]
    .filter((info) => !ownedKeys.has(info.key))
    .map((info) => ({ type: info.key, name: info.name, rarity: "", exp: 0, active: false, heldItem: null, owned: false }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const all: PetEntry[] = [...pets.map((p) => ({ ...p, owned: true })), ...(showMissing ? missing : [])];
  const skillOf = (p: PetEntry) => petSkillFromTooltip(petInfo.get(petKey(p.type))?.tooltip);
  const skillsPresent = SKILL_ORDER.filter((name) => all.some((p) => skillOf(p) === name));
  const RARITY_ORDER = ["MYTHIC", "LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];
  const rarityRank = (p: PetEntry) => (p.owned ? (RARITY_ORDER.includes(p.rarity) ? RARITY_ORDER.indexOf(p.rarity) : RARITY_ORDER.length) : RARITY_ORDER.length + 1);
  // 1. nach Skill filtern, 2. sortieren ("default" = Reihenfolge der Liste, aktives Pet zuerst, fehlende ganz unten)
  const filtered = skill === "all" ? all : all.filter((p) => skillOf(p) === skill);
  const sorted = [...filtered];
  if (sort === "xp") sorted.sort((a, b) => b.exp - a.exp);
  else if (sort === "rarity") sorted.sort((a, b) => rarityRank(a) - rarityRank(b) || b.exp - a.exp);
  else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  return (
        <>
          <h2 className={styles.heading}>Pets</h2>
          <div className={`${Panel.panel} ${styles.summary}`}>
            <div className={styles.stat}>
              <span>Pets</span>
              <strong>{formatCoins(pets.length)}</strong>
            </div>
            <div className={styles.stat}>
              <span>Legendary or better</span>
              <strong>{pets.filter((p) => p.rarity === "LEGENDARY" || p.rarity === "MYTHIC").length}</strong>
            </div>
            <div className={styles.summaryControls}>
              <select className={styles.sortSelect} value={skill} onChange={(e) => setSkill(e.target.value as SkillGroup | "all")} aria-label="Filter pets by skill">
                <option value="all">All skills</option>
                {skillsPresent.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort pets">
                <option value="default">Sort: Default (active first)</option>
                <option value="xp">Sort: Highest XP</option>
                <option value="rarity">Sort: Rarity</option>
                <option value="name">Sort: Name</option>
              </select>
              <label className={styles.toggle}>
                <input type="checkbox" checked={showMissing} onChange={(e) => setShowMissing(e.target.checked)} />
                Also show pets I don&apos;t have
              </label>
            </div>
          </div>
          {pets.length === 0 ? (
            <p>No pet data found.</p>
          ) : sorted.length === 0 ? (
            <p>No pet matches.</p>
          ) : (
            <ul className={styles.petGrid}>
              {sorted.map((p, i) => {
                const info = petInfo.get(petKey(p.type));
                return (
                  <li key={`${p.type}-${i}`} className={`${Panel.panel} ${styles.petCard} ${p.active ? styles.active : ""} ${p.owned ? "" : styles.petMissing}`}>
                    <PetIcon type={p.type} name={p.name} />
                    <div className={styles.petText}>
                      <strong>{p.name}</strong>
                      <span className={styles.badge}>{!p.owned ? "Not owned" : p.active ? `${p.rarity} · active` : p.rarity}</span>
                      {p.owned && <small>{formatCoins(Math.floor(p.exp))} XP</small>}
                      {p.heldItem !== null && <small>Holding: {p.heldItem}</small>}
                      {info !== undefined && (
                        <details className={styles.petDetails}>
                          <summary>Abilities</summary>
                          <TooltipLines tooltip={info.tooltip} />
                        </details>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.note}>
            Abilities and stats come from the Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0) and show the range from level 1 to
            100. Pet levels are not shown yet: the XP tables per rarity are not verified.
          </p>
        </>
  );
}
