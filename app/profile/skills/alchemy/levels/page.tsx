import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Alchemy levels",
  description: "Your Alchemy levels and rewards in Hypixel SkyBlock.",
};

export default function AlchemyLevelsPage() {
  return <SkillDetail skillKey="ALCHEMY" view="levels" />;
}
