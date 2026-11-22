"use client";
// Tabs innerhalb eines Skills: Overview, Levels & rewards, Collections (nur wenn der Skill welche hat)
// und - bei Combat/Taming - Links zu verwandten Seiten mit echten Daten.
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { getSkillMeta, skillSlug } from "../../../lib/skillMeta";
import type { SkillExtra } from "../../../lib/skillExtras";
import styles from "./SkillTabs.module.css";

export default function SkillSubTabs({
  skillKey,
  hasCollections,
  extras,
}: {
  skillKey: string;
  hasCollections: boolean;
  extras: SkillExtra[];
}) {
  const pathname = usePathname();
  const base = `/profile/skills/${skillSlug(skillKey)}`;
  const color = getSkillMeta(skillKey).color;
  const tabs = [
    { label: "Overview", href: base },
    { label: "Levels & rewards", href: `${base}/levels` },
    ...(hasCollections ? [{ label: "Collections", href: `${base}/collections` }] : []),
    // Foraging: Jade Dragon (billigste Shards zum Maximieren)
    ...(skillKey === "FORAGING" ? [{ label: "Jade Dragon", href: `${base}/jade-dragon` }] : []),
  ];

  return (
    <nav className={styles.tabs} aria-label="Skill sections" style={{ "--tab-color": color } as CSSProperties}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={styles.tab}
          data-active={pathname === tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
      {extras.map((extra) => (
        <Link key={extra.href} href={extra.href} className={styles.tab}>
          {extra.label} <span aria-hidden="true">↗</span>
        </Link>
      ))}
    </nav>
  );
}
