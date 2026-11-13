// Die Adresse /api/skin?uuid=... liefert das Skin-PNG des Spielers.
import { UserError } from "../../../lib/errors";
import { getSkinPng } from "../../../lib/skinService";

export async function GET(request: Request) {
  const uuid = (new URL(request.url).searchParams.get("uuid") ?? "").toLowerCase();
  try {
    const png = await getSkinPng(uuid);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof UserError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Unexpected error." }, { status: 500 });
  }
}
