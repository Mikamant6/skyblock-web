import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Combat levels",
  description: "Your Combat levels and rewards in Hypixel SkyBlock.",
};

export default function CombatLevelsPage() {
  return <SkillDetail skillKey="COMBAT" view="levels" />;
}
