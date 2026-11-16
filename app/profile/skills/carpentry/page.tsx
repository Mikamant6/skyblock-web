import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Carpentry skill",
  description: "Your Carpentry level, level rewards and progress in Hypixel SkyBlock.",
};

export default function CarpentryPage() {
  return <SkillDetail skillKey="CARPENTRY" />;
}
