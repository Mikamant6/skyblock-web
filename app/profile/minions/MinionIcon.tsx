"use client";
// Bild eines Minions; ohne Bild oder bei Ladefehler erscheint der Anfangsbuchstabe.
import { useState } from "react";
import { minionIconPath } from "../../../lib/minionIcons";
import styles from "../extras/Extras.module.css";

export default function MinionIcon({ minionKey, name, tier }: { minionKey: string; name: string; tier: number }) {
  const [failed, setFailed] = useState(false);
  const src = minionIconPath(minionKey, tier);
  if (src === null || failed) {
    return (
      <span className={styles.petIconFallback} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.petIcon} src={src} alt="" width={56} height={56} loading="lazy" onError={() => setFailed(true)} />;
}
