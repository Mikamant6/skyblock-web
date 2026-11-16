"use client";
// Seite "Pets": alle Pets mit Bild, Seltenheit, XP, getragenem Item und, wenn
// data/petInfo.json gefuellt ist (scripts/fetchPetAssets.ts), den Faehigkeiten
// aus der Wiki wie im Spiel. Aktives Pet zuerst.
import petInfoJson from "../../../data/petInfo.json";
import { parseTooltip } from "../../../lib/minecraftText";
import { petKey } from "../../../lib/petWikiParser";
import Panel from "../../Panel.module.css";
import { formatCoins } from "../../format";
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

export default function PetsView() {
  return (
    <ExtrasGate>
      {({ pets }) => (
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
          </div>
          {pets.length === 0 ? (
            <p>No pet data found.</p>
          ) : (
            <ul className={styles.petGrid}>
              {pets.map((p, i) => {
                const info = petInfo.get(petKey(p.type));
                return (
                  <li key={`${p.type}-${i}`} className={`${Panel.panel} ${styles.petCard} ${p.active ? styles.active : ""}`}>
                    <PetIcon type={p.type} name={p.name} />
                    <div className={styles.petText}>
                      <strong>{p.name}</strong>
                      <span className={styles.badge}>{p.active ? `${p.rarity} · active` : p.rarity}</span>
                      <small>{formatCoins(Math.floor(p.exp))} XP</small>
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
      )}
    </ExtrasGate>
  );
}
