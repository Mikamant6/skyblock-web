import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Alchemy guides: shards",
  description: "Attribute shards that belong to the Alchemy skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function AlchemyGuidesPage() {
  return <ShardsGuideView skillKey="ALCHEMY" />;
}
