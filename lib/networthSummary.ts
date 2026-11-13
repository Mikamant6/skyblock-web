// Reine Logik fuer den Networth: wandelt das Ergebnis der Bibliothek in eine
// schlanke Form um und bildet die Gesamtsumme mit dem Shard-Wert.
// Kein Netzwerk, keine Bibliothek: dadurch leicht zu testen.

// Nur die Felder des Bibliotheks-Ergebnisses, die wir brauchen
export type RawNetworth = {
  networth: number;
  unsoulboundNetworth: number;
  noInventory: boolean; // true = Inventar-API des Spielers ist ausgeschaltet
  purse: number;
  bank: number;
  types: Record<string, { total: number }>;
};

export type NetworthCategory = {
  id: string; // z. B. "inventory", "enderchest", "pets"
  total: number;
};

export type NetworthSummary = {
  networth: number; // Networth OHNE Shards
  unsoulboundNetworth: number;
  purse: number;
  bank: number;
  noInventory: boolean;
  categories: NetworthCategory[]; // nur Werte > 0, groesster zuerst
};

// Zahlen aus fremden Daten absichern: alles, was keine endliche Zahl ist, wird 0
function safe(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function summarizeNetworth(raw: RawNetworth): NetworthSummary {
  const categories = Object.entries(raw.types ?? {})
    .map(([id, entry]) => ({ id, total: safe(entry?.total) }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    networth: safe(raw.networth),
    unsoulboundNetworth: safe(raw.unsoulboundNetworth),
    purse: safe(raw.purse),
    bank: safe(raw.bank),
    noInventory: raw.noInventory === true,
    categories,
  };
}

// Gesamtwert wie im R-Projekt: Networth ohne Shards + Shard-Rohwert
// (vor Bazaar-Steuer, weil der Networth der Bibliothek ebenfalls ein
// Marktwert ist und keine Steuer abzieht).
export function grandTotal(
  networthWithoutShards: number,
  shardValueRaw: number,
): number {
  return safe(networthWithoutShards) + safe(shardValueRaw);
}
