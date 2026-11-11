// Ein kleiner Zwischenspeicher: merkt sich Antworten fuer eine feste Zeit.
// Hypixel verlangt, moeglichst wenig Anfragen zu stellen. Wer dieselben Daten
// innerhalb weniger Sekunden noch einmal braucht, bekommt sie aus dem Speicher.
// Der Speicher lebt nur im Arbeitsspeicher des Servers und nicht auf der Festplatte.
export function createTtlCache<T>(ttlMs: number, maxEntries: number) {
  const store = new Map<string, { expiresAt: number; value: T }>();

  return {
    // Gibt den Wert zurueck, solange er noch frisch ist, sonst undefined
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (entry === undefined) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key: string, value: T): void {
      // Der Speicher darf nicht unbegrenzt wachsen: den aeltesten Eintrag
      // verwerfen (eine Map merkt sich die Reihenfolge des Einfuegens)
      if (store.size >= maxEntries && !store.has(key)) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
      }
      store.set(key, { expiresAt: Date.now() + ttlMs, value });
    },

    clear(): void {
      store.clear();
    },
  };
}
