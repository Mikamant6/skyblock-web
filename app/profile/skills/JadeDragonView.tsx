"use client";
// Foraging > Jade Dragon: welche Attribute Shards sind am billigsten auf Level 10 zu bringen?
// Das Jade-Dragon-Pet bekommt +0,1 % Sweep pro maximiertem Attribut (Fertigkeit "Apex Predator"),
// jedes maximierte Attribut zaehlt gleich viel: die billigsten zuerst maximieren ist der beste Wert.
// Preis: Instant Buy (niedrigstes Verkaufsangebot im Bazaar).

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ShardMaxCostResponse } from "../../../lib/shardMaxCostService";
import { attributeNameOf } from "../../../lib/shardDetails";
import { getSkillExtras } from "../../../lib/skillExtras";
import { getSkillMeta } from "../../../lib/skillMeta";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";
import skillStyles from "./SkillDetail.module.css";
import styles from "./JadeDragonView.module.css";
import ShardCostTable, { RARITIES } from "./ShardCostTable";
import SkillSubTabs from "./SkillSubTabs";

type Loaded = { key: string; result: { ok: true; data: ShardMaxCostResponse } | { ok: false; message: string } };

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
          (!hideMaxed || !row.maxed) &&
        (rarity === "all" || row.rarity === rarity) &&
        (row.shardName.toLowerCase().includes(needle) || attributeNameOf(row.productId).toLowerCase().includes(needle)),
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
        <input className={styles.input} type="search" placeholder="Search shard or attribute" value={query} onChange={(e) => setQuery(e.target.value)} />
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

      <ShardCostTable rows={rows} />
      <p className={styles.note}>
        Cost to max = shards still missing for level 10 × Instant Buy price. For very large amounts the real price rises a little
        because cheaper offers run out. Shards without a Bazaar price (not tradable or unknown) are listed last. Shard data from the
        Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0).
      </p>
    </>
  );
}
