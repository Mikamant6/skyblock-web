"use client";
// Eigene Seite pro Skill: Level und Fortschritt, XP-Planer (wie lange bis zum Ziel-Level),
// Level-Tabelle mit Belohnungen und - falls der Skill welche hat - seine Collections.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collectionIconPath } from "../../../lib/collectionIcons";
import { findRecipe, itemIconPath } from "../../../lib/recipes";
import { getSkillExtras } from "../../../lib/skillExtras";
import { colorizeReward } from "../../../lib/rewardText";
import { getSkillMeta } from "../../../lib/skillMeta";
import type { SkillDetailResponse } from "../../../lib/skillDetailService";
import { formatDuration, hoursNeeded, xpToLevel } from "../../../lib/skillPlanner";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";
import styles from "./SkillDetail.module.css";
import SkillSubTabs from "./SkillSubTabs";

type Loaded = { key: string; result: { ok: true; data: SkillDetailResponse } | { ok: false; message: string } };

// Die drei Ansichten eines Skills (je eine eigene Adresse): Uebersicht, Level & Belohnungen, Collections
export type SkillView = "overview" | "levels" | "collections";

// Zuletzt geladene Antwort pro Skill/Profil: beim Wechsel zwischen den Tabs erscheint sie sofort,
// waehrend im Hintergrund neu geladen wird
const lastLoaded = new Map<string, Loaded>();

export default function SkillDetail({ skillKey, view = "overview" }: { skillKey: string; view?: SkillView }) {
  const { subject } = useProfile();
  const meta = getSkillMeta(skillKey);

  // Wer und was gerade geladen werden soll; das Ergebnis merkt sich seinen Schluessel,
  // so gilt eine alte Antwort nie fuer eine neue Anfrage
  const playerName = subject?.playerName;
  const profileName = subject?.profileName;
  const wanted = playerName === undefined || profileName === undefined ? null : `${playerName}|${profileName}|${skillKey}`;
  const [loaded, setLoaded] = useState<Loaded | null>(() => (wanted === null ? null : (lastLoaded.get(wanted) ?? null)));

  useEffect(() => {
    if (playerName === undefined || profileName === undefined || wanted === null) return;
    let cancelled = false;
    const query = new URLSearchParams({ name: playerName, profile: profileName, skill: skillKey });
    void fetchApi<SkillDetailResponse>("/api/skill-detail", query).then((result) => {
      if (cancelled) return;
      const next: Loaded = { key: wanted, result };
      if (result.ok) lastLoaded.set(wanted, next);
      setLoaded(next);
    });
    return () => {
      cancelled = true;
    };
  }, [playerName, profileName, skillKey, wanted]);

  if (subject === null) {
    return (
      <div className={calc.notice} role="note">
        Enter a Minecraft name and a profile name and press Calculate.
      </div>
    );
  }
  if (loaded === null || loaded.key !== wanted) {
    return (
      <div className={calc.notice} role="status">
        Loading {skillKey.charAt(0) + skillKey.slice(1).toLowerCase()}...
      </div>
    );
  }
  if (!loaded.result.ok) {
    return (
      <div className={calc.error} role="alert">
        {loaded.result.message}
      </div>
    );
  }

  return <Content data={loaded.result.data} color={meta.color} about={meta.about} skillKey={skillKey} view={view} />;
}

function Content({
  data,
  color,
  about,
  skillKey,
  view,
}: {
  data: SkillDetailResponse;
  color: string;
  about: string;
  skillKey: string;
  view: SkillView;
}) {
  const { skill, levels, collections } = data;
  const style = { "--skill-color": color } as CSSProperties;
  const maxXp = levels.length > 0 ? levels[levels.length - 1].totalExpRequired : 0;

  return (
    <div style={style}>
      <h2 className={`${styles.heading} ${view !== "overview" ? styles.headingCompact : ""}`}>
        <span className={styles.dot} aria-hidden="true" />
        {skill.name}
      </h2>

      {/* Kopf: Level, XP, Fortschritt */}
      <div className={`${Panel.panel} ${styles.hero} ${view !== "overview" ? styles.compact : ""}`}>
        <div className={styles.bigLevel}>
          <span>Level</span>
          <strong>{skill.level}</strong>
          <small>of {skill.maxLevel}</small>
        </div>
        <div className={styles.heroBody}>
          <dl className={styles.facts}>
            <Fact label="Total XP" value={formatCoins(skill.xp)} />
            <Fact
              label="To next level"
              value={skill.xpForNextLevel === null ? "Max" : formatCoins(skill.xpForNextLevel - skill.xpIntoLevel)}
            />
            <Fact label="Progress to max" value={maxXp > 0 ? `${Math.min(100, (skill.xp / maxXp) * 100).toFixed(1)}%` : "-"} />
          </dl>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label={`${skill.name} progress to next level`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(skill.fraction * 100)}
          >
            <div className={styles.barFill} style={{ width: `${skill.fraction * 100}%` }} />
          </div>
          <p className={styles.about}>{about}</p>
          {!skill.countsForAverage && <p className={styles.about}>This skill does not count for the skill average.</p>}
        </div>
      </div>

      {/* Unterpunkte des Skills: Tabs; bei Combat/Taming zusaetzlich Links zu Seiten mit echten Daten */}
      <SkillSubTabs skillKey={skillKey} hasCollections={collections.length > 0} extras={getSkillExtras(skillKey)} />

      {view === "overview" && (
        <div className={styles.overviewGrid}>
          <Planner skillXp={skill.xp} levels={levels} currentLevel={skill.level} />
          <NextRewards levels={levels} currentLevel={skill.level} xp={skill.xp} />
        </div>
      )}
      {view === "levels" && <LevelTable levels={levels} currentLevel={skill.level} xp={skill.xp} />}
      {view === "collections" &&
        (collections.length > 0 ? (
          <Collections items={collections} />
        ) : (
          <div className={`${Panel.panel} ${styles.section}`}>
            <p className={calc.muted}>This skill has no collections.</p>
          </div>
        ))}
    </div>
  );
}

// Belohnungen eines Levels, in den Spielfarben (Coins gold, SkyBlock XP tuerkis ...)
function Rewards({ unlocks }: { unlocks: string[] }) {
  if (unlocks.length === 0) return <span className={styles.none}>-</span>;
  return (
    <ul className={styles.unlocks}>
      {unlocks.map((text) => (
        <UnlockLine key={text} text={text} />
      ))}
    </ul>
  );
}

// Ein Inventarfeld wie im Spiel: Item-Bild mit Menge unten rechts (Name als Tooltip).
// Ohne Bild steht der Name als Text im Feld; ohne Item bleibt das Feld leer.
function ItemSlot({ name, count, large = false }: { name: string | null; count: number; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = name === null ? null : itemIconPath(name);
  return (
    <div className={`${styles.slot} ${large ? styles.slotLarge : ""}`} data-empty={name === null} title={name ?? undefined}>
      {name !== null && src !== null && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.slotImage} src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />
      )}
      {name !== null && (src === null || failed) && <span className={styles.slotText}>{name}</span>}
      {name !== null && count > 1 && <span className={styles.slotCount}>{count}</span>}
    </div>
  );
}

// Eine Freischaltung; bei "<Item> Recipe" mit Knopf, der das echte Crafting-Rezept aufklappt
function UnlockLine({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const found = findRecipe(text);
  return (
    <li>
      {colorizeReward(text).map((part, index) => (
        <span key={index} style={{ color: part.color }}>
          {part.text}
        </span>
      ))}
      {found !== null && (
        <>
          <button
            type="button"
            className={styles.recipeButton}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Hide recipe ▴" : "Show recipe ▾"}
          </button>
          {open && (
            <div className={styles.recipeBox}>
              <div className={styles.recipeGrid} role="img" aria-label={`Crafting recipe for ${found.name}`}>
                {found.recipe.grid.map((slot, index) => (
                  <ItemSlot key={index} name={slot?.name ?? null} count={slot?.count ?? 0} />
                ))}
              </div>
              <span className={styles.recipeArrow} aria-hidden="true">→</span>
              <div className={styles.recipeResult}>
                <ItemSlot name={found.name} count={found.recipe.outputCount} large />
                <strong>{found.name}</strong>
                {found.recipe.craftText !== null && <small>{found.recipe.craftText}</small>}
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}

// Uebersicht: die Belohnungen der naechsten drei Level mit fehlender XP
function NextRewards({
  levels,
  currentLevel,
  xp,
}: {
  levels: SkillDetailResponse["levels"];
  currentLevel: number;
  xp: number;
}) {
  const next = levels.filter((entry) => entry.level > currentLevel).slice(0, 3);
  if (next.length === 0) return null;
  return (
    <div className={`${Panel.panel} ${styles.section}`}>
      <h3 className={styles.sectionTitle}>Next rewards</h3>
      <div className={styles.nextGrid}>
        {next.map((entry) => (
          <div key={entry.level} className={styles.nextLevel}>
            <div className={styles.nextHead}>
              <strong>Level {entry.level}</strong>
              <small>{formatCoins(Math.max(0, entry.totalExpRequired - xp))} XP to go</small>
            </div>
            <Rewards unlocks={entry.unlocks} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

// XP-Planer: Ziel-Level waehlen und XP pro Stunde eingeben -> fehlende XP und Dauer
function Planner({
  skillXp,
  levels,
  currentLevel,
}: {
  skillXp: number;
  levels: SkillDetailResponse["levels"];
  currentLevel: number;
}) {
  const maxLevel = levels.length;
  const [target, setTarget] = useState<number | null>(null);
  const [rate, setRate] = useState("");

  // Standard-Ziel: das naechste Level (oder das hoechste, wenn schon Maximum)
  const targetLevel = target ?? Math.min(currentLevel + 1, maxLevel);
  const missing = xpToLevel(skillXp, targetLevel, levels);
  // Eingabe wie "250000" oder "250,000" erlauben
  const rateNumber = Number(rate.replace(/[,\s]/g, ""));
  const hours = hoursNeeded(missing, rateNumber);

  return (
    <div className={`${Panel.panel} ${styles.section}`}>
      <h3 className={styles.sectionTitle}>XP planner</h3>
      <div className={styles.plannerFields}>
        <label className={styles.field}>
          <span>Target level</span>
          <select
            className={calc.input}
            value={targetLevel}
            onChange={(event) => setTarget(Number(event.target.value))}
          >
            {levels.map((entry) => (
              <option key={entry.level} value={entry.level}>
                Level {entry.level}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Your XP per hour</span>
          <input
            className={calc.input}
            inputMode="numeric"
            placeholder="e.g. 250000"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </label>
      </div>
      <p className={styles.result} aria-live="polite">
        {missing === 0 ? (
          <>You already reached Level {targetLevel}.</>
        ) : (
          <>
            <strong>{formatCoins(missing)}</strong> XP missing for Level {targetLevel}
            {hours !== null && (
              <>
                {" "}
                · about <strong>{formatDuration(hours)}</strong> at {formatCoins(rateNumber)} XP/h
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}

// Level-Tabelle: jedes Level mit Gesamt-XP, XP-Schritt und Belohnungen
function LevelTable({
  levels,
  currentLevel,
  xp,
}: {
  levels: SkillDetailResponse["levels"];
  currentLevel: number;
  xp: number;
}) {
  // Erreichte Level stehen eingeklappt in einer Zeile ganz oben; darunter beginnt die Liste mit dem, was noch fehlt
  const [showDone, setShowDone] = useState(false);
  const doneLevels = levels.filter((entry) => entry.level <= currentLevel);
  const upcomingLevels = levels.filter((entry) => entry.level > currentLevel);
  const rows = showDone ? levels : upcomingLevels;

  return (
    <div className={`${Panel.panel} ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>Levels &amp; rewards</h3>
      </div>
      {levels.length === 0 ? (
        <p className={calc.muted}>No level data.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Level</th>
                <th>XP for this level</th>
                <th>Total XP</th>
                <th>Rewards</th>
              </tr>
            </thead>
            <tbody>
              {doneLevels.length > 0 && (
                <tr className={styles.doneToggleRow}>
                  <td colSpan={4}>
                    <button
                      type="button"
                      className={styles.doneToggle}
                      aria-expanded={showDone}
                      onClick={() => setShowDone((open) => !open)}
                    >
                      <span aria-hidden="true">{showDone ? "▾" : "▸"}</span> Completed: Levels 1-{currentLevel} (
                      {doneLevels.length}) <small>{showDone ? "click to hide" : "click to show"}</small>
                    </button>
                  </td>
                </tr>
              )}
              {upcomingLevels.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.allDone}>
                    You reached every level.
                  </td>
                </tr>
              )}
              {rows.map((entry) => {
                const state = entry.level <= currentLevel ? "done" : entry.level === currentLevel + 1 ? "next" : "locked";
                return (
                  <tr key={entry.level} data-state={state}>
                    <td>
                      <strong>{entry.level}</strong>
                      {state === "done" && <span className={styles.tick} aria-label="reached"> ✓</span>}
                    </td>
                    <td>{formatCoins(entry.xpForLevel)}</td>
                    <td>
                      {formatCoins(entry.totalExpRequired)}
                      {state !== "done" && (
                        <small className={styles.missing}> ({formatCoins(entry.totalExpRequired - xp)} to go)</small>
                      )}
                    </td>
                    <td>
                      <Rewards unlocks={entry.unlocks} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.footnote}>Levels above 50 may need special unlocks in the game before you can reach them.</p>
    </div>
  );
}

type CollectionSort = "default" | "next" | "tier";

// Bild des Gegenstands (lokal aus public/collections); ohne Bild oder bei Ladefehler: Anfangsbuchstabe
function CollectionIcon({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const src = collectionIconPath(name);
  if (src === null || failed) {
    return (
      <span className={`${styles.icon} ${styles.iconFallback}`} aria-hidden="true">
        {name.charAt(0)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.icon} src={src} alt="" width={48} height={48} loading="lazy" onError={() => setFailed(true)} />;
}

// Eine Collection-Karte; per Klick klappt die Liste aller Stufen mit den freigeschalteten Rezepten auf
function CollectionCard({ item }: { item: SkillDetailResponse["collections"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={styles.collection} data-empty={item.amount === 0} data-open={open}>
      <div className={styles.collectionRow}>
        <CollectionIcon name={item.name} />
        <div className={styles.collectionBody}>
          <div className={styles.top}>
            <span className={styles.collectionName}>{item.name}</span>
            <span className={styles.tier}>
              Tier {item.tier}
              <small> / {item.maxTier}</small>
            </span>
          </div>
          <div className={styles.bar} role="progressbar" aria-label={`${item.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.fraction * 100)}>
            <div className={styles.barFill} style={{ width: `${item.fraction * 100}%` }} />
          </div>
          <span className={styles.collectionDetail}>
            {item.nextRequired === null
              ? `Maxed · ${formatCoins(item.amount)}`
              : `${formatCoins(item.amount)} / ${formatCoins(item.nextRequired)}`}
          </span>
        </div>
        <button
          type="button"
          className={styles.expandButton}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} unlocks of ${item.name}`}
          title={open ? "Hide unlocks" : "Show unlocks"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "▴" : "▾"}
        </button>
      </div>
      {open && (
        <ol className={styles.tierList}>
          {item.tiers.map((entry) => (
            <li key={entry.tier} className={styles.tierItem} data-reached={entry.tier <= item.tier}>
              <div className={styles.tierHead}>
                <strong>Tier {entry.tier}</strong>
                <span>{entry.tier <= item.tier ? "✓ " : ""}{formatCoins(entry.amountRequired)}</span>
              </div>
              <Rewards unlocks={entry.unlocks} />
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

// Collections des Skills: Stufe, Menge und Fortschritt zur naechsten Stufe
function Collections({ items }: { items: SkillDetailResponse["collections"] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CollectionSort>("tier");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = items.filter((item) => needle === "" || item.name.toLowerCase().includes(needle));
    // Hoechste Stufe zuerst; bei gleicher Stufe der mit mehr Fortschritt zur naechsten Stufe, dann mehr Menge
    if (sort === "tier") return [...filtered].sort((a, b) => b.tier - a.tier || b.fraction - a.fraction || b.amount - a.amount);
    if (sort === "next") {
      // Am naechsten dran zuerst; fertige (max) und leere ans Ende
      const rank = (item: (typeof items)[number]) =>
        item.nextRequired === null || item.amount === 0 ? Infinity : 1 - item.fraction;
      return [...filtered].sort((a, b) => rank(a) - rank(b));
    }
    return filtered;
  }, [items, search, sort]);

  const done = items.filter((item) => item.nextRequired === null).length;

  return (
    <div className={`${Panel.panel} ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>Collections</h3>
        <span className={styles.count}>
          {done} / {items.length} maxed
        </span>
      </div>
      <div className={styles.plannerFields}>
        <label className={styles.field}>
          <span>Find a collection</span>
          <input
            className={calc.input}
            type="search"
            placeholder="Name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Sort</span>
          <select className={calc.input} value={sort} onChange={(event) => setSort(event.target.value as CollectionSort)}>
            <option value="tier">Highest tier</option>
            <option value="next">Closest to next tier</option>
            <option value="default">Default order</option>
          </select>
        </label>
      </div>
      <ul className={styles.collections}>
        {visible.map((item) => (
          <CollectionCard key={item.id} item={item} />
        ))}
      </ul>
      {visible.length === 0 && <p className={calc.muted}>No collection matches your search.</p>}
      <p className={styles.footnote}>Collections shown are your own progress on this profile.</p>
    </div>
  );
}
