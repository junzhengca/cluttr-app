/**
 * Category filtering utilities
 */

import { Category } from '../types/inventory';
import { getLocationIdsSet } from './locationUtils';

/**
 * Filter categories to get only item-type categories (exclude location categories)
 * @param categories - Array of categories to filter
 * @returns Filtered array containing only item-type categories
 */
export const filterItemCategories = (categories: Category[]): Category[] => {
  const locationIds = getLocationIdsSet();
  // Also exclude 'all' which is used as a filter option, not a category
  locationIds.add('all');
  
  return categories.filter((category) => !locationIds.has(category.id));
};

