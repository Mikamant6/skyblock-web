// Die Menue-Struktur der Seitenleiste an EINER Stelle. Ein neuer Bereich
// (z. B. Bazaar) oder Unterpunkt (z. B. Skills) ist hier eine neue Zeile.

export type NavChild = { label: string; href: string };
export type NavItem = {
  id: string;
  label: string;
  href: string;
  children?: NavChild[]; // Unterpunkte: der Punkt ist dann ausklappbar
};

export const NAV: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    children: [
      { label: "Overview", href: "/profile" },
      { label: "Shards", href: "/profile/shards" },
    ],
  },
];
