// Zahlen fuer die Anzeige formatieren (englisches Format, z. B. 1,234,567)
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

// 215509580 -> "215,509,580"
export function formatCoins(value: number): string {
  return full.format(value);
}

// 215509580 -> "215.51M"
export function formatCompact(value: number): string {
  return compact.format(value);
}

// Anteil am Gesamtwert, z. B. "12.3%"
export function formatPercent(part: number, total: number): string {
  if (total <= 0) return "-";
  return `${((part / total) * 100).toFixed(1)}%`;
}
