import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Taming skill",
  description: "Your Taming level, level rewards and progress in Hypixel SkyBlock.",
};

export default function TamingPage() {
  return <SkillDetail skillKey="TAMING" />;
}
