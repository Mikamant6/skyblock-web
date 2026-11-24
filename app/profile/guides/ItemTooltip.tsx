"use client";
// Tooltip fuer ein Ausruestungsteil: sieht aus wie im Spiel (gleicher dunkler Kasten wie bei den Shards).
// Wird einmal pro Seite gezeichnet und neben das jeweilige Teil gesetzt, ohne den Bildschirmrand zu verlassen.

import { useLayoutEffect, useRef } from "react";
import { buildPieceTooltip } from "../../../lib/itemTooltip";
import type { GearPiece } from "../../../lib/levelGuides";
import type { TextLine } from "../../../lib/minecraftText";
import { formatCoins } from "../../format";
import styles from "../../ShardTooltip.module.css";

type Props = {
  id: string; // fuer aria-describedby
  piece: GearPiece;
  places: string[] | undefined; // wo der Spieler das Teil hat; undefined = nicht besessen; null-Zustand siehe "known"
  price: number | undefined; // Preis in Coins (nur fuer nicht besessene Teile gezeigt)
  known: boolean; // false = Besitz unbekannt (Daten laden noch oder nicht verfuegbar): Fusszeile weglassen
  anchor: DOMRect; // Position des Teils im Fenster
};

const GAP = 8;
const MARGIN = 8;

function Line({ line }: { line: TextLine }) {
  if (line.length === 0) return <div className={styles.blank} />;
  return (
    <div className={styles.line}>
      {line.map((segment, index) => (
        <span key={index} style={{ color: segment.color, fontWeight: segment.bold ? 700 : 400 }}>
          {segment.text}
        </span>
      ))}
    </div>
  );
}

export default function ItemTooltip({ id, piece, places, price, known, anchor }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { title, body } = buildPieceTooltip(piece);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box === null) return;
    const { width, height } = box.getBoundingClientRect();
    let left = anchor.left + anchor.width / 2 - width / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));
    let top = anchor.bottom + GAP;
    if (top + height > window.innerHeight - MARGIN) top = anchor.top - GAP - height;
    top = Math.max(MARGIN, top);
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.visibility = "visible";
  }, [anchor, piece]);

  return (
    <div ref={boxRef} id={id} role="tooltip" className={styles.box}>
      <Line line={title} />
      {body.map((line, index) => (
        <Line key={index} line={line} />
      ))}
      {known && (
        <div className={styles.footer}>
          {places === undefined ? <span>Not owned yet</span> : <span>Owned ({places.join(", ")})</span>}
          {places === undefined && price !== undefined && (
            <div>
              Lowest price{piece.id.startsWith("PET:") ? " (level 1 pet)" : ""}: <span style={{ color: "#FFAA00" }}>{formatCoins(price)} coins</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
