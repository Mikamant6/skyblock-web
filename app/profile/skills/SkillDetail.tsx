"use client";
// Eigene Seite pro Skill: Level und Fortschritt, XP-Planer (wie lange bis zum Ziel-Level),
// Level-Tabelle mit Belohnungen und - falls der Skill welche hat - seine Collections.

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getSkillMeta } from "../../../lib/skillMeta";
import type { SkillDetailResponse } from "../../../lib/skillDetailService";
import { formatDuration, hoursNeeded, xpToLevel } from "../../../lib/skillPlanner";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";
import styles from "./SkillDetail.module.css";

type Loaded = { key: string; result: { ok: true; data: SkillDetailResponse } | { ok: false; message: string } };

export default function SkillDetail({ skillKey }: { skillKey: string }) {
  const { subject } = useProfile();
  const meta = getSkillMeta(skillKey);

  // Wer und was gerade geladen werden soll; das Ergebnis merkt sich seinen Schluessel,
  // so gilt eine alte Antwort nie fuer eine neue Anfrage
  const playerName = subject?.playerName;
  const profileName = subject?.profileName;
  const wanted = playerName === undefined || profileName === undefined ? null : `${playerName}|${profileName}|${skillKey}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (playerName === undefined || profileName === undefined || wanted === null) return;
    let cancelled = false;
    const query = new URLSearchParams({ name: playerName, profile: profileName, skill: skillKey });
    void fetchApi<SkillDetailResponse>("/api/skill-detail", query).then((result) => {
      if (!cancelled) setLoaded({ key: wanted, result });
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

  return <Content data={loaded.result.data} color={meta.color} about={meta.about} />;
}

function Content({ data, color, about }: { data: SkillDetailResponse; color: string; about: string }) {
  const { skill, levels, collections } = data;
  const style = { "--skill-color": color } as CSSProperties;
  const maxXp = levels.length > 0 ? levels[levels.length - 1].totalExpRequired : 0;

  return (
    <div style={style}>
      <h2 className={styles.heading}>
        <span className={styles.dot} aria-hidden="true" />
        {skill.name}
      </h2>

      {/* Kopf: Level, XP, Fortschritt */}
      <div className={`${Panel.panel} ${styles.hero}`}>
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

      <Planner skillXp={skill.xp} levels={levels} currentLevel={skill.level} />

      <LevelTable levels={levels} currentLevel={skill.level} xp={skill.xp} />

      {collections.length > 0 && <Collections items={collections} />}
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
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);
  const rows = onlyUpcoming ? levels.filter((entry) => entry.level > currentLevel) : levels;

  return (
    <div className={`${Panel.panel} ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>Levels &amp; rewards</h3>
        <label className={styles.check}>
          <input type="checkbox" checked={onlyUpcoming} onChange={(event) => setOnlyUpcoming(event.target.checked)} />
          Only upcoming
        </label>
      </div>
      {rows.length === 0 ? (
        <p className={calc.muted}>You reached every level.</p>
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
              {rows.map((entry) => {
                const state = entry.level <= currentLevel ? "done" : entry.level === currentLevel + 1 ? "next" : "locked";
                return (
                  <tr key={entry.level} data-state={state}>
                    <td>
                      <strong>{entry.level}</strong>
                      {state === "done" && <span className={styles.tick} aria-label="reached"> ✓</span>}
                      {state === "next" && <span className={styles.nextTag}>next</span>}
                    </td>
                    <td>{formatCoins(entry.xpForLevel)}</td>
                    <td>
                      {formatCoins(entry.totalExpRequired)}
                      {state !== "done" && (
                        <small className={styles.missing}> ({formatCoins(entry.totalExpRequired - xp)} to go)</small>
                      )}
                    </td>
                    <td>
                      {entry.unlocks.length === 0 ? (
                        <span className={styles.none}>-</span>
                      ) : (
                        <ul className={styles.unlocks}>
                          {entry.unlocks.map((text) => (
                            <li key={text}>{text}</li>
                          ))}
                        </ul>
                      )}
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

// Collections des Skills: Stufe, Menge und Fortschritt zur naechsten Stufe
function Collections({ items }: { items: SkillDetailResponse["collections"] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CollectionSort>("default");

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = items.filter((item) => needle === "" || item.name.toLowerCase().includes(needle));
    if (sort === "tier") return [...filtered].sort((a, b) => b.tier - a.tier);
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
            <option value="default">Default order</option>
            <option value="next">Closest to next tier</option>
            <option value="tier">Highest tier</option>
          </select>
        </label>
      </div>
      <ul className={styles.collections}>
        {visible.map((item) => (
          <li key={item.id} className={styles.collection} data-empty={item.amount === 0}>
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
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className={calc.muted}>No collection matches your search.</p>}
      <p className={styles.footnote}>Collections shown are your own progress on this profile.</p>
    </div>
  );
}
