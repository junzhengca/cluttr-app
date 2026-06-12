/**
 * Default inventory-category presets seeded into every newly created home
 * (see src/services/seedHomeDefaults.ts).
 *
 * `id` is the i18n key suffix under `categories.*` — NOT a Firestore doc id
 * (doc ids are generated at seed time). The localized name is resolved once,
 * at creation time, and stored as a plain string.
 */
export interface DefaultInventoryCategoryPreset {
  id: string;
  icon: string;
  color: string;
}

export const defaultInventoryCategories: DefaultInventoryCategoryPreset[] = [
  { id: 'appliances', icon: 'desktop-outline', color: '#4A90E2' },
  { id: 'kitchenware', icon: 'restaurant-outline', color: '#FFA07A' },
  { id: 'digital', icon: 'phone-portrait-outline', color: '#9B59B6' },
  { id: 'beauty', icon: 'sparkles', color: '#D81B60' },
  { id: 'entertainment', icon: 'game-controller-outline', color: '#16A085' },
  { id: 'apparel', icon: 'shirt-outline', color: '#F39C12' },
  { id: 'home', icon: 'home-outline', color: '#2ECC71' },
  { id: 'other', icon: 'cube-outline', color: '#95A5A6' },
];
