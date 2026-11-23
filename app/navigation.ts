// Die Menue-Struktur der Seitenleiste an EINER Stelle. Ein neuer Bereich
// (z. B. Bazaar) oder Unterpunkt (z. B. Skills) ist hier eine neue Zeile.
// Punkte mit "children" sind ausklappbar (beliebig tief verschachtelbar).

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

// Seiten, die mehr Platz in der Breite bekommen (z. B. Raster mit vielen Feldern)
export const WIDE_PATHS: string[] = ["/profile/shards"];

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Profile",
    href: "/profile",
    children: [
      { label: "Overview", href: "/profile" },
      {
        label: "Skills",
        href: "/profile/skills",
        children: [
          { label: "Overview", href: "/profile/skills" },
          ...["Farming", "Mining", "Combat", "Foraging", "Fishing", "Enchanting", "Alchemy", "Taming", "Carpentry", "Runecrafting", "Social"].map(
            (name) => ({ label: name, href: `/profile/skills/${name.toLowerCase()}` }),
          ),
        ],
      },
      {
        label: "Guides",
        href: "/profile/guides",
        children: [
          { label: "Overview", href: "/profile/guides" },
          ...["Farming", "Mining", "Combat", "Foraging", "Fishing", "Enchanting", "Alchemy", "Taming", "Carpentry", "Runecrafting", "Social"].map(
            (name) => ({ label: name, href: `/profile/guides/${name.toLowerCase()}` }),
          ),
        ],
      },
      { label: "Slayers", href: "/profile/slayers" },
      { label: "Dungeons", href: "/profile/dungeons" },
      { label: "Pets", href: "/profile/pets" },
      { label: "Minions", href: "/profile/minions" },
      {
        label: "Shards",
        href: "/profile/shards",
        children: [
          { label: "Collection", href: "/profile/shards" },
          { label: "Value", href: "/profile/shards/value" },
        ],
      },
    ],
  },
];
