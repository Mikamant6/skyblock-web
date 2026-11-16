import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Enchanting skill",
  description: "Your Enchanting level, level rewards and progress in Hypixel SkyBlock.",
};

export default function EnchantingPage() {
  return <SkillDetail skillKey="ENCHANTING" />;
}
