import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Runecrafting skill",
  description: "Your Runecrafting level, level rewards and progress in Hypixel SkyBlock.",
};

export default function RunecraftingPage() {
  return <SkillDetail skillKey="RUNECRAFTING" />;
}
