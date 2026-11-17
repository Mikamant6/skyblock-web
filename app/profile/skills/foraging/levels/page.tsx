import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Foraging levels",
  description: "Your Foraging levels and rewards in Hypixel SkyBlock.",
};

export default function ForagingLevelsPage() {
  return <SkillDetail skillKey="FORAGING" view="levels" />;
}
