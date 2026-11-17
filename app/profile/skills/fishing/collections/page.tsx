import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Fishing collections",
  description: "Your Fishing collections in Hypixel SkyBlock.",
};

export default function FishingCollectionsPage() {
  return <SkillDetail skillKey="FISHING" view="collections" />;
}
