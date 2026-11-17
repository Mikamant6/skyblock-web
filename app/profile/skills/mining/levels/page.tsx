import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Mining levels",
  description: "Your Mining levels and rewards in Hypixel SkyBlock.",
};

export default function MiningLevelsPage() {
  return <SkillDetail skillKey="MINING" view="levels" />;
}
