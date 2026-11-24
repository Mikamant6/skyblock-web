// Die Adresse /api/owned-items?name=...&profile=...&ids=ID1,ID2 (welche dieser Gegenstaende hat der Spieler?)
import { UserError } from "../../../lib/errors";
import { getOwnedItems } from "../../../lib/ownedItems";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const profile = searchParams.get("profile") ?? "";
  const ids = (searchParams.get("ids") ?? "").split(",").filter((id) => /^[A-Z0-9_:;-]{1,80}$/.test(id));

  try {
    return Response.json(await getOwnedItems(name, profile, ids));
  } catch (error) {
    if (error instanceof UserError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Unexpected error. Please try again later." }, { status: 500 });
  }
}
