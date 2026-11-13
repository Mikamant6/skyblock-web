"use client";
// Das gemeinsame Gerüst jeder Seite: Seitenleiste mit Menue, Inhalt, Fuss.
// Am Handy ist die Seitenleiste ausgeblendet und wird ueber einen Knopf geoeffnet.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import styles from "./AppShell.module.css";
import { NAV, type NavItem } from "./navigation";
import { useProfile } from "./profile/ProfileProvider";
import ThemePicker from "./ThemePicker";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Die Seitenleiste erscheint erst, nachdem ein Profil geladen wurde
  const { hasProfile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  // Von Hand auf- oder zugeklappte Menuepunkte. Ohne Eintrag gilt: offen,
  // wenn die aktuelle Seite zu diesem Bereich gehoert.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const closeMenu = () => setMenuOpen(false);

  function isSectionActive(item: NavItem): boolean {
    return item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  }

  return (
    <div className={styles.shell} data-sidebar={hasProfile}>
      <header className={styles.topbar}>
        {hasProfile && (
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        )}
        <Link href="/" className={styles.brandSmall}>
          flawlesssb
        </Link>
        {/* Ohne Seitenleiste steht die Theme-Wahl hier oben */}
        {!hasProfile && (
          <div className={styles.topbarTools}>
            <ThemePicker />
          </div>
        )}
      </header>

      {hasProfile && menuOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      {hasProfile && (
      <aside id="sidebar" className={styles.sidebar} data-open={menuOpen}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          flawlesssb
        </Link>

        <nav aria-label="Main navigation">
          <ul className={styles.navList}>
            {NAV.map((item) => {
              const active = isSectionActive(item);
              const hasChildren = item.children !== undefined;
              const open = hasChildren && (toggled[item.id] ?? active);

              return (
                <li key={item.id}>
                  <div className={styles.navRow} data-active={active}>
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                    {hasChildren && (
                      <button
                        type="button"
                        className={styles.chevron}
                        aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
                        aria-expanded={open}
                        data-open={open}
                        onClick={() =>
                          setToggled((previous) => ({ ...previous, [item.id]: !open }))
                        }
                      >
                        ▾
                      </button>
                    )}
                  </div>

                  {hasChildren && open && (
                    <ul className={styles.subList}>
                      {item.children!.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={styles.subLink}
                            data-active={pathname === child.href}
                            aria-current={pathname === child.href ? "page" : undefined}
                            onClick={closeMenu}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.sidebarFoot}>
          <ThemePicker />
        </div>
      </aside>
      )}

      <div className={styles.main}>
        <main className={styles.content}>{children}</main>
        <footer className={styles.footer}>
          <p>
            Beta: values may be wrong, especially for shards that were added
            recently. Not affiliated with or endorsed by Hypixel or Mojang.
            Prices and profile data come from the Hypixel API. Shard data is
            partly based on the Hypixel SkyBlock Wiki (CC BY-NC-SA 3.0).
            Networth is calculated with the SkyHelper-Networth library.
          </p>
        </footer>
      </div>
    </div>
  );
}
