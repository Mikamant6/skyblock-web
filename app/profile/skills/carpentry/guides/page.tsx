import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Carpentry guides: shards",
  description: "Attribute shards that belong to the Carpentry skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function CarpentryGuidesPage() {
  return <ShardsGuideView skillKey="CARPENTRY" />;
}
