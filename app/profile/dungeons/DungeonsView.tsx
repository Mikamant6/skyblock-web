"use client";
// Seite "Dungeons": Catacombs-XP, Klassen-XP und Abschluesse pro Floor.
import Panel from "../../Panel.module.css";
import { formatCoins } from "../../format";
import ExtrasGate from "../extras/Status";
import styles from "../extras/Extras.module.css";

export default function DungeonsView() {
  return (
    <ExtrasGate>
      {({ dungeons: d }) => {
        const floors = Math.max(d.completions.length, d.masterCompletions.length);
        const rows = Array.from({ length: floors }, (_, i) => i);
        return (
          <>
            <h2 className={styles.heading}>Dungeons</h2>
            <div className={`${Panel.panel} ${styles.summary}`}>
              <div className={styles.stat}>
                <span>Catacombs XP</span>
                <strong>{formatCoins(Math.floor(d.catacombsExp))}</strong>
              </div>
              <div className={styles.stat}>
                <span>Master mode XP</span>
                <strong>{formatCoins(Math.floor(d.masterExp))}</strong>
              </div>
              <div className={styles.stat}>
                <span>Selected class</span>
                <strong>{d.selectedClass ?? "-"}</strong>
              </div>
            </div>

            {d.classes.length > 0 && (
              <>
                <h3>Classes</h3>
                <ul className={styles.grid}>
                  {d.classes.map((c) => (
                    <li key={c.name} className={`${Panel.panel} ${styles.card}`}>
                      <strong>{c.name}</strong>
                      <small>{formatCoins(Math.floor(c.exp))} XP</small>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {floors > 0 && (
              <>
                <h3>Completions per floor</h3>
                <div className={Panel.panel}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Floor</th>
                        <th>Normal</th>
                        <th>Master</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((i) => (
                        <tr key={i}>
                          <td>{i === 0 ? "Entrance" : `Floor ${i}`}</td>
                          <td>{formatCoins(d.completions[i] ?? 0)}</td>
                          <td>{i === 0 ? "-" : formatCoins(d.masterCompletions[i] ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <p className={styles.note}>
              Catacombs and class levels are not shown yet: the XP tables are not verified.
            </p>
          </>
        );
      }}
    </ExtrasGate>
  );
}
