"use client";
// Der Shard-Rechner im Browser: Eingabeformular, Abfrage an unseren Server
// (/api/shards) und Anzeige des Ergebnisses.
// "use client" heisst: dieser Code laeuft im Browser des Besuchers.

import { useState, type FormEvent } from "react";
import type { ShardNetworthResponse } from "../lib/shardService";
import styles from "./calculator.module.css";
import { formatCoins, formatCompact } from "./format";
import ShardTable from "./ShardTable";

// Hier spaeter den Link zum Reddit-Thread eintragen. Solange der Text leer
// ist, wird kein Link angezeigt.
const FEEDBACK_URL = "";

// Die Seite ist immer in genau einem dieser vier Zustaende
type ViewState =
  | { status: "idle" } // noch nichts abgefragt
  | { status: "loading" } // Anfrage laeuft
  | { status: "error"; message: string } // etwas ist schiefgegangen
  | { status: "done"; data: ShardNetworthResponse }; // Ergebnis liegt vor

export default function ShardCalculator() {
  const [playerName, setPlayerName] = useState("");
  const [profileName, setProfileName] = useState("");
  const [view, setView] = useState<ViewState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Ohne das wuerde der Browser die ganze Seite neu laden
    event.preventDefault();
    if (view.status === "loading") return;

    setView({ status: "loading" });
    try {
      const query = new URLSearchParams({
        name: playerName.trim(),
        profile: profileName.trim(),
      });
      const response = await fetch(`/api/shards?${query.toString()}`);
      const body = await response.json();

      if (!response.ok) {
        // Unser Server schickt bei Fehlern { error: "Text" }
        setView({
          status: "error",
          message: typeof body.error === "string" ? body.error : "Something went wrong.",
        });
        return;
      }
      setView({ status: "done", data: body as ShardNetworthResponse });
    } catch {
      setView({
        status: "error",
        message: "Could not reach the server. Please check your connection and try again.",
      });
    }
  }

  const loading = view.status === "loading";

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          SkyBlock Shard Calculator <span className={styles.beta}>Beta</span>
        </h1>
        <p className={styles.subtitle}>
          Estimates the Bazaar value of all shards you have syphoned, including
          partial progress to the next level.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="player">Minecraft name</label>
          <input
            id="player"
            className={styles.input}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. Quantussy"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="profile">Profile name</label>
          <input
            id="profile"
            className={styles.input}
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. Blueberry"
            required
          />
        </div>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </form>

      {/* aria-live: Screenreader lesen Aenderungen in diesem Bereich vor */}
      <div aria-live="polite">
        {view.status === "error" && (
          <div className={styles.error} role="alert">
            {view.message}
          </div>
        )}
        {view.status === "done" && <Result data={view.data} />}
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

      <footer className={styles.footer}>
        <p>
          {FEEDBACK_URL !== "" ? (
            <>
              Found a mistake or a missing shard?{" "}
              <a href={FEEDBACK_URL}>Tell us in the feedback thread.</a>
            </>
          ) : (
            "Found a mistake or a missing shard? Please tell us in the feedback thread."
          )}
        </p>
        <p>
          Beta: values may be wrong, especially for shards that were added
          recently. Not affiliated with or endorsed by Hypixel or Mojang. Prices
          and profile data come from the Hypixel API. Shard data is partly based
          on the Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0).
        </p>
      </footer>
    </div>
  );
}

// Anzeige des Ergebnisses: Kennzahlen, Hinweise und Tabelle
function Result({ data }: { data: ShardNetworthResponse }) {
  const { totals } = data;
  const unpriced = data.shards.filter((row) => row.unitsUnpriced > 0);
  const taxPercent = (data.taxRate * 100).toFixed(2);

  return (
    <section className={styles.result}>
      <h2 className={styles.sectionTitle}>
        {data.playerName} <span className={styles.muted}>on {data.profileName}</span>
      </h2>

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
          . The total above is therefore a lower bound. Please report these in the
          feedback thread so they can be added.
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

      <ShardTable shards={data.shards} totalValue={totals.valueRaw} />
    </section>
  );
}
