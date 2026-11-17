import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Farming collections",
  description: "Your Farming collections in Hypixel SkyBlock.",
};

export default function FarmingCollectionsPage() {
  return <SkillDetail skillKey="FARMING" view="collections" />;
}
