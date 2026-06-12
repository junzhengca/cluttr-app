import i18n from '../i18n/i18n';
import { storageLogger } from '../utils/Logger';
import { inventoryCategoryService } from './InventoryCategoryService';
import { locationService } from './LocationService';
import { todoCategoryService } from './TodoCategoryService';
import { defaultInventoryCategories } from '../data/defaultCategories';
import { defaultLocations } from '../data/defaultLocations';
import { defaultTodoCategoryIds } from '../data/defaultTodoCategories';

/**
 * Seed the preset (default) lists into a newly created home's Firestore
 * subcollections. Names are resolved via i18n once, at creation time, in the
 * user's current language and stored as plain strings — they intentionally
 * do not change if the user later switches language.
 *
 * All writes are fire-and-forget (createCrudService). Firestore preserves
 * client-side mutation order, so these queue behind the home doc `set`
 * issued by HomeService.createHome and pass the owner security rules.
 */
export function seedHomeDefaults(homeId: string): void {
  try {
    for (const preset of defaultInventoryCategories) {
      inventoryCategoryService.createCategory(homeId, {
        name: i18n.t(`categories.${preset.id}`),
        icon: preset.icon,
        color: preset.color,
      });
    }

    for (const preset of defaultLocations) {
      locationService.createLocation(homeId, {
        name: i18n.t(`locations.${preset.id}`),
        icon: preset.icon,
      });
    }

    for (const id of defaultTodoCategoryIds) {
      todoCategoryService.createCategory(homeId, {
        name: i18n.t(`todoCategories.${id}`),
      });
    }
  } catch (error) {
    // Seeding must never break home creation itself.
    storageLogger.error('Failed to seed default lists for new home', error);
  }
}
