/**
 * Location-related utilities
 * Single source of truth for location IDs and location-related logic
 */

import { locations } from '../data/locations';

/**
 * Get all location IDs as an array
 * @returns Array of location ID strings
 */
export const getLocationIds = (): string[] => {
  return locations.map((location) => location.id);
};

/**
 * Get all location IDs as a Set for efficient lookup
 * @returns Set of location ID strings
 */
export const getLocationIdsSet = (): Set<string> => {
  return new Set(getLocationIds());
};

/**
 * Check if an ID is a location ID
 * @param id - ID to check
 * @returns True if the ID is a location ID, false otherwise
 */
export const isLocationId = (id: string): boolean => {
  return getLocationIdsSet().has(id);
};

/**
 * Get location name by ID
 * @param id - Location ID
 * @returns Location name or undefined if not found
 */
export const getLocationName = (id: string): string | undefined => {
  return locations.find((location) => location.id === id)?.name;
};

