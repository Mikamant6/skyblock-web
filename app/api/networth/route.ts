// Die Adresse /api/networth?name=...&profile=...
// Gibt den Networth OHNE Shards zurueck. Die Shards kommen getrennt von
// /api/shards, damit ein Fehler im einen Teil den anderen nicht blockiert.
import { UserError } from "../../../lib/errors";
import { getNetworth } from "../../../lib/networthService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";

  try {
    const result = await getNetworth(name, profile);
    return Response.json(result);
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
