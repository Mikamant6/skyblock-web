// Reine Rechenlogik fuer Collections: aus der gesammelten Menge die erreichte Stufe (Tier) bestimmen.
import type { CollectionTier } from "./collectionResources";

export type CollectionProgress = {
  tier: number; // erreichte Stufe (0 = noch keine)
  maxTier: number;
  nextRequired: number | null; // Gesamt-Menge fuer die naechste Stufe (null = Maximum)
  fraction: number; // Anteil von der aktuellen Stufe bis zur naechsten, 0 bis 1
};

// tiers muss nach Stufe aufsteigend sortiert sein; amountRequired ist die GESAMT-Menge
export function getCollectionProgress(amount: number, tiers: CollectionTier[]): CollectionProgress {
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const maxTier = tiers.length;
  let tier = 0;
  while (tier < maxTier && tiers[tier].amountRequired <= safe) tier++;
  if (tier >= maxTier) return { tier, maxTier, nextRequired: null, fraction: 1 };

  const base = tier === 0 ? 0 : tiers[tier - 1].amountRequired;
  const next = tiers[tier].amountRequired;
  return { tier, maxTier, nextRequired: next, fraction: (safe - base) / (next - base) };
}
