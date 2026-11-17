import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Taming collections",
  description: "Your Taming collections in Hypixel SkyBlock.",
};

export default function TamingCollectionsPage() {
  return <SkillDetail skillKey="TAMING" view="collections" />;
}
