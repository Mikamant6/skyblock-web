"use client";
// Foraging > Jade Dragon: welche Attribute Shards sind am billigsten auf Level 10 zu bringen?
// Das Jade-Dragon-Pet bekommt +0,1 % Sweep pro maximiertem Attribut (Fertigkeit "Apex Predator"),
// jedes maximierte Attribut zaehlt gleich viel: die billigsten zuerst maximieren ist der beste Wert.
// Preis: Instant Buy (niedrigstes Verkaufsangebot im Bazaar).

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ShardMaxCostResponse } from "../../../lib/shardMaxCostService";
import { getSkillExtras } from "../../../lib/skillExtras";
import { getSkillMeta } from "../../../lib/skillMeta";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";
import skillStyles from "./SkillDetail.module.css";
import styles from "./JadeDragonView.module.css";
import SkillSubTabs from "./SkillSubTabs";

type Loaded = { key: string; result: { ok: true; data: ShardMaxCostResponse } | { ok: false; message: string } };

const RARITY_COLOR: Record<string, string> = {
  common: "#d4d4d8",
  uncommon: "#55ff55",
  rare: "#5555ff",
  epic: "#aa00aa",
  legendary: "#ffaa00",
};
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

const price = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

// Letzte Antwort pro Profil: beim Zurueckwechseln erscheint sie sofort
const lastLoaded = new Map<string, Loaded>();

export default function JadeDragonView() {
  const { subject } = useProfile();
  const color = getSkillMeta("FORAGING").color;
  const playerName = subject?.playerName;
  const profileName = subject?.profileName;
  const wanted = playerName === undefined || profileName === undefined ? null : `${playerName}|${profileName}`;
  const [loaded, setLoaded] = useState<Loaded | null>(() => (wanted === null ? null : (lastLoaded.get(wanted) ?? null)));

  useEffect(() => {
    if (playerName === undefined || profileName === undefined || wanted === null) return;
    let cancelled = false;
    void fetchApi<ShardMaxCostResponse>("/api/shard-costs", new URLSearchParams({ name: playerName, profile: profileName })).then((result) => {
      if (cancelled) return;
      const next: Loaded = { key: wanted, result };
      if (result.ok) lastLoaded.set(wanted, next);
      setLoaded(next);
    });
    return () => {
      cancelled = true;
    };
  }, [playerName, profileName, wanted]);

  if (subject === null) {
    return (
      <div className={calc.notice} role="note">
        Enter a Minecraft name and a profile name and press Calculate.
      </div>
    );
  }

  return (
    <div style={{ "--skill-color": color } as CSSProperties}>
      <h2 className={`${skillStyles.heading} ${skillStyles.headingCompact}`}>
        <span className={skillStyles.dot} aria-hidden="true" />
        Foraging
      </h2>
      <SkillSubTabs skillKey="FORAGING" hasCollections={true} extras={getSkillExtras("FORAGING")} />
      {loaded === null || loaded.key !== wanted ? (
        <div className={calc.notice} role="status">
          Loading shard prices...
        </div>
      ) : !loaded.result.ok ? (
        <div className={calc.error} role="alert">
          {loaded.result.message}
        </div>
      ) : (
        <Content data={loaded.result.data} />
      )}
    </div>
  );
}

function Content({ data }: { data: ShardMaxCostResponse }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [hideMaxed, setHideMaxed] = useState(true);

  const needle = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      data.rows.filter(
        (row) =>
          (!hideMaxed || !row.maxed) && (rarity === "all" || row.rarity === rarity) && row.shardName.toLowerCase().includes(needle),
      ),
    [data.rows, hideMaxed, rarity, needle],
  );
  const open = data.rows.filter((row) => !row.maxed && row.cost !== null);
  const cheapest = open.length > 0 ? open[0] : null;

  return (
    <>
      <div className={`${Panel.panel} ${styles.intro}`}>
        {/* Links: Pet-Bild (public/pets/jadedragon.png) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.petImage} src="/pets/jadedragon.png" alt="Jade Dragon" width={96} height={96} />
        {/* Mitte: Erklaerung und Zahlen */}
        <div className={styles.introText}>
        <h3>Jade Dragon: Apex Predator</h3>
        <p>
          The Jade Dragon pet increases your total Sweep by 0.1% for every maxed out attribute you have unlocked. Every maxed
          shard counts the same, so the cheapest shards to max give the best value. Prices below are the Instant Buy price
          (lowest sell offer in the Bazaar).
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Maxed attributes</span>
            <strong>
              {data.maxedCount} / {data.totalCount}
            </strong>
          </div>
          <div className={styles.stat}>
            <span>Sweep from Apex Predator</span>
            <strong>+{(data.maxedCount * 0.1).toFixed(1)}%</strong>
          </div>
          {cheapest !== null && (
            <div className={styles.stat}>
              <span>Cheapest next</span>
              <strong>
                {cheapest.shardName} ({formatCoins(cheapest.cost ?? 0)})
              </strong>
            </div>
          )}
        </div>
        </div>
      <div className={styles.introControls}>
        <input className={styles.input} type="search" placeholder="Search shards" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className={styles.select} value={rarity} onChange={(e) => setRarity(e.target.value)} aria-label="Filter by rarity">
          <option value="all">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <label className={styles.toggle}>
          <input type="checkbox" checked={hideMaxed} onChange={(e) => setHideMaxed(e.target.checked)} />
          Hide already maxed
        </label>
      </div>
      </div>

      <div className={`${Panel.panel} ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.num}>#</th>
              <th>Shard</th>
              <th>Rarity</th>
              <th className={styles.num}>Level</th>
              <th className={styles.num}>Owned</th>
              <th className={styles.num}>Still needed</th>
              <th className={styles.num}>Price each</th>
              <th className={styles.num}>Cost to max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.productId} data-state={row.maxed ? "maxed" : undefined}>
                <td className={`${styles.num} ${styles.muted}`}>{index + 1}</td>
                <td>{row.shardName}</td>
                <td className={styles.rarity} style={{ color: RARITY_COLOR[row.rarity] }}>
                  {row.rarity.charAt(0).toUpperCase() + row.rarity.slice(1)}
                </td>
                <td className={styles.num}>{row.level} / 10</td>
                <td className={styles.num}>{formatCoins(row.owned)}</td>
                <td className={styles.num}>{row.maxed ? "-" : formatCoins(row.remaining)}</td>
                <td className={styles.num}>{row.unitPrice === null ? "-" : price.format(row.unitPrice)}</td>
                <td className={styles.num}>
                  {row.maxed ? "Maxed" : row.cost === null ? <span className={styles.muted}>no price</span> : formatCoins(row.cost)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>No shard matches.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>
        Cost to max = shards still missing for level 10 × Instant Buy price. For very large amounts the real price rises a little
        because cheaper offers run out. Shards without a Bazaar price (not tradable or unknown) are listed last. Shard data from the
        Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0).
      </p>
    </>
  );
}
