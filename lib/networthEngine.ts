// Datenbeschaffung/Berechnung: kapselt die Bibliothek "skyhelper-networth".
// Laeuft nur auf dem Server. Die Bibliothek wird erst beim ersten Bedarf
// geladen (dynamischer Import), weil sie beim Laden Hintergrund-Aktionen
// startet (Item-Liste von Hypixel holen, npm-Update-Pruefung).
import fs from "node:fs";
import { UserError } from "./errors";
import type { RawNetworth } from "./networthSummary";

// Die Bibliothek will die Item-Liste als Datei ".itemsBackup.json" in ihrem
// eigenen Ordner sichern. Auf Hosting-Diensten wie Vercel ist dieser Ordner
// schreibgeschuetzt; der Fehler wuerde die ganze Berechnung abbrechen. Wir
// lassen deshalb NUR das Schreiben dieser einen Datei notfalls scheitern.
// Die Item-Liste selbst liegt dann trotzdem im Arbeitsspeicher.
function guardBackupFileWrite(): void {
  const fsAny = fs as unknown as {
    writeFileSync: (...args: unknown[]) => unknown;
    __backupWriteGuarded?: boolean;
  };
  if (fsAny.__backupWriteGuarded) return;

  const original = fsAny.writeFileSync;
  fsAny.writeFileSync = (...args: unknown[]) => {
    const target = args[0];
    if (typeof target === "string" && target.endsWith(".itemsBackup.json")) {
      try {
        return original.apply(fs, args);
      } catch {
        return undefined; // Backup nicht moeglich: egal
      }
    }
    return original.apply(fs, args);
  };
  fsAny.__backupWriteGuarded = true;
}

// Die Teile der Bibliothek, die wir benutzen
type NetworthLibrary = {
  ProfileNetworthCalculator: new (
    profileData: object,
    museumData?: object,
    bankBalance?: number,
  ) => { getNetworth(options?: object): Promise<RawNetworth> };
  NetworthManager: { itemsPromise?: Promise<unknown> };
  UpdateManager: { disable?: () => void };
  // Entschluesselt alle Inventare des Spielers (Ruestung, Inventar, Enderchest, Kleiderschrank, ...)
  parseItems: (profileData: object, museumData?: object) => Promise<Record<string, unknown[]>>;
  // Preisliste der Bibliothek (SkyHelper-Prices): Item-ID -> Preis in Coins
  getPrices: () => Promise<Record<string, number>>;
};

let libraryPromise: Promise<NetworthLibrary> | null = null;

function loadLibrary(): Promise<NetworthLibrary> {
  if (libraryPromise === null) {
    libraryPromise = (async () => {
      guardBackupFileWrite();
      const imported = (await import("skyhelper-networth")) as unknown as {
        default?: NetworthLibrary;
      } & NetworthLibrary;
      const lib = imported.default ?? imported;

      // Der Update-Check bei npm laeuft als Timer: bei uns unnoetig
      lib.UpdateManager?.disable?.();
      // Schlaegt das Laden der Item-Liste fehl, meldet sich der Fehler spaeter
      // bei der Berechnung. Hier nur verhindern, dass er "unbehandelt" bleibt.
      lib.NetworthManager?.itemsPromise?.catch(() => {});
      return lib;
    })();
    // Scheitert das Laden, beim naechsten Mal neu versuchen
    libraryPromise.catch(() => {
      libraryPromise = null;
    });
  }
  return libraryPromise;
}

// Networth (ohne Shards) fuer ein Mitglied eines Profils berechnen.
// memberData = profile.members[uuid], bankBalance = profile.banking.balance
export async function calculateProfileNetworth(
  memberData: object,
  bankBalance: number,
): Promise<RawNetworth> {
  try {
    const lib = await loadLibrary();
    const calculator = new lib.ProfileNetworthCalculator(
      memberData,
      undefined, // Museum: wie im R-Projekt noch nicht beruecksichtigt
      bankBalance,
    );
    // onlyNetworth: nur Summen, keine Listen aller Gegenstaende (spart Speicher)
    return await calculator.getNetworth({ onlyNetworth: true });
  } catch (error) {
    console.error("Networth calculation failed:", error);
    throw new UserError(
      "The networth could not be calculated right now. Please try again later.",
      503,
    );
  }
}

// Alle Inventare eines Mitglieds entschluesselt: Name des Inventars (z. B. "armor", "wardrobe", "enderchest")
// -> Liste der Gegenstaende. Nutzt dieselbe (geschuetzte) Bibliothek wie die Networth-Berechnung.
export async function parseMemberInventories(memberData: object): Promise<Record<string, unknown[]>> {
  try {
    const lib = await loadLibrary();
    return await lib.parseItems(memberData);
  } catch (error) {
    console.error("Reading inventories failed:", error);
    throw new UserError("Your items could not be read right now. Please try again later.", 503);
  }
}

// Preisliste (Item-ID -> Coins) aus der Bibliothek. Sie wird dort 5 Minuten zwischengespeichert.
// Ein Preis ist nur eine Zugabe: scheitert das Laden, gibt es einfach keine Preise (statt eines Fehlers).
export async function getItemPrices(): Promise<Record<string, number>> {
  try {
    const lib = await loadLibrary();
    return await lib.getPrices();
  } catch (error) {
    console.error("Loading item prices failed:", error);
    return {};
  }
}
