"use client";
// Skill > Guides > Shards: alle Attribute Shards, die zu diesem Skill gehoeren (Spalte "Skill" der Wiki),
// mit deinem Level, deinem Besitz und den Kosten bis Level 10 (Instant Buy).
// Spaeter kommen weitere Guides als zusaetzliche Reiter neben "Shards" dazu.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ShardMaxCostResponse } from "../../../lib/shardMaxCostService";
import { attributeNameOf } from "../../../lib/shardDetails";
import { shardCountForSkill, skillWikiName } from "../../../lib/shardSkills";
import { getSkillExtras } from "../../../lib/skillExtras";
import { getSkillMeta } from "../../../lib/skillMeta";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";
import jade from "./JadeDragonView.module.css";
import ShardCostTable, { RARITIES } from "./ShardCostTable";
import skillStyles from "./SkillDetail.module.css";
import SkillSubTabs from "./SkillSubTabs";
import styles from "./ShardsGuideView.module.css";

type Loaded = { key: string; result: { ok: true; data: ShardMaxCostResponse } | { ok: false; message: string } };

// Skills, die Collections haben (damit der Reiter "Collections" hier genauso erscheint wie auf den anderen Skill-Seiten)
const SKILLS_WITH_COLLECTIONS = new Set(["FARMING", "MINING", "COMBAT", "FORAGING", "FISHING"]);

// Letzte Antwort pro Profil: beim Zurueckwechseln erscheint sie sofort
const lastLoaded = new Map<string, Loaded>();

export default function ShardsGuideView({ skillKey }: { skillKey: string }) {
  const { subject } = useProfile();
  const meta = getSkillMeta(skillKey);
  const label = skillWikiName(skillKey);
  const hasShards = shardCountForSkill(skillKey) > 0;
  const playerName = subject?.playerName;
  const profileName = subject?.profileName;
  const wanted = playerName === undefined || profileName === undefined ? null : `${playerName}|${profileName}`;
  const [loaded, setLoaded] = useState<Loaded | null>(() => (wanted === null ? null : (lastLoaded.get(wanted) ?? null)));

  useEffect(() => {
    if (!hasShards || playerName === undefined || profileName === undefined || wanted === null) return;
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
  }, [hasShards, playerName, profileName, wanted]);

  if (subject === null) {
    return (
      <div className={calc.notice} role="note">
        Enter a Minecraft name and a profile name and press Calculate.
      </div>
    );
  }

  return (
    <div style={{ "--skill-color": meta.color } as CSSProperties}>
      <h2 className={`${skillStyles.heading} ${skillStyles.headingCompact}`}>
        <span className={skillStyles.dot} aria-hidden="true" />
        {label}
      </h2>
      <SkillSubTabs skillKey={skillKey} hasCollections={SKILLS_WITH_COLLECTIONS.has(skillKey)} extras={getSkillExtras(skillKey)} />
      <nav className={styles.guideTabs} aria-label="Guides">
        <span className={styles.guideTab} data-active="true">
          Shards
        </span>
      </nav>
      {!hasShards ? (
        <div className={calc.notice} role="note">
          There are no attribute shards for {label} in the Hypixel SkyBlock Wiki.
        </div>
      ) : loaded === null || loaded.key !== wanted ? (
        <div className={calc.notice} role="status">
          Loading shard data...
        </div>
      ) : !loaded.result.ok ? (
        <div className={calc.error} role="alert">
          {loaded.result.message}
        </div>
      ) : (
        <Content data={loaded.result.data} label={label} />
      )}
    </div>
  );
}

type SortMode = "cost" | "name" | "rarity";

function Content({ data, label }: { data: ShardMaxCostResponse; label: string }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState<SortMode>("cost");
  const [hideMaxed, setHideMaxed] = useState(false);

  // Nur die Shards dieses Skills (die Reihenfolge "billigste zuerst" kommt schon vom Server)
  const skillRows = useMemo(() => data.rows.filter((row) => row.skill === label), [data.rows, label]);
  const needle = query.trim().toLowerCase();
  const rows = useMemo(() => {
    const filtered = skillRows.filter(
      (row) => (!hideMaxed || !row.maxed) &&
        (rarity === "all" || row.rarity === rarity) &&
        (row.shardName.toLowerCase().includes(needle) || attributeNameOf(row.productId).toLowerCase().includes(needle)),
    );
    if (sort === "name") return [...filtered].sort((a, b) => a.shardName.localeCompare(b.shardName));
    if (sort === "rarity") {
      return [...filtered].sort(
        (a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) || a.shardName.localeCompare(b.shardName),
      );
    }
    return filtered;
  }, [skillRows, hideMaxed, rarity, needle, sort]);

  const maxedCount = skillRows.filter((row) => row.maxed).length;
  const open = skillRows.filter((row) => !row.maxed);
  const pricedOpen = open.filter((row) => row.cost !== null);
  const totalCost = pricedOpen.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const unpricedCount = open.length - pricedOpen.length;

  return (
    <>
      <div className={`${Panel.panel} ${jade.intro}`}>
        <div className={jade.introText}>
          <h3>{label} shards</h3>
          <p>
            Attribute shards whose effect belongs to the {label} skill (skill column of the Hypixel SkyBlock Wiki). Level, owned
            shards and cost are for your profile. Prices are the Instant Buy price (lowest sell offer in the Bazaar).
          </p>
          <div className={jade.stats}>
            <div className={jade.stat}>
              <span>Maxed</span>
              <strong>
                {maxedCount} / {skillRows.length}
              </strong>
            </div>
            <div className={jade.stat}>
              <span>Cost to max the rest</span>
              <strong>{formatCoins(totalCost)}</strong>
            </div>
            {unpricedCount > 0 && (
              <div className={jade.stat}>
                <span>Without Bazaar price</span>
                <strong>{unpricedCount}</strong>
              </div>
            )}
          </div>
        </div>
        <div className={jade.introControls}>
          <input className={jade.input} type="search" placeholder="Search shard or attribute" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className={jade.select} value={rarity} onChange={(e) => setRarity(e.target.value)} aria-label="Filter by rarity">
            <option value="all">All rarities</option>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <select className={jade.select} value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Sort shards">
            <option value="cost">Sort: cheapest to max</option>
            <option value="name">Sort: name</option>
            <option value="rarity">Sort: rarity</option>
          </select>
          <label className={jade.toggle}>
            <input type="checkbox" checked={hideMaxed} onChange={(e) => setHideMaxed(e.target.checked)} />
            Hide already maxed
          </label>
        </div>
      </div>

      <ShardCostTable rows={rows} />
      <p className={jade.note}>
        Cost to max = shards still missing for level 10 × Instant Buy price. For very large amounts the real price rises a little
        because cheaper offers run out. Shards that belong to Hunting or have no specific skill (Global) are not listed here. Shard
        data from the Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0).
      </p>
    </>
  );
}
