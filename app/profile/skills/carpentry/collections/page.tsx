import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Carpentry collections",
  description: "Your Carpentry collections in Hypixel SkyBlock.",
};

export default function CarpentryCollectionsPage() {
  return <SkillDetail skillKey="CARPENTRY" view="collections" />;
}
