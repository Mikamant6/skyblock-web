"use client";
// Guides > <Skill>: Level-Bereiche (z. B. Level 3-9) als Reiter, darunter die Ausruestung fuer den Bereich.
// Die Inhalte kommen aus data/levelGuides.json (von Hand gepflegt). Ausserdem fragt die Seite die Hypixel-API,
// welche dieser Gegenstaende der Spieler schon hat, und zeigt das pro Teil und pro Set an.

import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { OwnedItemsResponse } from "../../../lib/ownedItems";
import { getLevelGuide, itemIdsOf, pieceLabel, piecesOf, withUpgradeOwnership, type GearItem, type GearPiece } from "../../../lib/levelGuides";
import { skillWikiName } from "../../../lib/shardSkills";
import { getSkillMeta } from "../../../lib/skillMeta";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";
import skillStyles from "../skills/SkillDetail.module.css";
import ItemTooltip from "./ItemTooltip";
import styles from "./LevelGuideView.module.css";

// Das Teil, ueber dem gerade die Maus ist (oder das den Fokus hat), und seine Position im Fenster
type Hovered = { piece: GearPiece; anchor: DOMRect };

type Loaded = { key: string; result: { ok: true; data: OwnedItemsResponse } | { ok: false; message: string } };

// Letzte Antwort pro Profil und Skill: beim Zurueckwechseln erscheint sie sofort
const lastLoaded = new Map<string, Loaded>();

export default function LevelGuideView({ skillKey }: { skillKey: string }) {
  const { subject } = useProfile();
  const meta = getSkillMeta(skillKey);
  const label = skillWikiName(skillKey);
  const { ranges, crops = [] } = getLevelGuide(skillKey);
  const ids = useMemo(() => itemIdsOf(skillKey), [skillKey]);
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  // Farming: gewaehlte Pflanze (jede hat ihr eigenes Werkzeug). Standard ist die erste, die letzte Wahl wird im Browser gemerkt.
  const [crop, setCrop] = useState<string | undefined>(crops[0]?.id);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`guide-crop-${skillKey}`);
      if (saved !== null && crops.some((c) => c.id === saved)) setCrop(saved);
    } catch {
      // Browser-Speicher nicht verfuegbar: Standard bleibt
    }
  }, [skillKey, crops]);
  function chooseCrop(id: string) {
    setCrop(id);
    try {
      window.localStorage.setItem(`guide-crop-${skillKey}`, id);
    } catch {
      // egal
    }
  }
  const range = ranges[Math.min(selected, ranges.length - 1)];
  // Eintraege fuer eine bestimmte Pflanze nur zeigen, wenn diese Pflanze gewaehlt ist
  const gear = range === undefined ? [] : range.gear.filter((item) => item.crop === undefined || item.crop === crop);

  const playerName = subject?.playerName;
  const profileName = subject?.profileName;
  const wanted = playerName === undefined || profileName === undefined ? null : `${playerName}|${profileName}|${skillKey}`;
  const [loaded, setLoaded] = useState<Loaded | null>(() => (wanted === null ? null : (lastLoaded.get(wanted) ?? null)));

  useEffect(() => {
    if (ids.length === 0 || playerName === undefined || profileName === undefined || wanted === null) return;
    let cancelled = false;
    void fetchApi<OwnedItemsResponse>(
      "/api/owned-items",
      new URLSearchParams({ name: playerName, profile: profileName, ids: ids.join(",") }),
    ).then((result) => {
      if (cancelled) return;
      const next: Loaded = { key: wanted, result };
      if (result.ok) lastLoaded.set(wanted, next);
      setLoaded(next);
    });
    return () => {
      cancelled = true;
    };
  }, [ids, playerName, profileName, wanted]);

  if (subject === null) {
    return (
      <div className={calc.notice} role="note">
        Enter a Minecraft name and a profile name and press Calculate.
      </div>
    );
  }

  const current = loaded !== null && loaded.key === wanted ? loaded : null;
  const rawOwned = current !== null && current.result.ok && current.result.data.inventoryApi ? current.result.data.owned : null;
  // Teile, die durch eine bessere Stufe ersetzt wurden (z. B. Fig Hew -> Figstone Splitter), gelten auch als vorhanden
  const owned = withUpgradeOwnership(skillKey, rawOwned);
  const prices = current !== null && current.result.ok ? current.result.data.prices : null;

  return (
    <div style={{ "--skill-color": meta.color } as CSSProperties}>
      <h2 className={`${skillStyles.heading} ${skillStyles.headingCompact}`}>
        <span className={skillStyles.dot} aria-hidden="true" />
        {label} level guide
      </h2>

      {range === undefined ? (
        <div className={calc.notice} role="note">
          The {label} level guide has not been written yet.
        </div>
      ) : (
        <>
          {crops.length > 0 && (
            <nav className={styles.cropPicker} aria-label="Crop">
              <span className={styles.cropLabel}>Crop</span>
              {crops.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={styles.rangeTab}
                  data-active={c.id === crop}
                  aria-pressed={c.id === crop}
                  onClick={() => chooseCrop(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </nav>
          )}
          <nav className={styles.rangeTabs} aria-label="Level range">
            {ranges.map((r, index) => (
              <button
                key={`${r.from}-${r.to}`}
                type="button"
                className={styles.rangeTab}
                data-active={index === selected}
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
              >
                {r.label ?? `Level ${r.from}–${r.to}`}
              </button>
            ))}
          </nav>

          {ids.length > 0 && <OwnedStatus loaded={current} />}

          <div className={`${Panel.panel} ${styles.panel}`}>
            <h3>
              {label} {range.label ?? `level ${range.from}–${range.to}`}
            </h3>
            {gear.length === 0 ? (
              <p className={styles.empty}>No equipment has been added for this level range yet.</p>
            ) : (
              <ul className={styles.gearList}>
                {gear.map((item) => (
                  <GearRow key={`${item.slot}-${item.name}`} item={item} owned={owned} onHover={setHovered} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      {hovered !== null && (
        <ItemTooltip id="item-tooltip" piece={hovered.piece} places={owned?.[hovered.piece.id]} price={prices?.[hovered.piece.id]} known={owned !== null} anchor={hovered.anchor} />
      )}
    </div>
  );
}

// Hinweis, solange die Besitz-Daten laden oder nicht verfuegbar sind
function OwnedStatus({ loaded }: { loaded: Loaded | null }) {
  if (loaded === null) {
    return (
      <p className={styles.status} role="status">
        Checking which items you already own...
      </p>
    );
  }
  if (!loaded.result.ok) {
    return (
      <p className={styles.status} role="alert">
        Could not check your items: {loaded.result.message}
      </p>
    );
  }
  if (!loaded.result.data.inventoryApi) {
    return (
      <p className={styles.status} role="note">
        Your inventory API seems to be turned off, so we cannot see your items. You can turn it on in the SkyBlock settings
        (API Settings) and try again.
      </p>
    );
  }
  return (
    <p className={styles.status}>
      Items you own are marked with a check. Items donated to the Museum or kept in a Sack are not counted.
    </p>
  );
}

function GearRow({ item, owned, onHover }: { item: GearItem; owned: Record<string, string[]> | null; onHover: (hovered: Hovered | null) => void }) {
  const pieces = piecesOf(item);
  const have = owned === null ? 0 : pieces.filter((piece) => owned[piece.id] !== undefined).length;
  const complete = owned !== null && pieces.length > 0 && have === pieces.length;
  // Sets (mehrere Teile) und einzelne Gegenstaende mit Bild bekommen die Teile-Liste mit Bild und Hover-Beschreibung.
  // Bei einem einzelnen Gegenstand ist der Name dort schon zu sehen, deshalb entfaellt die Ueberschrift.
  const isSet = pieces.length > 1;
  const isFlow = item.flow === true;
  const showList = isSet || pieces[0]?.icon !== undefined;

  return (
    <li className={styles.gearItem}>
      <span className={styles.slot}>{item.slot}</span>
      {(isSet || !showList) && (
        <span className={styles.gearName}>
          {item.name}
          {owned !== null && isSet && !isFlow && (
            <span className={styles.badge} data-complete={complete}>
              {have} / {pieces.length} pieces
            </span>
          )}
          {item.tag !== undefined && (
            <span className={styles.setTag} style={{ color: item.tag.color }}>
              {item.tag.text}
            </span>
          )}
        </span>
      )}
      {item.note !== undefined && <span className={styles.gearNote}>{item.note}</span>}
      {showList && (
        <ul className={styles.pieces}>
          {pieces.map((piece, index) => {
            const places = owned?.[piece.id];
            return (
              <Fragment key={piece.id}>
              {isFlow && index > 0 && (
                <li className={styles.arrow} aria-hidden="true">
                  →
                </li>
              )}
              {/* Aeussere Zeile: Teil (mit Hover) und Hinweis sind getrennte Elemente */}
              <li className={styles.pieceRow} data-tagged={piece.tag !== undefined ? true : undefined}>
              <div
                className={styles.piece}
                data-owned={owned === null ? undefined : places !== undefined}
                tabIndex={0}
                aria-describedby="item-tooltip"
                onMouseEnter={(event) => onHover({ piece, anchor: event.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => onHover(null)}
                onFocus={(event) => onHover({ piece, anchor: event.currentTarget.getBoundingClientRect() })}
                onBlur={() => onHover(null)}
              >
                {piece.icon !== undefined && (
                  <span className={styles.iconWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.pieceIcon} src={piece.icon} alt="" width={32} height={32} />
                  </span>
                )}
                <span className={styles.pieceName}>
                  <span aria-hidden="true">{owned === null ? "•" : places !== undefined ? "✔" : "✘"}</span> {pieceLabel(item, piece)}
                  {places !== undefined && <small className={styles.where}> ({places.join(", ")})</small>}
                </span>
              </div>
              {piece.tag !== undefined && (
                <span className={styles.pieceTag} style={{ color: piece.tag.color }}>
                  {piece.tag.text}
                </span>
              )}
              </li>
              </Fragment>
            );
          })}
        </ul>
      )}
      {item.details?.map((detail, detailIndex) => (
        <details key={`${detail.label}-${detailIndex}`} className={styles.details}>
          <summary>{detail.label}</summary>
          <ul>
            {detail.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      ))}
    </li>
  );
}
