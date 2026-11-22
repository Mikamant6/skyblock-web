import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Runecrafting guides: shards",
  description: "Attribute shards that belong to the Runecrafting skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function RunecraftingGuidesPage() {
  return <ShardsGuideView skillKey="RUNECRAFTING" />;
}
