// Die Startseite. Sie ist selbst ganz kurz: die eigentliche Arbeit macht der
// Shard-Rechner, der im Browser laeuft (ShardCalculator.tsx).
import ShardCalculator from "./ShardCalculator";

// Titel und Beschreibung im Browser-Tab und bei Suchmaschinen
export const metadata = {
  title: "SkyBlock Shard Calculator",
  description:
    "Estimate the Bazaar value of all shards you have syphoned in Hypixel SkyBlock.",
};

export default function Home() {
  return <ShardCalculator />;
}
