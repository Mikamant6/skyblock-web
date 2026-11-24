// Level-Guide eines Skills (Adresse z. B. /profile/guides/farming). Unbekannte Skills ergeben eine 404-Seite.
import { notFound } from "next/navigation";
import { skillWikiName } from "../../../../lib/shardSkills";
import { SKILL_ORDER, skillSlug } from "../../../../lib/skillMeta";
import LevelGuideView from "../LevelGuideView";

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
    title: `${skillWikiName(key)} level guide`,
    description: `Which equipment you need for each ${skillWikiName(key)} level range in Hypixel SkyBlock.`,
  };
}

export default async function SkillGuidePage({ params }: Props) {
  const key = skillKeyOf((await params).skill);
  if (key === undefined) notFound();
  return <LevelGuideView skillKey={key} />;
}
