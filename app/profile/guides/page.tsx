import type { CSSProperties } from "react";
import Link from "next/link";
import { getLevelGuide } from "../../../lib/levelGuides";
import { skillWikiName } from "../../../lib/shardSkills";
import { getSkillMeta, SKILL_ORDER, skillSlug } from "../../../lib/skillMeta";
import styles from "./GuidesOverview.module.css";

export const metadata = {
  title: "Guides",
  description: "Level guides for every Hypixel SkyBlock skill: which equipment you need for each level range.",
};

export default function GuidesPage() {
  return (
    <>
      <p className={styles.intro}>
        Choose a skill to see its level guide: for each level range, the equipment you need.
      </p>
      <div className={styles.grid}>
        {SKILL_ORDER.map((key) => {
          const meta = getSkillMeta(key);
          const count = getLevelGuide(key).ranges.length;
          return (
            <Link key={key} href={`/profile/guides/${skillSlug(key)}`} className={styles.card} style={{ "--skill-color": meta.color } as CSSProperties}>
              <h3>{skillWikiName(key)}</h3>
              <p>{meta.about}</p>
              <span className={styles.count}>{count > 0 ? `${count} level ranges` : "Coming soon"}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
