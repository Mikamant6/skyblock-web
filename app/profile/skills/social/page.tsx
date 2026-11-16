import SkillDetail from "../SkillDetail";

export const metadata = {
  title: "Social skill",
  description: "Your Social level, level rewards and progress in Hypixel SkyBlock.",
};

export default function SocialPage() {
  return <SkillDetail skillKey="SOCIAL" />;
}
