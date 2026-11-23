// Guides eines Skills (Adresse z. B. /profile/guides/farming). Unbekannte Skills ergeben eine 404-Seite.
import { notFound } from "next/navigation";
import { skillWikiName } from "../../../../lib/shardSkills";
import { SKILL_ORDER, skillSlug } from "../../../../lib/skillMeta";
import ShardsGuideView from "../../skills/ShardsGuideView";

type Props = { params: Promise<{ skill: string }> };

function skillKeyOf(slug: string): string | undefined {
  return SKILL_ORDER.find((key) => skillSlug(key) === slug);
}

export function generateStaticParams() {
  return SKILL_ORDER.map((key) => ({ skill: skillSlug(key) }));
}

export async function generateMetadata({ params }: Props) {
  const key = skillKeyOf((await params).skill);
  if (key === undefined) return { title: "Guides" };
  return {
    title: `${skillWikiName(key)} guides`,
    description: `Attribute shards that belong to the ${skillWikiName(key)} skill in Hypixel SkyBlock, with your level and the cost to max them.`,
  };
}

export default async function SkillGuidesPage({ params }: Props) {
  const key = skillKeyOf((await params).skill);
  if (key === undefined) notFound();
  return <ShardsGuideView skillKey={key} />;
}
