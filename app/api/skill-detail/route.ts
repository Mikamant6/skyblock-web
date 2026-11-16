// Die Adresse /api/skill-detail?name=...&profile=...&skill=FARMING
import { UserError } from "../../../lib/errors";
import { getSkillDetail } from "../../../lib/skillDetailService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";
  const skill = searchParams.get("skill") ?? "";

  try {
    return Response.json(await getSkillDetail(name, profile, skill));
  } catch (error) {
    if (error instanceof UserError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json(
      { error: "Unexpected error. Please try again later." },
      { status: 500 },
    );
  }
}
