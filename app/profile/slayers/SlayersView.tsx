"use client";
// Seite "Slayers": ein Feld pro Slayer mit Level, Fortschritt zum naechsten Level
// und Boss-Kills pro Tier. Oben die Summen.

import type { CSSProperties } from "react";
import { SLAYER_TYPES } from "../../../lib/slayerTables";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { useProfile } from "../ProfileProvider";
import styles from "./SlayersView.module.css";

const ROMAN = ["I", "II", "III", "IV", "V"];

export default function SlayersView() {
  const { slayers } = useProfile();

  return (
    <>
      <div aria-live="polite">
        {slayers.status === "idle" && (
          <div className={calc.notice} role="note">
            Enter a Minecraft name and a profile name and press Calculate.
          </div>
        )}
        {slayers.status === "loading" && (
          <div className={calc.notice} role="status">
            Loading slayers...
          </div>
        )}
        {slayers.status === "error" && (
          <div className={calc.error} role="alert">
            {slayers.message}
          </div>
        )}
      </div>

      {slayers.status === "done" && (
        <>
          <h2 className={styles.heading}>Slayers</h2>

          <div className={`${Panel.panel} ${styles.summary}`}>
            <SummaryStat label="Total slayer XP" value={formatCoins(slayers.data.totalXp)} />
            <SummaryStat label="Bosses killed" value={formatCoins(slayers.data.totalKills)} />
            <SummaryStat
              label="Maxed slayers"
              value={`${slayers.data.slayers.filter((s) => s.xpForNextLevel === null).length} / ${slayers.data.slayers.length}`}
            />
          </div>

          <ul className={styles.grid}>
            {slayers.data.slayers.map((slayer) => (
              <li
                key={slayer.key}
                className={`${Panel.panel} ${styles.card}`}
                style={{ "--slayer-color": slayer.color } as CSSProperties}
              >
                <div className={styles.top}>
                  <div>
                    <div className={styles.name}>{slayer.name} Slayer</div>
                    <div className={styles.boss}>{slayer.boss}</div>
                  </div>
                  <div className={styles.level}>
                    Lv {slayer.level}
                    <small> / {slayer.maxLevel}</small>
                  </div>
                </div>

                <div
                  className={styles.bar}
                  role="progressbar"
                  aria-label={`${slayer.name} slayer progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(slayer.fraction * 100)}
                >
                  <div className={styles.barFill} style={{ width: `${slayer.fraction * 100}%` }} />
                </div>
                <span className={styles.detail}>
                  {slayer.xpForNextLevel === null
                    ? `Max level reached · ${formatCoins(slayer.xp)} XP`
                    : `${formatCoins(slayer.xp)} XP · ${formatCoins(slayer.xpForNextLevel - slayer.xpIntoLevel)} more for Lv ${slayer.level + 1}`}
                </span>

                {/* Boss-Kills pro Tier */}
                <div className={styles.kills} aria-label={`${slayer.boss} kills by tier`}>
                  {slayer.killsByTier.length === 0 ? (
                    <span className={styles.none}>No boss kills yet</span>
                  ) : (
                    slayer.killsByTier.map((count, tier) => (
                      <span key={tier} className={styles.kill}>
                        <small>T{ROMAN[tier] ?? tier + 1}</small>
                        <strong>{formatCoins(count)}</strong>
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>

          <details className={calc.details} style={{ marginTop: 12 }}>
            <summary>XP needed per level</summary>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Slayer</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                      <th key={level}>Lv {level}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLAYER_TYPES.map((type) => (
                    <tr key={type.key}>
                      <th scope="row">{type.name}</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
                        const entry = type.levels.find((l) => l.level === level);
                        return <td key={level}>{entry === undefined ? "-" : formatCoins(entry.totalExpRequired)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.footnote}>Total XP needed for each level. Source: SkyBlock Wiki.</p>
          </details>
        </>
      )}
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
