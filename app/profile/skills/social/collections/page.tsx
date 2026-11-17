import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Social collections",
  description: "Your Social collections in Hypixel SkyBlock.",
};

export default function SocialCollectionsPage() {
  return <SkillDetail skillKey="SOCIAL" view="collections" />;
}
