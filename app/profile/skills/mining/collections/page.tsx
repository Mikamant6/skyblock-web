import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Mining collections",
  description: "Your Mining collections in Hypixel SkyBlock.",
};

export default function MiningCollectionsPage() {
  return <SkillDetail skillKey="MINING" view="collections" />;
}
