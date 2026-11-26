"use client";
// Umschalter fuer das Design, fest oben rechts: "Winter" (Standard), "Classic" (altes dunkles Design) oder "Slate" (schlicht grau).
// Das gewaehlte Design steht als data-theme am <html>-Element; die Farben dazu stehen in globals.css.
// Die Wahl wird im Browser gemerkt (localStorage). Ein neues Design: hier eintragen, in layout.tsx in der
// Liste "ok" und in globals.css die Farben ergaenzen. "default" bedeutet: kein data-theme gesetzt.

import { useEffect, useState } from "react";
import styles from "./ThemePicker.module.css";

const THEMES = [
  { id: "default", label: "Winter" },
  { id: "classic", label: "Classic" },
  { id: "slate", label: "Slate" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export default function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>("default");

  // Beim Laden das schon gesetzte Design uebernehmen (setzt das kleine Skript im <head>)
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

  return (
    <div className={styles.switch} role="group" aria-label="Design">
      {THEMES.map((option) => (
        <button
          key={option.id}
          type="button"
          className={styles.option}
          aria-pressed={theme === option.id}
          onClick={() => choose(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
