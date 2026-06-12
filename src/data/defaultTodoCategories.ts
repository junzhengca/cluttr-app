/**
 * Default todo (shopping) category presets seeded into every newly created
 * home (see src/services/seedHomeDefaults.ts). Ids are i18n key suffixes
 * under `todoCategories.*`; todo categories are name-only.
 *
 * Intentionally separate from DEFAULT_TODO_CATEGORY_IDS in
 * src/utils/todoCategoryI18n.ts — that Set is legacy display logic keyed on
 * Firestore doc ids, while these ids only select translation keys at seed
 * time (doc ids are generated).
 */
export const defaultTodoCategoryIds: string[] = [
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
];
