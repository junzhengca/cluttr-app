/**
 * Default location presets seeded into every newly created home
 * (see src/services/seedHomeDefaults.ts).
 *
 * `id` is the i18n key suffix under `locations.*` (keys exist in en/zh-CN/ja);
 * Firestore doc ids are generated at seed time.
 */
export interface DefaultLocationPreset {
  id: string;
  icon: string;
}

export const defaultLocations: DefaultLocationPreset[] = [
  { id: 'kitchen', icon: 'restaurant-outline' },
  { id: 'medical-cabinet', icon: 'medkit-outline' },
  { id: 'bookshelf', icon: 'book-outline' },
  { id: 'bedroom', icon: 'bed-outline' },
  { id: 'living-room', icon: 'tv-outline' },
];
