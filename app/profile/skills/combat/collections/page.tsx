import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Combat collections",
  description: "Your Combat collections in Hypixel SkyBlock.",
};

export default function CombatCollectionsPage() {
  return <SkillDetail skillKey="COMBAT" view="collections" />;
}
