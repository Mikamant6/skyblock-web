// Eine Adresse unseres Servers abfragen (laeuft im Browser).
// Gibt entweder die Daten oder einen Fehlertext zurueck und wirft nie einen Fehler.

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function fetchApi<T>(
  path: string,
  query: URLSearchParams,
): Promise<FetchResult<T>> {
  try {
    const response = await fetch(`${path}?${query.toString()}`);
    const body = await response.json();
    if (!response.ok) {
      // Unser Server schickt bei Fehlern { error: "Text" }
      return {
        ok: false,
        message: typeof body.error === "string" ? body.error : "Something went wrong.",
      };
    }
    return { ok: true, data: body as T };
  } catch {
    return {
      ok: false,
      message: "Could not reach the server. Please check your connection and try again.",
    };
  }
}
