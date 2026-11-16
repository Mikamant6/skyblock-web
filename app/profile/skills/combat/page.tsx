import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Combat skill",
  description: "Your Combat level, level rewards and progress in Hypixel SkyBlock.",
};

export default function CombatPage() {
  return <SkillDetail skillKey="COMBAT" />;
}
