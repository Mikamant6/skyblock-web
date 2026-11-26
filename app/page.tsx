// Die Startseite: Eingabe von Name und Profil (siehe HomeEntry.tsx).
import HomeEntry from "./HomeEntry";

export const metadata = {
  title: { absolute: "FlawlessSB - Hypixel SkyBlock networth and progress" },
  description:
    "Networth and shard value of your Hypixel SkyBlock profile, calculated automatically from the Hypixel API.",
};

export default function Home() {
  return <HomeEntry />;
}
