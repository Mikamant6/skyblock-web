"use client";
// Seite "Minions": welche Minions hergestellt wurden und bis zu welcher Stufe.
import { useState } from "react";
import Panel from "../../Panel.module.css";
import { formatCoins } from "../../format";
import ExtrasGate from "../extras/Status";
import styles from "../extras/Extras.module.css";

export default function MinionsView() {
  const [query, setQuery] = useState("");
  return (
    <ExtrasGate>
      {({ minions }) => {
        const shown = minions.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()));
        const totalTiers = minions.reduce((sum, m) => sum + m.craftedTiers, 0);
        return (
          <>
            <h2 className={styles.heading}>Minions</h2>
            <div className={`${Panel.panel} ${styles.summary}`}>
              <div className={styles.stat}>
                <span>Minion types crafted</span>
                <strong>{formatCoins(minions.length)}</strong>
              </div>
              <div className={styles.stat}>
                <span>Unique tiers crafted</span>
                <strong>{formatCoins(totalTiers)}</strong>
              </div>
            </div>
            <input
              className={styles.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search minions"
              aria-label="Search minions"
            />
            {minions.length === 0 ? (
              <p>No minion data found. It may be hidden by the API settings of this profile.</p>
            ) : (
              <ul className={styles.grid}>
                {shown.map((m) => (
                  <li key={m.key} className={`${Panel.panel} ${styles.card}`}>
                    <strong>{m.name}</strong>
                    <small>
                      Highest tier {m.highestTier} · {m.craftedTiers} tiers crafted
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      }}
    </ExtrasGate>
  );
}
