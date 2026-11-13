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
