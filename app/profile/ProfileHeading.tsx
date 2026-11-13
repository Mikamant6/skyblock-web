"use client";
// Kopf jeder Profil-Seite als Box: Skin-Kopf, Spielername, Profilname und
// ein paar Kennzahlen (Networth, Purse, Bank), sobald der Networth da ist.

import { formatCompact } from "../format";
import Panel from "../Panel.module.css";
import PlayerAvatar from "../PlayerAvatar";
import { grandTotal } from "../../lib/networthSummary";
import { useProfile } from "./ProfileProvider";
import styles from "./ProfileHeading.module.css";

export default function ProfileHeading() {
  const { subject, networth, shards } = useProfile();
  if (subject === null) return null;

  // Gesamt-Networth wie auf der Overview: ohne Shards + Shard-Rohwert
  let total: number | null = null;
  if (networth.status === "done" && shards.status === "done") {
    total = grandTotal(networth.data.networth, shards.data.totals.valueRaw);
  }

  return (
    <div className={`${Panel.panel} ${styles.bar}`}>
      <div className={styles.who}>
        <PlayerAvatar key={subject.uuid} uuid={subject.uuid} size={48} />
        <div>
          <h1 className={styles.name}>{subject.playerName}</h1>
          <span className={styles.profile}>{subject.profileName}</span>
        </div>
      </div>
      {networth.status === "done" && (
        <dl className={styles.stats}>
          {total !== null && <Stat label="Total networth" value={formatCompact(total)} />}
          <Stat label="Purse" value={formatCompact(networth.data.purse)} />
          <Stat label="Bank" value={formatCompact(networth.data.bank)} />
        </dl>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
