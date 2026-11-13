// Anzeige des Networths: Gesamtwert (Networth + Shards), Networth ohne Shards
// und die Aufteilung nach Bereichen. Reine Darstellung: bekommt den Zustand
// der Abfrage und den Shard-Rohwert von aussen.
import type { NetworthResponse } from "../lib/networthService";
import { grandTotal } from "../lib/networthSummary";
import styles from "./calculator.module.css";
import { formatCoins, formatCompact, formatPercent } from "./format";

export type NetworthState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: NetworthResponse };

// "personal_vault" -> "Personal vault"
function categoryLabel(id: string): string {
  const text = id.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function NetworthSection({
  state,
  shardValueRaw,
  shardNote,
}: {
  state: NetworthState;
  // null = Shard-Wert nicht verfuegbar (laedt noch oder Fehler): dann zeigen
  // wir nur den Networth ohne Shards und den Hinweistext shardNote
  shardValueRaw: number | null;
  shardNote: string;
}) {
  if (state.status === "loading") {
    return (
      <div className={styles.notice} role="status">
        Calculating networth... this can take a few seconds.
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={styles.warning} role="note">
        <strong>Networth is not available:</strong> {state.message}
      </div>
    );
  }

  const { data } = state;
  const total =
    shardValueRaw === null ? null : grandTotal(data.networth, shardValueRaw);

  return (
    <>
      <div className={styles.cards}>
        {total !== null && (
          <div className={styles.card}>
            <span className={styles.cardLabel}>Total networth</span>
            <strong className={styles.cardValue} title={formatCoins(total)}>
              {formatCompact(total)}
            </strong>
            <span className={styles.cardHint}>networth + shard value</span>
          </div>
        )}
        <div className={styles.card}>
          <span className={styles.cardLabel}>Networth without shards</span>
          <strong
            className={styles.cardValue}
            title={formatCoins(data.networth)}
          >
            {formatCompact(data.networth)}
          </strong>
          <span className={styles.cardHint}>
            {formatCompact(data.unsoulboundNetworth)} unsoulbound
          </span>
        </div>
        {shardValueRaw !== null && (
          <div className={styles.card}>
            <span className={styles.cardLabel}>Shard value</span>
            <strong className={styles.cardValue} title={formatCoins(shardValueRaw)}>
              {formatCompact(shardValueRaw)}
            </strong>
            <span className={styles.cardHint}>before Bazaar tax</span>
          </div>
        )}
      </div>

      {shardValueRaw === null && (
        <div className={styles.notice} role="status">
          {shardNote}
        </div>
      )}

      {data.noInventory && (
        <div className={styles.warning} role="note">
          <strong>Inventory API is disabled for this profile.</strong> The
          networth is therefore a lower bound. Enable it in the in-game settings
          (API Settings) and try again.
        </div>
      )}

      <details className={styles.details}>
        <summary>Networth breakdown</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th className={styles.num}>Value</th>
                <th className={styles.num}>Share</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Purse</td>
                <td className={styles.num}>{formatCoins(data.purse)}</td>
                <td className={styles.num}>
                  {formatPercent(data.purse, data.networth)}
                </td>
              </tr>
              <tr>
                <td>Bank</td>
                <td className={styles.num}>{formatCoins(data.bank)}</td>
                <td className={styles.num}>
                  {formatPercent(data.bank, data.networth)}
                </td>
              </tr>
              {data.categories.map((category) => (
                <tr key={category.id}>
                  <td>{categoryLabel(category.id)}</td>
                  <td className={styles.num}>{formatCoins(category.total)}</td>
                  <td className={styles.num}>
                    {formatPercent(category.total, data.networth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
