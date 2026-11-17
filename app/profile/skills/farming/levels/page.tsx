import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Farming levels",
  description: "Your Farming levels and rewards in Hypixel SkyBlock.",
};

export default function FarmingLevelsPage() {
  return <SkillDetail skillKey="FARMING" view="levels" />;
}
