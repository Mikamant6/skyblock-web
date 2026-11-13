"use client";
// Unterseite "Overview": Networth ohne Shards, Gesamtwert und Aufteilung.

import Link from "next/link";
import styles from "../calculator.module.css";
import NetworthSection from "../NetworthSection";
import ShardTable from "../ShardTable";
import { useProfile } from "./ProfileProvider";

export default function ProfileOverview() {
  const { networth, shards } = useProfile();

  return (
    <>
      <div aria-live="polite">
        {networth.status === "idle" && (
          <div className={styles.notice} role="note">
            Enter a Minecraft name and a profile name above and press Calculate.
          </div>
        )}
        {networth.status === "loading" && (
          <div className={styles.notice} role="status">
            Calculating networth... this can take a few seconds.
          </div>
        )}
        {networth.status === "error" && (
          <div className={styles.error} role="alert">
            {networth.message}
          </div>
        )}
        {networth.status === "done" && (
          <NetworthSection
            state={{ status: "done", data: networth.data }}
            shardValueRaw={shards.status === "done" ? shards.data.totals.valueRaw : null}
            shardNote={
              shards.status === "error"
                ? `Shard value is not available: ${shards.message}`
                : "Shard value is still being calculated..."
            }
          />
        )}
      </div>

      {/* Aufklappbare Shard-Tabelle, gleiche Form wie "Networth breakdown" */}
      {shards.status === "done" && (
        <details className={styles.details} style={{ marginTop: 12 }}>
          <summary>Shard breakdown</summary>
          <ShardTable shards={shards.data.shards} totalValue={shards.data.totals.valueRaw} />
        </details>
      )}

      {networth.status === "done" && (
        <p>
          <Link className={styles.linkButton} href="/profile/shards">
            See all shards in detail →
          </Link>
        </p>
      )}

      <details className={styles.details}>
        <summary>How is the networth calculated?</summary>
        <p>
          The networth is calculated with the open-source library
          SkyHelper-Networth, which values items, pets, purse, bank and more
          using its own price list. The museum is not included yet.
        </p>
        <p>
          Shards are valued separately (see the Shards page). The total adds the
          networth and the shard value before Bazaar tax.
        </p>
      </details>
    </>
  );
}
