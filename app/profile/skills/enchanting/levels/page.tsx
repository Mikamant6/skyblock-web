import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Enchanting levels",
  description: "Your Enchanting levels and rewards in Hypixel SkyBlock.",
};

export default function EnchantingLevelsPage() {
  return <SkillDetail skillKey="ENCHANTING" view="levels" />;
}
