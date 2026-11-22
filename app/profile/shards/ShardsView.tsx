"use client";
// Unterseite "Shards": Wert aller syphonierten Shards (der bisherige Shard-Rechner).

import type { ShardNetworthResponse } from "../../../lib/shardService";
import styles from "../../calculator.module.css";
import { formatCoins, formatCompact } from "../../format";
import ShardTable from "../../ShardTable";
import { useProfile } from "../ProfileProvider";

export default function ShardsView() {
  const { shards } = useProfile();

  return (
    <>
      {/* aria-live: Screenreader lesen Aenderungen in diesem Bereich vor */}
      <div aria-live="polite">
        {shards.status === "idle" && (
          <div className={styles.notice} role="note">
            Enter a Minecraft name and a profile name above and press Calculate.
          </div>
        )}
        {shards.status === "loading" && (
          <div className={styles.notice} role="status">
            Calculating shards...
          </div>
        )}
        {shards.status === "error" && (
          <div className={styles.error} role="alert">
            {shards.message}
          </div>
        )}
        {shards.status === "done" && <ShardResult data={shards.data} />}
      </div>

      <details className={styles.details}>
        <summary>How is this calculated?</summary>
        <p>
          Every shard you have syphoned counts, including partial progress to the
          next level. Shards used up in fusions do not count.
        </p>
        <p>
          For each shard type, up to a daily limit (one seventh of the instant buys
          over the last 7 days) the lowest sell offer price is used. The rest is
          valued at the instant-sell price. The 1.25% Bazaar tax is shown
          separately. Shards without a Bazaar price count as 0.
        </p>
        <p>
          Syphoned shards cannot be sold, of course: they have already been used
          up for your attribute levels. The value shows what the same shards
          would cost on the Bazaar today, as a measure of your progress.
        </p>
        <p>
          The result is a market estimate, not a real payout: prices change
          constantly, and buying this many shards would move the market.
        </p>
      </details>
    </>
  );
}

// Anzeige des Ergebnisses: Kennzahlen, Hinweise und Tabelle
function ShardResult({ data }: { data: ShardNetworthResponse }) {
  const { totals } = data;
  const unpriced = data.shards.filter((row) => row.unitsUnpriced > 0);
  const taxPercent = (data.taxRate * 100).toFixed(2);

  return (
    <section>
      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total value</span>
          <strong className={styles.cardValue} title={formatCoins(totals.valueRaw)}>
            {formatCompact(totals.valueRaw)}
          </strong>
          <span className={styles.cardHint}>before Bazaar tax</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>After tax</span>
          <strong className={styles.cardValue} title={formatCoins(totals.valueAfterTax)}>
            {formatCompact(totals.valueAfterTax)}
          </strong>
          <span className={styles.cardHint}>after {taxPercent}% Bazaar tax</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Shards</span>
          <strong className={styles.cardValue}>{formatCoins(totals.shardCount)}</strong>
          <span className={styles.cardHint}>{formatCoins(totals.pieces)} pieces</span>
        </div>
      </div>

      {data.unmatched.length > 0 && (
        <div className={styles.warning} role="note">
          <strong>Unknown attributes (not included in the value):</strong>{" "}
          {data.unmatched
            .map((item) => `${item.attributeId} (${formatCoins(item.shardsSyphoned)})`)
            .join(", ")}
          . The total above is therefore a lower bound. Please report these so
          they can be added.
        </div>
      )}

      {unpriced.length > 0 && (
        <div className={styles.notice} role="note">
          <strong>No Bazaar price (counted as 0):</strong>{" "}
          {unpriced
            .map((row) => `${row.shardName} (${formatCoins(row.unitsUnpriced)})`)
            .join(", ")}
          . Some shards cannot be traded on the Bazaar.
        </div>
      )}

      {/* Tabelle in derselben Box (Hintergrund + Rand) wie der "Shard breakdown" im Overview */}
      <div className={styles.details} style={{ marginTop: 16 }}>
        <ShardTable shards={data.shards} totalValue={totals.valueRaw} />
      </div>
    </section>
  );
}
