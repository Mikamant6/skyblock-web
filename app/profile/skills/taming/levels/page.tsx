import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Taming levels",
  description: "Your Taming levels and rewards in Hypixel SkyBlock.",
};

export default function TamingLevelsPage() {
  return <SkillDetail skillKey="TAMING" view="levels" />;
}
