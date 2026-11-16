import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Farming skill",
  description: "Your Farming level, level rewards and progress in Hypixel SkyBlock.",
};

export default function FarmingPage() {
  return <SkillDetail skillKey="FARMING" />;
}
