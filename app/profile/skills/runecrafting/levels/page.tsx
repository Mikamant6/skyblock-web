import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Runecrafting levels",
  description: "Your Runecrafting levels and rewards in Hypixel SkyBlock.",
};

export default function RunecraftingLevelsPage() {
  return <SkillDetail skillKey="RUNECRAFTING" view="levels" />;
}
