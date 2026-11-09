// Rechenkern: Wert EINES Shards.
// Diese Datei kennt weder die API noch Tabellen: sie bekommt nur Zahlen
// und gibt Zahlen zurueck. So laesst sie sich 1:1 mit der R-Funktion
// calculate_shard_value() vergleichen.
//
// "null" bedeutet "nicht vorhanden" (in R war das NA).

// Der Rueckgabetyp: genau diese fuenf Zahlen liefert die Funktion
export type ShardValue = {
  unitsSellOffer: number; // Stueck, die zum Sell-Offer-Preis bewertet werden
  unitsInstantSell: number; // Stueck, die zum Instant-Sell-Preis bewertet werden
  unitsUnpriced: number; // Stueck ohne Preis (Wert 0)
  valueRaw: number; // Wert vor Steuer
  valueAfterTax: number; // Wert nach Bazaar-Steuer
};

// Hilfsfunktion: macht aus null eine 0, damit wir damit rechnen koennen
function zeroIfNull(x: number | null): number {
  return x === null ? 0 : x;
}

export function calculateShardValue(
  quantity: number, // wie viele Stueck besitzt der Account
  sellOfferPrice: number | null, // Preis pro Stueck als Sell-Offer
  instantSellPrice: number | null, // Preis pro Stueck bei Instant-Sell
  weeklyInstantBuys: number | null, // Sofortkaeufe der letzten 7 Tage
  taxRate: number = 0.0125, // Bazaar-Steuer, 0.0125 = 1,25 %
): ShardValue {
  // 1. Tagesgrenze: so viele Shards koennen pro Tag ueber Sell-Offers weggehen
  const dailyLimit = Math.floor(zeroIfNull(weeklyInstantBuys) / 7);

  // 2. Menge zum Sell-Offer-Preis (nur wenn es einen Preis gibt)
  const unitsSellOffer =
    sellOfferPrice === null ? 0 : Math.min(quantity, dailyLimit);

  // 3. Der Rest, der nicht zum Sell-Offer-Preis bewertet wurde
  const remaining = quantity - unitsSellOffer;

  // 4. Den Rest zum Instant-Sell-Preis bewerten, falls es einen gibt
  const unitsInstantSell = instantSellPrice === null ? 0 : remaining;

  // 5. Was nirgends bewertet werden konnte
  const unitsUnpriced = remaining - unitsInstantSell;

  // 6. Werte berechnen (fehlende Preise zaehlen als 0)
  const valueRaw =
    unitsSellOffer * zeroIfNull(sellOfferPrice) +
    unitsInstantSell * zeroIfNull(instantSellPrice);
  const valueAfterTax = valueRaw * (1 - taxRate);

  return {
    unitsSellOffer,
    unitsInstantSell,
    unitsUnpriced,
    valueRaw,
    valueAfterTax,
  };
}