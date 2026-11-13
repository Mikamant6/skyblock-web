// Gemeinsames Layout fuer /profile und alle Unterseiten (Overview, Shards, ...):
// Kopf mit Skin-Bild und Spielername. Die Eingabe von Name und Profil gibt es nur
// auf der Startseite; der geteilte Zustand liegt weiter oben (Root-Layout).
import type { ReactNode } from "react";
import styles from "../calculator.module.css";
import ProfileGate from "./ProfileGate";
import ProfileHeading from "./ProfileHeading";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileGate>
      <header className={styles.header}>
        <ProfileHeading />
      </header>
      <div className={styles.result}>{children}</div>
    </ProfileGate>
  );
}
