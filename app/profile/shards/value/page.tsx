import ShardsView from "../ShardsView";

export const metadata = {
  title: "Shard value",
  description:
    "Estimate the Bazaar value of all shards you have syphoned in Hypixel SkyBlock.",
};

// Next.js-Entwicklungshinweis "Instant": diese Seite wird absichtlich nicht auf sofortige Navigation geprueft
export const instant = false;

export default function ShardValuePage() {
  return <ShardsView />;
}
