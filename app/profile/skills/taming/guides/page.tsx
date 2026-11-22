import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Taming guides: shards",
  description: "Attribute shards that belong to the Taming skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function TamingGuidesPage() {
  return <ShardsGuideView skillKey="TAMING" />;
}
