import SkillDetail from "../../SkillDetail";

export const metadata = {
  title: "Social levels",
  description: "Your Social levels and rewards in Hypixel SkyBlock.",
};

export default function SocialLevelsPage() {
  return <SkillDetail skillKey="SOCIAL" view="levels" />;
}
