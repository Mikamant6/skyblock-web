"use client";
// Der Tooltip, der beim Ueberfahren eines Shards erscheint: sieht aus wie im
// Spiel (dunkler Kasten, farbiger Text). Wird einmal pro Seite gezeichnet und
// neben die jeweilige Karte gesetzt, ohne den Bildschirmrand zu verlassen.

import { useLayoutEffect, useRef } from "react";
import { parseColoredLine, parseTooltip, type TextLine } from "../lib/minecraftText";
import type { ShardEntry } from "../lib/shardInfo";
import type { ShardRow } from "../lib/shardNetworth";
import { formatCoins, formatCompact } from "./format";
import styles from "./ShardTooltip.module.css";

type Props = {
  id: string; // fuer aria-describedby
  entry: ShardEntry;
  owned: ShardRow | undefined; // undefined = (noch) nicht besessen
  anchor: DOMRect; // Position der Karte im Fenster
};

const GAP = 8; // Abstand zur Karte
const MARGIN = 8; // Mindestabstand zum Fensterrand

// Texte vorbereiten: aus den Wiki-Daten, sonst aus Name/Attribut/Seltenheit
function buildLines(entry: ShardEntry): { title: TextLine; body: TextLine[] } {
  if (entry.tooltip !== null) {
    const title =
      entry.title !== null
        ? parseColoredLine(entry.title)
        : [{ text: `${entry.shardName} Shard`, color: "#FFFFFF", bold: false }];
    return { title, body: parseTooltip(entry.tooltip) };
  }
  return {
    title: [{ text: `${entry.shardName} Shard`, color: "#FFFFFF", bold: false }],
    body: [[{ text: entry.attributeName, color: "#FFAA00", bold: false }]],
  };
}

function Line({ line }: { line: TextLine }) {
  if (line.length === 0) return <div className={styles.blank} />;
  return (
    <div className={styles.line}>
      {line.map((segment, index) => (
        <span
          key={index}
          style={{ color: segment.color, fontWeight: segment.bold ? 700 : 400 }}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
}

export default function ShardTooltip({ id, entry, owned, anchor }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { title, body } = buildLines(entry);

  // Nach dem Zeichnen messen und so setzen, dass der Kasten ins Fenster passt
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box === null) return;
    const { width, height } = box.getBoundingClientRect();

    // waagerecht mittig zur Karte, aber im Fenster halten
    let left = anchor.left + anchor.width / 2 - width / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));

    // bevorzugt unter der Karte, sonst darueber
    let top = anchor.bottom + GAP;
    if (top + height > window.innerHeight - MARGIN) top = anchor.top - GAP - height;
    top = Math.max(MARGIN, top);

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.visibility = "visible";
  }, [anchor, entry]);

  return (
    <div ref={boxRef} id={id} role="tooltip" className={styles.box}>
      <Line line={title} />
      {body.map((line, index) => (
        <Line key={index} line={line} />
      ))}
      <div className={styles.footer}>
        {owned === undefined ? (
          <span>Not owned yet</span>
        ) : (
          <span>
            Owned: {formatCoins(owned.shardsSyphoned)} · Level {owned.level}
            {owned.valueRaw > 0 && <> · Value {formatCompact(owned.valueRaw)}</>}
          </span>
        )}
      </div>
    </div>
  );
}
