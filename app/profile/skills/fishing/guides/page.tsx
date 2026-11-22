import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Fishing guides: shards",
  description: "Attribute shards that belong to the Fishing skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function FishingGuidesPage() {
  return <ShardsGuideView skillKey="FISHING" />;
}
