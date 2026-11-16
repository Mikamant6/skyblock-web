// Platzhalter-Seite: Die Angaben (Name, Anschrift, E-Mail) muss der Betreiber selbst eintragen.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <article style={{ lineHeight: 1.7 }}>
      <h1>Impressum</h1>
      <p>Angaben gemäß § 5 DDG</p>
      <p>
        [VOR NAME]
        <br />
        [STRASSE UND HAUSNUMMER]
        <br />
        [PLZ ORT]
      </p>
      <p>Kontakt: [E-MAIL-ADRESSE]</p>
      <p>
        Dies ist ein privates, nicht-kommerzielles Fan-Projekt. Es steht in keiner Verbindung zu
        Hypixel oder Mojang.
      </p>
    </article>
  );
}
