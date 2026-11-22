"use client";
// Tabelle "Shard, Level, Besitz, Preis, Kosten bis Level 10": wird vom Jade-Dragon-Tab und von den Shard-Guides benutzt.
// Preis = Instant Buy (niedrigstes Verkaufsangebot im Bazaar). Die Zeilen kommen fertig sortiert von aussen.
// Vor der Nummer steht ein Pfeil: Klick klappt die Beschreibung des Shards (Wirkung, wie man ihn bekommt) auf.

import { useState } from "react";
import { parseColoredLine, parseTooltip, type TextLine } from "../../../lib/minecraftText";
import { shardDetailOf } from "../../../lib/shardDetails";
import { shardEntries, type ShardEntry } from "../../../lib/shardInfo";
import type { MaxCostRowWithImage } from "../../../lib/shardMaxCostService";
import Panel from "../../Panel.module.css";
import { formatCoins } from "../../format";
import styles from "./JadeDragonView.module.css";

export const RARITY_COLOR: Record<string, string> = {
  common: "#e5e7eb",
  uncommon: "#55ff55",
  rare: "#6b8cff",
  epic: "#c26bf0",
  legendary: "#ffaa00",
};
export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

const price = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const COLUMNS = 8;

// Ingame-Tooltip jedes Shards (gleiche Daten wie beim Ueberfahren im Shards-Tab), nach Attribut-ID
const entryByAttribute = new Map(shardEntries.map((entry) => [entry.attributeId, entry]));

// Die Spiel-Icons stehen im Wiki-Text als Sonderzeichen einer Spezialschrift, die wir nicht haben.
// Wir ersetzen die bekannten durch das gewohnte Symbol und lassen unbekannte weg.
const STAT_ICONS: Record<string, string> = {
  Health: "❤",
  Strength: "❁",
  "Crit Damage": "☠",
  "Mining Speed": "⸕",
  "Health Regen": "❣",
  "Farming Fortune": "☘",
  "Mining Fortune": "☘",
  "Foraging Fortune": "☘",
  "Ore Fortune": "☘",
  "Block Fortune": "☘",
  "Gemstone Fortune": "☘",
  "Fig Fortune": "☘",
  "Helix Fortune": "☘",
  "Mangrove Fortune": "☘",
};
const STAT_NAMES = Object.keys(STAT_ICONS).sort((a, b) => b.length - a.length).join("|");
const ICON_RE = new RegExp(`[\ue000-\uf8ff]\\s*(${STAT_NAMES})`, "g");
const PUA_RE = /[\ue000-\uf8ff\u1820-\u185f]\s?/g;

function fixIcons(text: string): string {
  return text.replace(ICON_RE, (_all, name: string) => `${STAT_ICONS[name]} ${name}`).replace(PUA_RE, "");
}

// Eine Tooltip-Zeile zeichnen (Farben wie im Spiel)
function TipLine({ line }: { line: TextLine }) {
  if (line.length === 0) return <div className={styles.tipBlank} />;
  return (
    <div className={styles.tipLine}>
      {line.map((segment, index) => (
        <span key={index} style={{ color: segment.color, fontWeight: segment.bold ? 700 : 400 }}>
          {fixIcons(segment.text)}
        </span>
      ))}
    </div>
  );
}

export default function ShardCostTable({ rows }: { rows: MaxCostRowWithImage[] }) {
  // Welche Shards sind aufgeklappt (nach Shard-ID)
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(productId: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  return (
    // Kein Innenabstand: sonst scrollen die Zeilen sichtbar ueber der festen Kopfzeile durch (Text laeuft in die Ueberschrift)
    <div className={Panel.panel} style={{ padding: 0, overflow: "hidden" }}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.arrowCol} aria-label="Details" />
              <th className={styles.num}>#</th>
              <th>Shard</th>
              <th className={styles.num}>Level</th>
              <th className={styles.num}>Owned</th>
              <th className={styles.num}>Still needed</th>
              <th className={styles.num}>Price each</th>
              <th className={styles.num}>Cost to max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const detail = shardDetailOf(row.productId);
              const isOpen = open.has(row.productId);
              const entry = entryByAttribute.get(row.attributeId);
              return (
                <ShardRows
                  key={row.productId}
                  row={row}
                  index={index}
                  attribute={detail?.attribute ?? ""}
                  parts={detail?.parts ?? null}
                  entry={entry}
                  isOpen={isOpen}
                  onToggle={() => toggle(row.productId)}
                />
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS}>No shard matches.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShardRows({
  row,
  index,
  attribute,
  parts,
  entry,
  isOpen,
  onToggle,
}: {
  row: MaxCostRowWithImage;
  index: number;
  attribute: string;
  parts: [string, string?][] | null;
  entry: ShardEntry | undefined;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr data-state={row.maxed ? "maxed" : undefined}>
        <td className={styles.arrowCol}>
          <button
            type="button"
            className={styles.arrowButton}
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Hide" : "Show"} description of ${row.shardName}`}
          >
            <span className={styles.arrowIcon} data-open={isOpen} aria-hidden="true">
              ▸
            </span>
          </button>
        </td>
        <td className={`${styles.num} ${styles.muted}`}>{index + 1}</td>
        <td>
          <span className={styles.shardCell}>
            <ShardImage src={row.image} name={row.shardName} />
            <span className={styles.rarity} style={{ color: RARITY_COLOR[row.rarity] }}>
              {row.shardName}
            </span>
            {attribute !== "" && <span className={styles.attribute}>{attribute}</span>}
          </span>
        </td>
        <td className={styles.num}>{row.level} / 10</td>
        <td className={styles.num}>{formatCoins(row.owned)}</td>
        <td className={styles.num}>{row.maxed ? "-" : formatCoins(row.remaining)}</td>
        <td className={styles.num}>{row.unitPrice === null ? "-" : price.format(row.unitPrice)}</td>
        <td className={styles.num}>
          {row.maxed ? "Maxed" : row.cost === null ? <span className={styles.muted}>no price</span> : formatCoins(row.cost)}
        </td>
      </tr>
      {isOpen && (
        <tr className={styles.detailRow}>
          <td colSpan={COLUMNS}>
            <div className={styles.tip}>
              {entry !== undefined && entry.tooltip !== null ? (
                <>
                  <TipLine line={parseColoredLine(entry.title ?? `${row.shardName} Shard`)} />
                  {parseTooltip(entry.tooltip).map((line, index) => (
                    <TipLine key={index} line={line} />
                  ))}
                </>
              ) : (
                <>
                  <TipLine line={[{ text: `${row.shardName} Shard`, color: "#FFFFFF", bold: false }]} />
                  <TipLine line={[{ text: attribute, color: "#FFAA00", bold: false }]} />
                </>
              )}
              {parts !== null && (
                <>
                  <div className={styles.tipBlank} />
                  <div className={styles.tipLine}>
                    <span style={{ color: "#AAAAAA" }}>Level 1 to 10: </span>
                    {parts.map(([text, color], i) => (
                      <span key={i} style={{ color: color ?? "#AAAAAA" }}>
                        {fixIcons(text)}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Shard-Textur (public/shards/...); fehlt sie, bleibt ein leerer Platz gleicher Groesse
function ShardImage({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  if (src === null || broken) return <span className={styles.shardImage} aria-hidden="true" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.shardImage} src={src} alt={name} width={28} height={28} loading="lazy" onError={() => setBroken(true)} />
  );
}
