import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Alchemy collections",
  description: "Your Alchemy collections in Hypixel SkyBlock.",
};

export default function AlchemyCollectionsPage() {
  return <SkillDetail skillKey="ALCHEMY" view="collections" />;
}
