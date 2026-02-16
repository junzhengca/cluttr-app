/**
 * Category filtering utilities
 */

import { Category } from '../types/inventory';

// Location IDs are no longer statically defined - they are fetched from the API
// This utility now only excludes 'all' which is used as a filter option

/**
 * Filter categories to get only item-type categories (exclude 'all')
 * @param categories - Array of categories to filter
 * @returns Filtered array containing only item-type categories
 */
export const filterItemCategories = (categories: Category[]): Category[] => {
  // Exclude 'all' which is used as a filter option, not a category
  return categories.filter((category) => category.id !== 'all');
};

