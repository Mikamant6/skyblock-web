"use client";
// Unterseite "Skills": Skill-Average oben, darunter ein Feld pro Skill mit
// Level, Fortschrittsbalken und der XP, die bis zum naechsten Level fehlt.

import Link from "next/link";
import type { CSSProperties } from "react";
import { getSkillMeta, skillSlug } from "../../../lib/skillMeta";
import Panel from "../../Panel.module.css";
import calc from "../../calculator.module.css";
import { formatCoins } from "../../format";
import { useProfile } from "../ProfileProvider";
import styles from "./SkillsView.module.css";

export default function SkillsView() {
  const { skills } = useProfile();

  return (
    <>
      <div aria-live="polite">
        {skills.status === "idle" && (
          <div className={calc.notice} role="note">
            Enter a Minecraft name and a profile name and press Calculate.
          </div>
        )}
        {skills.status === "loading" && (
          <div className={calc.notice} role="status">
            Loading skills...
          </div>
        )}
        {skills.status === "error" && (
          <div className={calc.error} role="alert">
            {skills.message}
          </div>
        )}
      </div>

      {skills.status === "done" && (
        <>
          <h2 className={styles.heading}>Skills</h2>

          <div className={`${Panel.panel} ${styles.summary}`}>
            <div className={styles.numberItem}>
              <span>Skill average</span>
              <strong>{skills.data.average.toFixed(2)}</strong>
            </div>
            <p className={styles.hint}>
              Runecrafting and Social are not part of the average.
            </p>
          </div>

          <div className={Panel.panel}>
            <ul className={styles.grid}>
              {skills.data.skills.map((skill) => (
                <li key={skill.key}>
                  <Link
                    href={`/profile/skills/${skillSlug(skill.key)}`}
                    className={styles.tile}
                    style={{ "--skill-color": getSkillMeta(skill.key).color } as CSSProperties}
                  >
                    <div className={styles.top}>
                      <span className={styles.name}>{skill.name}</span>
                      <span className={styles.level}>
                        Lv {skill.level}
                        <small> / {skill.maxLevel}</small>
                      </span>
                    </div>
                    <div
                      className={styles.bar}
                      role="progressbar"
                      aria-label={`${skill.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(skill.fraction * 100)}
                    >
                      <div className={styles.barFill} style={{ width: `${skill.fraction * 100}%` }} />
                    </div>
                    <span className={styles.detail}>
                      {skill.xpForNextLevel === null
                        ? `Max level reached · ${formatCoins(skill.xp)} XP`
                        : `${formatCoins(skill.xpIntoLevel)} / ${formatCoins(skill.xpForNextLevel)} XP to Lv ${skill.level + 1}`}
                    </span>
                    {!skill.countsForAverage && <span className={styles.note}>Not in average</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
