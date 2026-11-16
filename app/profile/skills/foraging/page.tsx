import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Foraging skill",
  description: "Your Foraging level, level rewards and progress in Hypixel SkyBlock.",
};

export default function ForagingPage() {
  return <SkillDetail skillKey="FORAGING" />;
}
