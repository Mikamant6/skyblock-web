import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Fishing skill",
  description: "Your Fishing level, level rewards and progress in Hypixel SkyBlock.",
};

export default function FishingPage() {
  return <SkillDetail skillKey="FISHING" />;
}
