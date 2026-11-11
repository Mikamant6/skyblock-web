"use client";
// Die Tabelle mit allen Shards: sortierbar, durchsuchbar, zunaechst nur die obersten Zeilen.

import { useState } from "react";
import type { ShardRow } from "../lib/shardNetworth";
import styles from "./calculator.module.css";
import { formatCoins, formatPercent } from "./format";

type SortKey = "value" | "name" | "level" | "pieces";

const INITIAL_ROWS = 25;

type Props = {
  shards: ShardRow[];
  totalValue: number; // fuer die Spalte "Share"
};

export default function ShardTable({ shards, totalValue }: Props) {
  // "State" = Werte, die sich der Bildschirm merkt. Aendert sich ein Wert,
  // zeichnet React die Tabelle automatisch neu.
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [descending, setDescending] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Klick auf eine Spaltenueberschrift: gleiche Spalte = Richtung umdrehen,
  // andere Spalte = danach sortieren (Namen aufsteigend, Zahlen absteigend)
  function clickHeader(key: SortKey) {
    if (key === sortKey) {
      setDescending(!descending);
    } else {
      setSortKey(key);
      setDescending(key !== "name");
    }
  }

  function arrow(key: SortKey): string {
    if (key !== sortKey) return "";
    return descending ? " ▼" : " ▲";
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (key !== sortKey) return "none";
    return descending ? "descending" : "ascending";
  }

  // 1. nach Suchtext filtern, 2. sortieren, 3. ggf. auf die obersten Zeilen kuerzen
  const needle = search.trim().toLowerCase();
  const filtered = shards.filter((row) =>
    row.shardName.toLowerCase().includes(needle),
  );
  const sorted = [...filtered].sort((a, b) => {
    let result: number;
    if (sortKey === "name") result = a.shardName.localeCompare(b.shardName);
    else if (sortKey === "level") result = a.level - b.level;
    else if (sortKey === "pieces") result = a.shardsSyphoned - b.shardsSyphoned;
    else result = a.valueRaw - b.valueRaw;
    return descending ? -result : result;
  });
  const searching = needle !== "";
  const visible = showAll || searching ? sorted : sorted.slice(0, INITIAL_ROWS);

  return (
    <section>
      <div className={styles.toolbar}>
        <h2 className={styles.sectionTitle}>All shards</h2>
        <input
          className={styles.input}
          type="search"
          placeholder="Search shard..."
          aria-label="Search shards by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-sort={ariaSort("name")}>
                <button className={styles.sortButton} onClick={() => clickHeader("name")}>
                  Shard{arrow("name")}
                </button>
              </th>
              <th>Rarity</th>
              <th className={styles.num} aria-sort={ariaSort("level")}>
                <button className={styles.sortButton} onClick={() => clickHeader("level")}>
                  Level{arrow("level")}
                </button>
              </th>
              <th className={styles.num} aria-sort={ariaSort("pieces")}>
                <button className={styles.sortButton} onClick={() => clickHeader("pieces")}>
                  Pieces{arrow("pieces")}
                </button>
              </th>
              <th className={styles.num} aria-sort={ariaSort("value")}>
                <button className={styles.sortButton} onClick={() => clickHeader("value")}>
                  Value{arrow("value")}
                </button>
              </th>
              <th className={styles.num}>Share</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              // "key" hilft React, die Zeilen auseinanderzuhalten
              <tr key={row.attributeId}>
                <td>{row.shardName}</td>
                <td>
                  <span className={styles.rarity} data-rarity={row.rarity}>
                    {row.rarity}
                  </span>
                </td>
                <td className={styles.num}>{row.level}</td>
                <td className={styles.num}>{formatCoins(row.shardsSyphoned)}</td>
                <td className={styles.num}>
                  {row.valueRaw > 0 ? formatCoins(row.valueRaw) : "-"}
                  {row.unitsUnpriced > 0 && (
                    <span className={styles.muted}> ({row.unitsUnpriced} unpriced)</span>
                  )}
                </td>
                <td className={styles.num}>{formatPercent(row.valueRaw, totalValue)}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.muted}>
                  No shard matches your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!searching && sorted.length > INITIAL_ROWS && (
        <button className={styles.linkButton} onClick={() => setShowAll(!showAll)}>
          {showAll ? `Show only the top ${INITIAL_ROWS}` : `Show all ${sorted.length} shards`}
        </button>
      )}
    </section>
  );
}
