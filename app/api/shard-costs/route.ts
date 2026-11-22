// Die Adresse /api/shard-costs?name=...&profile=... (Kosten, jeden Shard auf Level 10 zu bringen)
import { UserError } from "../../../lib/errors";
import { getShardMaxCosts } from "../../../lib/shardMaxCostService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";

  try {
    return Response.json(await getShardMaxCosts(name, profile));
  } catch (error) {
    if (error instanceof UserError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Unexpected error. Please try again later." }, { status: 500 });
  }
}
