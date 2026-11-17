import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Enchanting collections",
  description: "Your Enchanting collections in Hypixel SkyBlock.",
};

export default function EnchantingCollectionsPage() {
  return <SkillDetail skillKey="ENCHANTING" view="collections" />;
}
