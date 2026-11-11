// Ein Fehler, dessen Text wir dem Besucher der Seite direkt anzeigen duerfen
// (zum Beispiel "Spieler nicht gefunden"). Alles andere sind unerwartete
// Fehler, deren Details nur im Server-Protokoll stehen sollen.
export class UserError extends Error {
  status: number; // HTTP-Statuscode, mit dem der Server antwortet

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "UserError";
    this.status = status;
  }
}
