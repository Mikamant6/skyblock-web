// Laedt die Datentabellen aus dem Ordner data/ und baut daraus das
// Nachschlagewerk. JSON-Dateien kann TypeScript direkt importieren.
import attributeMapJson from "../data/attributeMap.json";
import attributeAliasesJson from "../data/attributeAliases.json";
import bazaarOverridesJson from "../data/bazaarOverrides.json";
import shardLevelsJson from "../data/shardLevels.json";
import {
  buildLookup,
  type AttributeAlias,
  type AttributeRow,
  type BazaarOverride,
  type LevelTable,
} from "./shardAttributes";

export const attributeMap: AttributeRow[] = attributeMapJson;
export const attributeAliases: AttributeAlias[] = attributeAliasesJson;
export const bazaarOverrides: BazaarOverride[] = bazaarOverridesJson;
export const shardLevels: LevelTable = shardLevelsJson;

// Wird einmal beim Start gebaut und dann wiederverwendet
export const shardLookup = buildLookup(attributeMap, attributeAliases);
