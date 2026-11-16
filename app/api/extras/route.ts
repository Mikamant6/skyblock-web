// Die Adresse /api/extras?name=...&profile=... (Minions, Pets, Dungeons)
import { UserError } from "../../../lib/errors";
import { getExtras } from "../../../lib/extrasService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";

  try {
    return Response.json(await getExtras(name, profile));
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
