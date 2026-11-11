// Die Adresse /api/shards?name=...&profile=...
// Der Browser fragt hier an, der Server holt die Daten (mit dem geheimen Key)
// und schickt nur das Ergebnis zurueck.
import { UserError } from "../../../lib/errors";
import { getShardNetworth } from "../../../lib/shardService";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";

  try {
    const result = await getShardNetworth(name, profile);
    return Response.json(result);
  } catch (error) {
    if (error instanceof UserError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    // Unerwartet: Details nur ins Server-Protokoll, nicht zum Besucher
    console.error(error);
    return Response.json(
      { error: "Unexpected error. Please try again later." },
      { status: 500 },
    );
  }
}
