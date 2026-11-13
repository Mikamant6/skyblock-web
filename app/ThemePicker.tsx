"use client";
// Auswahlfenster fuer das Farbschema. Solange es nur ein Schema gibt
// (Standard), wird kein Knopf angezeigt.
// Das gewaehlte Schema steht als data-theme am <html>-Element; die Farben
// dazu stehen in globals.css. Die Wahl wird im Browser gemerkt (localStorage).

import { useEffect, useRef, useState } from "react";
import styles from "./ThemePicker.module.css";

// Neue Schemata (z. B. Weihnachten) hier eintragen und in globals.css die
// passenden Farben ergaenzen. "default" bedeutet: kein data-theme gesetzt.
const THEMES = [
  { id: "default", label: "Standard", hint: "Follows your device (light or dark)", swatch: "#2f9e6f" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export default function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>("default");
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Beim Laden das schon gesetzte Schema uebernehmen (setzt das kleine Skript im <head>)
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isThemeId(current)) setTheme(current);
  }, []);

  function choose(next: ThemeId) {
    setTheme(next);
    if (next === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Speichern ist nur eine Bequemlichkeit; ohne Speicher gilt die Wahl bis zum Neuladen
    }
  }

  // Mit nur einem Schema gibt es nichts auszuwaehlen
  if (THEMES.length < 2) return null;

  return (
    <>
      <button type="button" className={styles.openButton} onClick={() => dialogRef.current?.showModal()}>
        Theme
      </button>

      {/* <dialog> bringt Esc zum Schliessen und Fokus-Verwaltung selbst mit */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="theme-title"
        onClick={(event) => {
          // Klick auf den abgedunkelten Hintergrund schliesst das Fenster
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <h2 id="theme-title" className={styles.title}>
          Choose a theme
        </h2>
        <div className={styles.options} role="radiogroup" aria-labelledby="theme-title">
          {THEMES.map((option) => (
            <label key={option.id} className={styles.option} data-selected={theme === option.id}>
              <input
                type="radio"
                name="theme"
                value={option.id}
                checked={theme === option.id}
                onChange={() => choose(option.id)}
              />
              <span className={styles.swatch} style={{ background: option.swatch }} aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
            </label>
          ))}
        </div>
        <button type="button" className={styles.closeButton} onClick={() => dialogRef.current?.close()}>
          Done
        </button>
      </dialog>
    </>
  );
}
