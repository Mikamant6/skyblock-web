import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Fishing levels",
  description: "Your Fishing levels and rewards in Hypixel SkyBlock.",
};

export default function FishingLevelsPage() {
  return <SkillDetail skillKey="FISHING" view="levels" />;
}
