import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Carpentry levels",
  description: "Your Carpentry levels and rewards in Hypixel SkyBlock.",
};

export default function CarpentryLevelsPage() {
  return <SkillDetail skillKey="CARPENTRY" view="levels" />;
}
