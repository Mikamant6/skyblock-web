// Die Adresse /api/skills?name=...&profile=...
// Gibt Skill-Level und Fortschritt zurueck (eigene Adresse, damit ein Fehler
// hier Networth und Shards nicht blockiert).
import { UserError } from "../../../lib/errors";
import { getSkills } from "../../../lib/skillsService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";

  try {
    return Response.json(await getSkills(name, profile));
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
