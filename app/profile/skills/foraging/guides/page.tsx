import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Foraging guides: shards",
  description: "Attribute shards that belong to the Foraging skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function ForagingGuidesPage() {
  return <ShardsGuideView skillKey="FORAGING" />;
}
