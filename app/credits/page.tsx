// Quellen und Lizenzen der verwendeten Daten (Namensnennung, wie von den Lizenzen verlangt).
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Credits" };

export default function CreditsPage() {
  return (
    <article style={{ lineHeight: 1.7 }}>
      <h1>Credits und Lizenzen</h1>
      <p>
        FlawlessSB ist ein inoffizielles Fan-Projekt und steht in keiner Verbindung zu Hypixel Inc.,
        Mojang Studios oder Microsoft. Diese Seite nennt die Quellen der verwendeten Daten.
      </p>

      <h2>Hypixel SkyBlock Wiki</h2>
      <p>
        Texte und Daten zu Shards (Attribute, Effekte, Fundorte, Zuordnung zu Skills), Item-Bilder und
        Collection-Symbole stammen teilweise aus dem{" "}
        <a href="https://hypixelskyblock.minecraft.wiki" target="_blank" rel="noopener noreferrer">
          Hypixel SkyBlock Wiki
        </a>{" "}
        und stehen unter der Lizenz{" "}
        <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC-SA 3.0
        </a>
        . Wir haben die Daten ausgelesen, gefiltert und für diese Seite neu zusammengestellt. Die so
        entstandenen Daten stehen ebenfalls unter CC BY-NC-SA 3.0 und dürfen nicht kommerziell genutzt
        werden.
      </p>

      <h2>Hypixel-API und Mojang-API</h2>
      <p>
        Profildaten, Skill-Tabellen, Collection-Tabellen und Marktpreise (Bazaar) kommen live aus der
        öffentlichen Hypixel-API. Namen, UUIDs und Skins kommen von Mojang.
      </p>

      <h2>Rezepte</h2>
      <p>
        Die Crafting-Rezepte stammen aus dem Community-Projekt{" "}
        <a
          href="https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO"
          target="_blank"
          rel="noopener noreferrer"
        >
          NotEnoughUpdates-REPO
        </a>
        .
      </p>

      <h2>Networth</h2>
      <p>
        Der Networth wird mit der Bibliothek{" "}
        <a href="https://www.npmjs.com/package/skyhelper-networth" target="_blank" rel="noopener noreferrer">
          SkyHelper-Networth
        </a>{" "}
        (MIT-Lizenz) berechnet. Die Preise dafür stammen aus dem Repository SkyHelperBot/Prices.
      </p>

      <h2>Marken</h2>
      <p>
        „Minecraft“ ist eine Marke von Mojang Studios, „Hypixel“ und „SkyBlock“ sind Marken von Hypixel
        Inc. Alle Marken gehören ihren jeweiligen Inhabern. Logo und Gestaltung von FlawlessSB sind
        eigene Entwürfe.
      </p>
    </article>
  );
}
