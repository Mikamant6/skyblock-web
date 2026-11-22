import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Enchanting guides: shards",
  description: "Attribute shards that belong to the Enchanting skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function EnchantingGuidesPage() {
  return <ShardsGuideView skillKey="ENCHANTING" />;
}
