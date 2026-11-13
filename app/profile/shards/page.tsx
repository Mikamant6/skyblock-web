import ShardCollection from "./ShardCollection";

export const metadata = {
  title: "Shard collection",
  description:
    "Every Hypixel SkyBlock shard with its attribute, and which ones you own.",
};

export default function ShardsPage() {
  return <ShardCollection />;
}
