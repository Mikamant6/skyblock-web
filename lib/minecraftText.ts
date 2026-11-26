// Minecraft-Farbcodes in anzeigbare Textstuecke umwandeln.
// Die Wiki-Tooltips sind wie im Spiel aufgebaut: "&6" = Farbe, "&l" = fett,
// "/" = neue Zeile, "//" = Leerzeile (Beispiel: "&6Nature Elemental I/&7Grants ...").
// Reine Logik, ohne Netzwerk.

import { replaceGlyphs } from "./glyphs";

export type TextSegment = { text: string; color: string; bold: boolean };
export type TextLine = TextSegment[]; // leere Zeile = leeres Array

// Die 16 Minecraft-Farben
export const MINECRAFT_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
};

const DEFAULT_COLOR = MINECRAFT_COLORS["f"];

// Eine Zeile mit Farbcodes in Stuecke zerlegen
export function parseColoredLine(rawLine: string): TextLine {
  // Sonderzeichen der Wiki-Schrift ersetzen, damit keine Kaestchen erscheinen
  const line = replaceGlyphs(rawLine);
  const segments: TextSegment[] = [];
  let color = DEFAULT_COLOR;
  let bold = false;
  let buffer = "";

  const flush = () => {
    if (buffer !== "") segments.push({ text: buffer, color, bold });
    buffer = "";
  };

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const code = line[i + 1]?.toLowerCase();
    if ((char === "&" || char === "§") && code !== undefined && /[0-9a-fk-or]/.test(code)) {
      flush();
      if (code in MINECRAFT_COLORS) {
        // Eine Farbe setzt Fettdruck zurueck (wie im Spiel)
        color = MINECRAFT_COLORS[code];
        bold = false;
      } else if (code === "l") {
        bold = true;
      } else if (code === "r") {
        color = DEFAULT_COLOR;
        bold = false;
      }
      // k, m, n, o (verschluesselt, durchgestrichen, unterstrichen, kursiv) ignorieren wir
      i++; // das Zeichen nach & gehoert zum Code
      continue;
    }
    buffer += char;
  }
  flush();
  return segments;
}

// Ganzer Tooltip: Zeilen sind durch "/" getrennt
export function parseTooltip(raw: string): TextLine[] {
  return raw.split("/").map(parseColoredLine);
}

// Text ohne Farbcodes (z. B. fuer Suche oder Beschriftung)
export function stripColorCodes(raw: string): string {
  return raw.replace(/[&§][0-9a-fk-or]/gi, "");
}
