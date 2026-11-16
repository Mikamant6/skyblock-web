import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Alchemy skill",
  description: "Your Alchemy level, level rewards and progress in Hypixel SkyBlock.",
};

export default function AlchemyPage() {
  return <SkillDetail skillKey="ALCHEMY" />;
}
