import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Combat guides: shards",
  description: "Attribute shards that belong to the Combat skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function CombatGuidesPage() {
  return <ShardsGuideView skillKey="COMBAT" />;
}
