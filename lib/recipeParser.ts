// Reine Logik: ein Item aus dem NotEnoughUpdates-REPO in unser Rezept-Format umwandeln.
export type RawRecipeSlot = { id: string; count: number } | null;
export type ParsedRecipe = { grid: RawRecipeSlot[]; outputCount: number };

const SLOTS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

// "POTATO_ITEM:32" -> { id: "POTATO_ITEM", count: 32 }; leer -> null
export function parseSlot(value: unknown): RawRecipeSlot {
  if (typeof value !== "string" || value.trim() === "") return null;
  const [id, countText] = value.split(":");
  const count = countText === undefined ? 1 : Number(countText);
  if (id === "" || !Number.isFinite(count) || count <= 0) return null;
  return { id, count };
}

// Erstes Werkbank-Rezept eines NEU-Items (altes Feld "recipe" oder neue Liste "recipes").
// Gibt null zurueck, wenn das Item kein Werkbank-Rezept hat.
export function parseItemRecipe(item: unknown): ParsedRecipe | null {
  if (typeof item !== "object" || item === null) return null;
  const data = item as { recipe?: unknown; recipes?: unknown };

  let source: Record<string, unknown> | null = null;
  if (typeof data.recipe === "object" && data.recipe !== null) {
    source = data.recipe as Record<string, unknown>;
  } else if (Array.isArray(data.recipes)) {
    const crafting = data.recipes.find((entry) => {
      const type = (entry as { type?: unknown })?.type;
      return type === undefined || type === "crafting";
    });
    if (typeof crafting === "object" && crafting !== null) source = crafting as Record<string, unknown>;
  }
  if (source === null) return null;

  const grid = SLOTS.map((slot) => parseSlot(source[slot]));
  if (grid.every((slot) => slot === null)) return null;
  const count = Number(source.count);
  return { grid, outputCount: Number.isFinite(count) && count > 0 ? count : 1 };
}

// "§aEnchanted Potato" -> "Enchanted Potato"
export function stripColorCodes(text: string): string {
  return text.replace(/§./g, "").trim();
}

// "Enchanted Potato" -> "ENCHANTED_POTATO" (so heissen die Dateien im REPO)
export function guessItemId(name: string): string {
  return name
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
