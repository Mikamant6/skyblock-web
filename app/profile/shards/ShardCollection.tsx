"use client";
// Unterseite "Collection": ein Feld pro Shard mit Bild und Namen. Beim
// Ueberfahren erscheint der Ingame-Tooltip. Besessene Shards sind hervorgehoben,
// die anderen blass.

import { useId, useMemo, useState } from "react";
import shardLevels from "../../../data/shardLevels.json";
import { shardEntries, type ShardEntry } from "../../../lib/shardInfo";
import { getShardProgress } from "../../../lib/shardProgress";
import type { ShardRow } from "../../../lib/shardNetworth";
import Panel from "../../Panel.module.css";
import ShardTooltip from "../../ShardTooltip";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { useProfile } from "../ProfileProvider";
import styles from "./ShardCollection.module.css";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;

type Status = "all" | "owned" | "missing";
type Sort = "default" | "name" | "level" | "next";

export default function ShardCollection() {
  const { shards } = useProfile();
  const tooltipId = useId();

  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState<string>("all");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("default");
  const [hover, setHover] = useState<{ entry: ShardEntry; rect: DOMRect } | null>(null);

  // Besessene Shards nach (Wiki-)attributeId nachschlagbar machen. Die API nennt einige Attribute anders
  // als das Wiki (z. B. "spirit_axe" statt "woodland_ruler"), deshalb wird ueber die Shard-ID zugeordnet.
  const owned = useMemo(() => {
    const map = new Map<string, ShardRow>();
    if (shards.status === "done") {
      const wikiIdByProduct = new Map(shardEntries.map((entry) => [entry.productId, entry.attributeId]));
      for (const row of shards.data.shards) {
        map.set(wikiIdByProduct.get(row.productId) ?? row.attributeId, row);
      }
    }
    return map;
  }, [shards]);

  // Fortschritt je besessenem Shard (Level, Rest bis zum naechsten Level)
  const progressById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getShardProgress>>();
    for (const entry of shardEntries) {
      const row = owned.get(entry.attributeId);
      if (row !== undefined) {
        map.set(entry.attributeId, getShardProgress(entry.rarity, row.shardsSyphoned, shardLevels));
      }
    }
    return map;
  }, [owned]);

  const needle = search.trim().toLowerCase();
  const visible = shardEntries
    .filter((entry) => {
      if (rarity !== "all" && entry.rarity !== rarity) return false;
      const isOwned = owned.has(entry.attributeId);
      if (status === "owned" && !isOwned) return false;
      if (status === "missing" && isOwned) return false;
      if (needle === "") return true;
      return (
        entry.shardName.toLowerCase().includes(needle) ||
        entry.attributeName.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => compareEntries(sort, a, b, progressById));

  const ownedCount = owned.size;
  const maxedCount = [...progressById.values()].filter((p) => p.remaining === null).length;
  const total = shardEntries.length;
  const percent = total === 0 ? 0 : (ownedCount / total) * 100;

  function show(entry: ShardEntry, element: HTMLElement) {
    setHover({ entry, rect: element.getBoundingClientRect() });
  }

  return (
    <>
      <div aria-live="polite">
        {shards.status === "loading" && (
          <div className={calc.notice} role="status">
            Calculating shards...
          </div>
        )}
        {shards.status === "error" && (
          <div className={calc.warning} role="note">
            Your shards could not be loaded: {shards.message} All shards are
            shown as not owned.
          </div>
        )}
      </div>

      <h2 className={styles.heading}>Shards &amp; attributes</h2>

      <div className={`${Panel.panel} ${styles.summary}`}>
        <dl className={styles.numbers}>
          <SummaryStat label="Unlocked" value={`${formatCoins(ownedCount)} / ${formatCoins(total)}`} />
          <SummaryStat label="Maxed" value={formatCoins(maxedCount)} />
          <SummaryStat label="Missing" value={formatCoins(total - ownedCount)} />
        </dl>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label="Shards owned"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={ownedCount}
        >
          <div className={styles.barFill} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className={`${Panel.panel} ${styles.filters}`}>
        <label className={styles.field}>
          <span>Find a shard</span>
          <input
            className={calc.input}
            type="search"
            placeholder="Shard name or attribute..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Status</span>
          <select className={calc.input} value={status} onChange={(event) => setStatus(event.target.value as Status)}>
            <option value="all">All shards</option>
            <option value="owned">Owned</option>
            <option value="missing">Not owned</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Rarity</span>
          <select className={calc.input} value={rarity} onChange={(event) => setRarity(event.target.value)}>
            <option value="all">Any rarity</option>
            {RARITIES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Sort</span>
          <select className={calc.input} value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="default">Default order</option>
            <option value="name">Name (A–Z)</option>
            <option value="level">Highest level</option>
            <option value="next">Closest to next level</option>
          </select>
        </label>
      </div>

      <p className={styles.count}>
        {formatCoins(visible.length)} / {formatCoins(total)} shards
      </p>

      <div className={Panel.panel}>
      <ul className={styles.grid}>
        {visible.map((entry) => {
          const row = owned.get(entry.attributeId);
          return (
            <li key={entry.attributeId}>
              <button
                type="button"
                className={styles.tile}
                data-rarity={entry.rarity}
                data-owned={row !== undefined}
                aria-describedby={hover?.entry.attributeId === entry.attributeId ? tooltipId : undefined}
                onMouseEnter={(event) => show(entry, event.currentTarget)}
                onMouseLeave={() => setHover(null)}
                onFocus={(event) => show(entry, event.currentTarget)}
                onBlur={() => setHover(null)}
              >
                {entry.image !== null ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.icon}
                    src={entry.image}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.placeholder} aria-hidden="true">
                    {entry.shardName.charAt(0)}
                  </span>
                )}
                <span className={styles.text}>
                  <span className={styles.name}>{entry.shardName}</span>
                  <span className={styles.attribute}>{entry.attributeName}</span>
                  <span className={styles.stats}>
                    {row === undefined ? (
                      <span>Not owned · 1 needed for Lv 1</span>
                    ) : (
                      <ProgressText row={row} rarity={entry.rarity} />
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && (
        <p className={calc.muted}>No shard matches your filter.</p>
      )}
      </div>

      {hover !== null && (
        <ShardTooltip
          id={tooltipId}
          entry={hover.entry}
          owned={owned.get(hover.entry.attributeId)}
          anchor={hover.rect}
        />
      )}
    </>
  );
}

// "Lv 4 · 17 owned" und darunter, wie viele bis zum naechsten Level fehlen
function ProgressText({ row, rarity }: { row: ShardRow; rarity: string }) {
  const progress = getShardProgress(rarity, row.shardsSyphoned, shardLevels);
  return (
    <>
      <span>
        <strong className={styles.level}>Lv {progress.level}</strong> ·{" "}
        {formatCoins(row.shardsSyphoned)} owned
      </span>
      <span className={styles.next}>
        {progress.remaining === null
          ? "Max level reached"
          : `${formatCoins(progress.remaining)} more for Lv ${progress.nextLevel}`}
      </span>
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.numberItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

type Progress = ReturnType<typeof getShardProgress>;

// Sortierung der Liste; "default" behaelt die Reihenfolge der Daten bei
function compareEntries(
  sort: Sort,
  a: ShardEntry,
  b: ShardEntry,
  progress: Map<string, Progress>,
): number {
  if (sort === "name") return a.shardName.localeCompare(b.shardName);
  const pa = progress.get(a.attributeId);
  const pb = progress.get(b.attributeId);
  if (sort === "level") {
    return (pb?.level ?? -1) - (pa?.level ?? -1);
  }
  if (sort === "next") {
    // besessen und noch nicht max: wenigste fehlende zuerst; danach Max, dann nicht besessen
    const rank = (p: Progress | undefined) =>
      p === undefined ? Infinity : p.remaining === null ? Number.MAX_SAFE_INTEGER : p.remaining;
    return rank(pa) - rank(pb) || 0;
  }
  return 0;
}
