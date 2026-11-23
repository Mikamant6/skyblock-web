// Die Angaben des Betreibers fuer Impressum und Datenschutz an EINER Stelle.
// Hier eintragen, dann stimmen beide Seiten. Leere Felder zeigen auf der Seite einen sichtbaren Platzhalter.
// Hinweis: Das Impressum verlangt eine ladungsfaehige Anschrift (Postfach reicht nicht) und eine E-Mail-Adresse,
// die wirklich gelesen wird.

export const LEGAL = {
  name: "Mika David Berard", // vollstaendiger Name, z. B. "Max Mustermann"
  street: "", // Strasse und Hausnummer
  city: "", // PLZ und Ort
  email: "flawlesssb@web.de", // Kontakt-E-Mail
  lastUpdated: "23.11.2026", // Datum der letzten Aenderung der Texte
};

// Platzhalter, solange ein Feld leer ist (damit die Luecke nicht unbemerkt online geht)
export function legalValue(value: string, label: string): string {
  return value.trim() === "" ? `[${label} EINTRAGEN]` : value;
}
