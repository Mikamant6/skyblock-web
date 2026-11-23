"use client";
// Skill-Auswahl ueber allen Guides: Uebersicht und ein Reiter pro Skill (in der Farbe des Skills).
// Nutzt die gleichen Reiter-Styles wie die Skill-Seiten.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { getSkillMeta, SKILL_ORDER, skillSlug } from "../../../lib/skillMeta";
import styles from "../skills/SkillTabs.module.css";

export default function GuideSkillTabs() {
  const pathname = usePathname();
  const tabs = [
    { label: "Overview", href: "/profile/guides", color: "var(--accent, #f2c260)" },
    ...SKILL_ORDER.map((key) => ({
      label: key.charAt(0) + key.slice(1).toLowerCase(),
      href: `/profile/guides/${skillSlug(key)}`,
      color: getSkillMeta(key).color,
    })),
  ];

  return (
    <nav className={styles.tabs} aria-label="Choose a skill">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={styles.tab}
          data-active={pathname === tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
          style={{ "--tab-color": tab.color } as CSSProperties}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
