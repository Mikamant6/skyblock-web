import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Foraging collections",
  description: "Your Foraging collections in Hypixel SkyBlock.",
};

export default function ForagingCollectionsPage() {
  return <SkillDetail skillKey="FORAGING" view="collections" />;
}
