// Crafting-Rezepte fuer die Collection-Freischaltungen. Die Daten stehen in data/recipes.json
// und werden mit scripts/fetchRecipes.ts aus dem NotEnoughUpdates-REPO geladen (Community-Daten).
import { collectionSlug } from "./collectionIcons";
import iconData from "../data/recipeIcons.json";
import recipeData from "../data/recipes.json";

export type RecipeSlot = { name: string; count: number } | null;
export type Recipe = {
  id: string; // interne Item-ID, z. B. ENCHANTED_POTATO
  grid: RecipeSlot[]; // 9 Felder: A1 A2 A3 / B1 B2 B3 / C1 C2 C3 (zeilenweise)
  craftText: string | null; // z. B. "Requires: Potato IV"
  outputCount: number;
};

const RECIPES = (recipeData as unknown as { recipes: Record<string, Recipe> }).recipes;

// "Enchanted Potato Recipe" -> Rezept von "Enchanted Potato" (oder null, wenn wir keins kennen)
export function findRecipe(unlockText: string): { name: string; recipe: Recipe } | null {
  const match = /^(.+) Recipe$/.exec(unlockText.trim());
  if (match === null) return null;
  const recipe = RECIPES[match[1]];
  return recipe === undefined ? null : { name: match[1], recipe };
}

// Welche Item-Bilder wir lokal haben (public/items/<slug>.png, geladen mit scripts/fetchRecipeIcons.ts)
const ICON_NAMES = new Set((iconData as { names: string[] }).names);

// Pfad zum Bild eines Items (Zutat oder Ergebnis) oder null, wenn keins vorhanden ist
export function itemIconPath(name: string): string | null {
  return ICON_NAMES.has(name) ? `/items/${collectionSlug(name)}.png` : null;
}

// Alle Item-Namen, die in Rezepten vorkommen (Ergebnisse und Zutaten): fuer das Bilder-Skript
export function allRecipeItemNames(): string[] {
  const names = new Set<string>();
  for (const [name, recipe] of Object.entries(RECIPES)) {
    names.add(name);
    for (const slot of recipe.grid) if (slot !== null) names.add(slot.name);
  }
  return [...names].sort();
}
