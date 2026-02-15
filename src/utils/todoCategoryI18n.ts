/**
 * i18n for default todo categories.
 * IDs match server defaults (CluttrServer utils/todo_category_helpers.ts).
 * For default IDs we show translated name; for custom categories we show the API name.
 */

export const DEFAULT_TODO_CATEGORY_IDS = new Set([
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

export interface TodoCategoryLike {
  id: string;
  name: string;
}

/** Minimal type for i18n t() as used by this helper. */
export type TodoCategoryTranslateFn = (
  key: string,
  options?: { defaultValue?: string }
) => string;

/**
 * Returns the display name for a todo category: translated for default categories,
 * or the API name for custom categories.
 */
export function getTodoCategoryDisplayName(
  category: TodoCategoryLike,
  t: TodoCategoryTranslateFn
): string {
  if (DEFAULT_TODO_CATEGORY_IDS.has(category.id)) {
    return t(`todoCategories.${category.id}`, { defaultValue: category.name });
  }
  return category.name;
}
