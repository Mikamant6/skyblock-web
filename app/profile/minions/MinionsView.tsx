"use client";
// Seite "Minions": alle Minions (auch noch nicht hergestellte) mit der hoechsten hergestellten Stufe.
// Standard: hoechste Stufe zuerst, wie bei den Collections. Per Schalter nur die eigenen Minions.
// Jede Karte klappt auf und zeigt das Rezept fuer die naechste Stufe.
import { useMemo, useState } from "react";
import { allMinionTypes, minionRecipe, parseMinionItemId } from "../../../lib/minionRecipes";
import { minionIconPath } from "../../../lib/minionIcons";
import { itemIconPath } from "../../../lib/recipes";
import { SKILL_ORDER, minionSkill, type SkillGroup } from "../../../lib/skillGroups";
import Panel from "../../Panel.module.css";
import { formatCoins } from "../../format";
import ExtrasGate from "../extras/Status";
import styles from "../extras/Extras.module.css";
import MinionIcon from "./MinionIcon";

type Row = { key: string; name: string; highestTier: number; maxTier: number | null };
type Sort = "tier" | "name";
type SkillFilter = SkillGroup | "all";

export default function MinionsView() {
  const [query, setQuery] = useState("");
  const [onlyCrafted, setOnlyCrafted] = useState(false);
  const [sort, setSort] = useState<Sort>("tier");
  const [skill, setSkill] = useState<SkillFilter>("all");
  return (
    <ExtrasGate>
      {({ minions }) => (
        <MinionsContent minions={minions} query={query} setQuery={setQuery} onlyCrafted={onlyCrafted} setOnlyCrafted={setOnlyCrafted} sort={sort} setSort={setSort} skill={skill} setSkill={setSkill} />
      )}
    </ExtrasGate>
  );
}

function MinionsContent({
  minions,
  query,
  setQuery,
  onlyCrafted,
  setOnlyCrafted,
  sort,
  setSort,
  skill,
  setSkill,
}: {
  minions: { key: string; name: string; highestTier: number; craftedTiers: number }[];
  query: string;
  setQuery: (value: string) => void;
  onlyCrafted: boolean;
  setOnlyCrafted: (value: boolean) => void;
  sort: Sort;
  setSort: (value: Sort) => void;
  skill: SkillFilter;
  setSkill: (value: SkillFilter) => void;
}) {
  // Alle bekannten Minions + eigene; hoechste Stufe zuerst, bei Gleichstand nach Name
  const rows = useMemo(() => {
    const owned = new Map(minions.map((m) => [m.key, m]));
    const list: Row[] = allMinionTypes().map((type) => ({
      key: type.key,
      name: type.name,
      highestTier: owned.get(type.key)?.highestTier ?? 0,
      maxTier: type.maxTier,
    }));
    const known = new Set(list.map((row) => row.key));
    for (const m of minions) if (!known.has(m.key)) list.push({ key: m.key, name: m.name, highestTier: m.highestTier, maxTier: null });
    return list.sort((a, b) => b.highestTier - a.highestTier || a.name.localeCompare(b.name));
  }, [minions]);

  const needle = query.trim().toLowerCase();
  const shown = rows.filter((row) => (!onlyCrafted || row.highestTier > 0) && (skill === "all" || minionSkill(row.key) === skill) && row.name.toLowerCase().includes(needle));
  const sortedShown = sort === "name" ? [...shown].sort((a, b) => a.name.localeCompare(b.name)) : shown;
  // Skills, die es in der Liste gibt (fuer das Filter-Feld)
  const skillsPresent = SKILL_ORDER.filter((name) => rows.some((row) => minionSkill(row.key) === name));
  const totalTiers = minions.reduce((sum, m) => sum + m.craftedTiers, 0);

  return (
    <>
      <h2 className={styles.heading}>Minions</h2>
      <div className={`${Panel.panel} ${styles.summary}`}>
        <div className={styles.stat}>
          <span>Minion types crafted</span>
          <strong>
            {formatCoins(minions.length)}
            {rows.length > minions.length && <small> / {formatCoins(rows.length)}</small>}
          </strong>
        </div>
        <div className={styles.stat}>
          <span>Unique tiers crafted</span>
          <strong>{formatCoins(totalTiers)}</strong>
        </div>
      <div className={styles.summaryControls}>
        <input
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search minions"
          aria-label="Search minions"
        />
        <select className={styles.sortSelect} value={skill} onChange={(e) => setSkill(e.target.value as SkillFilter)} aria-label="Filter minions by skill">
          <option value="all">All skills</option>
          {skillsPresent.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select className={styles.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort minions">
          <option value="tier">Sort: Highest tier</option>
          <option value="name">Sort: Name</option>
        </select>
        <label className={styles.toggle}>
          <input type="checkbox" checked={onlyCrafted} onChange={(e) => setOnlyCrafted(e.target.checked)} />
          Only minions I have crafted
        </label>
      </div>
      </div>
      {minions.length === 0 && <p>No crafted minions found. It may be hidden by the API settings of this profile.</p>}
      <ul className={`${styles.grid} ${styles.minionGrid}`}>
        {sortedShown.map((row) => (
          <MinionCard key={row.key} row={row} />
        ))}
      </ul>
      {shown.length === 0 && <p>No minion matches.</p>}
    </>
  );
}

function MinionCard({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  const nextTier = row.highestTier + 1;
  const recipe = open ? minionRecipe(row.key, nextTier) : null;
  const maxed = row.maxTier !== null && row.highestTier >= row.maxTier;
  return (
    <li className={`${Panel.panel} ${styles.card} ${styles.minionCard}`} data-owned={row.highestTier > 0}>
      <div className={styles.minionRow}>
        <MinionIcon minionKey={row.key} name={row.name} tier={Math.max(row.highestTier, 1)} />
        <div className={styles.petText}>
          <strong>{row.name}</strong>
          <small>{row.highestTier > 0 ? `Highest tier ${row.highestTier}` : "Not crafted yet"}</small>
        </div>
        {row.maxTier !== null && !maxed && (
          <button
            type="button"
            className={styles.expandButton}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} recipe for the next tier of ${row.name}`}
            title={open ? "Hide recipe" : `Show recipe for tier ${nextTier}`}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "▴" : "▾"}
          </button>
        )}
      </div>
      {maxed && <small className={styles.maxNote}>Max tier reached</small>}
      {open && (
        <div className={styles.recipeBlock}>
          <strong>Recipe for tier {nextTier}</strong>
          {recipe === null ? (
            <small>No recipe found for this tier.</small>
          ) : (
            <div className={styles.recipeRow}>
              <div className={styles.recipeGrid} role="img" aria-label={`Crafting recipe for ${row.name} Minion tier ${nextTier}`}>
                {recipe.map((slot, index) => (
                  <Slot key={index} slot={slot} />
                ))}
              </div>
              <span className={styles.recipeArrow} aria-hidden="true">→</span>
              <Slot slot={{ id: `${row.key}_GENERATOR_${nextTier}`, name: `${row.name} Minion`, count: 1 }} large />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// Ein Inventarfeld: Minion-Zutaten zeigen das Minion-Bild, alles andere das Item-Bild; sonst der Name als Text
function Slot({ slot, large = false }: { slot: { id: string; name: string; count: number } | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (slot === null) return <div className={`${styles.slot} ${large ? styles.slotLarge : ""}`} data-empty="true" />;
  const minion = parseMinionItemId(slot.id);
  const src = minion !== null ? minionIconPath(minion.key, minion.tier) : itemIconPath(slot.name);
  const label = minion !== null ? `${slot.name} (tier ${minion.tier})` : slot.name;
  return (
    <div className={`${styles.slot} ${large ? styles.slotLarge : ""}`} title={label}>
      {src !== null && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.slotImage} src={src} alt={label} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className={styles.slotText}>{slot.name}</span>
      )}
      {slot.count > 1 && <span className={styles.slotCount}>{slot.count}</span>}
    </div>
  );
}
