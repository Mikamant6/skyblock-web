import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Mining skill",
  description: "Your Mining level, level rewards and progress in Hypixel SkyBlock.",
};

export default function MiningPage() {
  return <SkillDetail skillKey="MINING" />;
}
