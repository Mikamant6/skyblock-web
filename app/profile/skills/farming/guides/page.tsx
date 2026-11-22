import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Farming guides: shards",
  description: "Attribute shards that belong to the Farming skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function FarmingGuidesPage() {
  return <ShardsGuideView skillKey="FARMING" />;
}
