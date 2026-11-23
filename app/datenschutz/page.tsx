// Datenschutzerklaerung. Der Text beschreibt, was die Seite tatsaechlich tut (Stand siehe unten).
// Bei jeder neuen Funktion, die Daten verarbeitet (z. B. Datenbank, Statistik, Werbung), muss er angepasst werden.
import type { Metadata } from "next";
import { LEGAL, legalValue } from "../../lib/legalInfo";

export const metadata: Metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  return (
    <article style={{ lineHeight: 1.7 }}>
      <h1>Datenschutzerklärung</h1>

      <h2>1. Verantwortlicher</h2>
      <p>
        {legalValue(LEGAL.name, "NAME")}
        {LEGAL.street.trim() !== "" && (
          <>
            , {LEGAL.street}, {LEGAL.city}
          </>
        )}
        <br />
        E-Mail: {legalValue(LEGAL.email, "E-MAIL-ADRESSE")}
      </p>

      <h2>2. Überblick</h2>
      <p>
        Du brauchst bei FlawlessSB kein Konto. Wir setzen keine Cookies, keine Analyse- oder
        Tracking-Dienste und keine Werbung ein. Wir speichern keine Eingaben von Besuchern in einer
        Datenbank. Die folgenden Abschnitte erklären, welche Daten trotzdem verarbeitet werden.
      </p>

      <h2>3. Hosting und Server-Logdaten</h2>
      <p>
        Die Seite wird bei Vercel Inc. (USA) gehostet. Beim Aufruf verarbeitet der Hoster technisch
        notwendige Daten in Server-Logs, insbesondere deine IP-Adresse, Datum und Uhrzeit, die
        aufgerufene Adresse und Angaben zu deinem Browser. Das ist notwendig, um die Seite
        auszuliefern und sicher zu betreiben (Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse am
        stabilen und sicheren Betrieb). Die Speicherdauer richtet sich nach den Einstellungen des
        Hosters.
      </p>
      <p>
        Vercel hat seinen Sitz in den USA. Nach eigenen Angaben ist Vercel unter dem EU-U.S. Data
        Privacy Framework zertifiziert und nutzt für Datenübermittlungen außerhalb der EU außerdem
        die EU-Standardvertragsklauseln.
      </p>

      <h2>4. Abfrage von Spielerdaten</h2>
      <p>
        Wenn du einen Minecraft-Namen (und optional ein Profil) eingibst, schickt dein Browser diese
        Angaben an unseren Server. Der Server fragt daraufhin öffentlich verfügbare Daten ab: bei
        Mojang den Namen, die UUID und das Skin des Spielers, bei Hypixel das SkyBlock-Profil sowie
        Marktpreise. Das Skin-Bild des Spielers laden wir ebenfalls über unseren Server und schneiden
        den Kopf in deinem Browser aus; es gibt keine Verbindung zu weiteren Diensten. Diese Abfragen kommen von unserem Server; deine IP-Adresse wird dabei nicht an
        Mojang oder Hypixel weitergegeben.
      </p>
      <p>
        Die Ergebnisse werden nur kurzzeitig im Arbeitsspeicher des Servers zwischengespeichert
        (Sekunden bis wenige Stunden, damit Anfragen schneller werden und die Abfrage-Grenzen der
        Anbieter eingehalten werden) und nicht dauerhaft gespeichert. Es gibt keine Datenbank mit
        Spielerdaten. Du kannst auch den Namen eines anderen Spielers eingeben; die abgefragten Daten
        sind im Spiel bzw. über die Schnittstellen öffentlich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f
        DSGVO (Interesse an der Darstellung öffentlicher Spielfortschritte).
      </p>
      <p>
        Mojang und Hypixel sind für ihre eigenen Datenverarbeitungen selbst verantwortlich. Es gelten
        deren Datenschutzhinweise.
      </p>

      <h2>5. Lokaler Speicher im Browser</h2>
      <p>
        In deinem Browser (localStorage) speichern wir zwei Dinge, damit die Seite beim nächsten
        Besuch bequemer ist: dein zuletzt eingegebener Minecraft-Name samt Profilname und dein
        gewähltes Farbschema. Diese Daten bleiben in deinem Browser und werden nicht an uns
        übertragen. Du kannst sie jederzeit über die Browser-Einstellungen löschen.
      </p>

      <h2>6. Schriftarten</h2>
      <p>
        Die verwendeten Schriftarten werden von unserem eigenen Server ausgeliefert. Es gibt dafür
        keine Verbindung zu Google.
      </p>

      <h2>7. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17),
        Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen
        Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Du hast außerdem das Recht, dich
        bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO), z. B. bei der
        Landesdatenschutzbehörde deines Wohnorts. Schreibe für deine Anliegen an die oben genannte
        E-Mail-Adresse.
      </p>
      <p>
        Die Angabe von Daten ist freiwillig; ohne Eingabe eines Namens kann die Seite aber keine
        Profildaten anzeigen. Eine automatisierte Entscheidungsfindung findet nicht statt.
      </p>

      <p>
        <em>Stand: {LEGAL.lastUpdated}</em>
      </p>
    </article>
  );
}
