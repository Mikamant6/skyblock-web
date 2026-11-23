import type { CSSProperties } from "react";
import Link from "next/link";
import { shardCountForSkill, skillWikiName } from "../../../lib/shardSkills";
import { getSkillMeta, SKILL_ORDER, skillSlug } from "../../../lib/skillMeta";
import styles from "./GuidesOverview.module.css";

export const metadata = {
  title: "Guides",
  description: "Guides for every Hypixel SkyBlock skill: attribute shards and the cost to max them for your profile.",
};

export default function GuidesPage() {
  return (
    <>
      <p className={styles.intro}>
        Choose a skill to see its guides. Right now every skill has a shard guide with your level, your shards and the cost to max
        them. More guides (for example gear and progression) will follow.
      </p>
      <div className={styles.grid}>
        {SKILL_ORDER.map((key) => {
          const meta = getSkillMeta(key);
          const count = shardCountForSkill(key);
          return (
            <Link key={key} href={`/profile/guides/${skillSlug(key)}`} className={styles.card} style={{ "--skill-color": meta.color } as CSSProperties}>
              <h3>{skillWikiName(key)}</h3>
              <p>{meta.about}</p>
              <span className={styles.count}>{count > 0 ? `${count} shards` : "No shards"}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
