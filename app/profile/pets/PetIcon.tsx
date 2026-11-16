"use client";
// Bild eines Pets aus public/pets/<key>.png (geladen mit scripts/fetchPetAssets.ts).
// Fehlt die Datei, erscheint ein Platzhalter mit dem Anfangsbuchstaben.
import { useState } from "react";
import { petKey } from "../../../lib/petWikiParser";
import styles from "../extras/Extras.module.css";

export default function PetIcon({ type, name }: { type: string; name: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <span className={styles.petIconFallback} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.petIcon}
      src={`/pets/${petKey(type)}.png`}
      alt=""
      width={56}
      height={56}
      loading="lazy"
      onError={() => setMissing(true)}
    />
  );
}
