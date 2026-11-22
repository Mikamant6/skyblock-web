import ShardsGuideView from "../../ShardsGuideView";

export const metadata = {
  title: "Social guides: shards",
  description: "Attribute shards that belong to the Social skill in Hypixel SkyBlock, with your level and the cost to max them.",
};

export default function SocialGuidesPage() {
  return <ShardsGuideView skillKey="SOCIAL" />;
}
