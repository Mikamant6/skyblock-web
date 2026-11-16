// Platzhalter-Seite: Vor dem oeffentlichen Start pruefen (lassen) und Verantwortlichen eintragen.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <article style={{ lineHeight: 1.7 }}>
      <h1>Datenschutzerklärung</h1>
      <h2>Verantwortlicher</h2>
      <p>[VOR NAME, ANSCHRIFT, E-MAIL] (siehe Impressum)</p>
      <h2>Hosting</h2>
      <p>
        Diese Website wird bei Vercel Inc. gehostet. Beim Aufruf verarbeitet der Hoster technisch
        notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite) in Server-Logs.
      </p>
      <h2>Abfrage von Spielerdaten</h2>
      <p>
        Wenn du einen Minecraft-Namen und ein Profil eingibst, fragt unser Server öffentlich
        verfügbare Daten bei Mojang (Name → UUID) und Hypixel (SkyBlock-Profil) ab und zeigt sie an.
        Diese Daten werden kurzzeitig zwischengespeichert (Minuten bis Stunden) und nicht dauerhaft
        gespeichert.
      </p>
      <h2>Lokaler Speicher</h2>
      <p>
        Dein zuletzt eingegebener Name und Profilname werden in deinem Browser (localStorage)
        gespeichert, damit sie beim nächsten Besuch vorausgefüllt sind. Sie werden nicht an uns
        übertragen. Du kannst sie über die Browser-Einstellungen löschen.
      </p>
      <h2>Deine Rechte</h2>
      <p>
        Du hast Rechte auf Auskunft, Berichtigung, Löschung und Beschwerde bei einer
        Aufsichtsbehörde. Schreibe dazu an die Adresse im Impressum.
      </p>
      <p>
        <em>Stand: Entwurf. Bitte vor dem öffentlichen Start prüfen und ergänzen.</em>
      </p>
    </article>
  );
}
