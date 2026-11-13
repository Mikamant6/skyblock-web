"use client";
// Eingabeformular (Minecraft-Name und Profil) mit Ueberschrift des Ergebnisses.
// Steht ueber allen Unterseiten von /profile.

import type { FormEvent } from "react";
import styles from "../calculator.module.css";
import { useProfile } from "./ProfileProvider";

export default function ProfileForm() {
  const {
    playerName,
    setPlayerName,
    profileName,
    setProfileName,
    loading,
    submit,
  } = useProfile();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Ohne das wuerde der Browser die ganze Seite neu laden
    event.preventDefault();
    submit();
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="player">Minecraft name</label>
          <input
            id="player"
            className={styles.input}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. Quantussy"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="profile">Profile name</label>
          <input
            id="profile"
            className={styles.input}
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. Blueberry"
            required
          />
        </div>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </form>

    </>
  );
}
