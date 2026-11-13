// Gemeinsames Layout fuer /profile und alle Unterseiten (Overview, Shards, ...):
// Titel und Eingabeformular. Der geteilte Zustand liegt weiter oben (Root-Layout).
import type { ReactNode } from "react";
import styles from "../calculator.module.css";
import ProfileForm from "./ProfileForm";
import ProfileGate from "./ProfileGate";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileGate>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Player profile <span className={styles.beta}>Beta</span>
        </h1>
        <p className={styles.subtitle}>
          Networth and progress of the selected profile. You can look up another
          player below.
        </p>
      </header>
      <ProfileForm />
      <div className={styles.result}>{children}</div>
    </ProfileGate>
  );
}
