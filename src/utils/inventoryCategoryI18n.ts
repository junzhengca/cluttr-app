/**
 * i18n for default inventory categories.
 * IDs match server defaults (CluttrServer utils/inventory_category_helpers.ts).
 * For default IDs we show translated name; for custom categories we show the API name.
 */

export const DEFAULT_INVENTORY_CATEGORY_IDS = new Set([
  'produce',
  'dairy',
  'meat',
  'seafood',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'snacks',
  'household',
  'personal-care',
  'other',
]);

export interface InventoryCategoryLike {
  id: string;
  name: string;
}

/** Minimal type for i18n t() as used by this helper. */
export type InventoryCategoryTranslateFn = (
  key: string,
  options?: { defaultValue?: string }
) => string;

/**
 * Returns the display name for an inventory category: translated for default categories,
 * or the API name for custom categories.
 */
export function getInventoryCategoryDisplayName(
  category: InventoryCategoryLike,
  t: InventoryCategoryTranslateFn
): string {
  if (DEFAULT_INVENTORY_CATEGORY_IDS.has(category.id)) {
    return t(`inventoryCategories.${category.id}`, { defaultValue: category.name });
  }
  return category.name;
}
