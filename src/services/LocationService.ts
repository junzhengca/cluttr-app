import { Location } from '../types/inventory';
import { readFile, writeFile } from './FileSystemService';
import { generateLocationId } from '../utils/idGenerator';

const LOCATIONS_FILE = 'locations.json';

interface LocationsData {
  locations: Location[];
}

/**
 * Get all locations (excluding deleted locations)
 */
export const getAllLocations = async (userId?: string): Promise<Location[]> => {
  const data = await readFile<LocationsData>(LOCATIONS_FILE, userId);
  const locations = data?.locations || [];
  return locations.filter((location) => !location.deletedAt);
};

/**
 * Get all locations for sync (including deleted locations)
 */
export const getAllLocationsForSync = async (userId?: string): Promise<Location[]> => {
  const data = await readFile<LocationsData>(LOCATIONS_FILE, userId);
  return data?.locations || [];
};

/**
 * Get a single location by ID (excluding deleted locations)
 */
export const getLocationById = async (id: string, userId?: string): Promise<Location | null> => {
  const locations = await getAllLocations(userId);
  return locations.find((location) => location.id === id && !location.deletedAt) || null;
};

/**
 * Create a new location
 */
export const createLocation = async (
  location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Promise<Location | null> => {
  try {
    const locations = await getAllLocations(userId);

    // Check if location name already exists
    const existingLocation = locations.find(
      (loc) => loc.name === location.name
    );

    if (existingLocation) {
      throw new Error('Location with this name already exists');
    }

    const now = new Date().toISOString();
    const newLocation: Location = {
      ...location,
      id: generateLocationId(),
      createdAt: now,
      updatedAt: now,
    };

    locations.push(newLocation);
    const success = await writeFile<LocationsData>(LOCATIONS_FILE, { locations }, userId);

    return success ? newLocation : null;
  } catch (error) {
    console.error('Error creating location:', error);
    return null;
  }
};

/**
 * Update an existing location
 */
export const updateLocation = async (
  id: string,
  updates: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>,
  userId?: string
): Promise<Location | null> => {
  try {
    const locations = await getAllLocations(userId);
    const index = locations.findIndex((location) => location.id === id);

    if (index === -1) {
      return null;
    }

    // Check for duplicate names
    if (updates.name) {
      const duplicate = locations.find(
        (loc, idx) =>
          idx !== index &&
          loc.name === updates.name
      );

      if (duplicate) {
        throw new Error('Location with this name already exists');
      }
    }

    locations[index] = { ...locations[index], ...updates, updatedAt: new Date().toISOString() };
    const success = await writeFile<LocationsData>(LOCATIONS_FILE, { locations }, userId);

    return success ? locations[index] : null;
  } catch (error) {
    console.error('Error updating location:', error);
    return null;
  }
};

/**
 * Delete a location (soft delete - sets deletedAt timestamp)
 */
export const deleteLocation = async (id: string, userId?: string): Promise<boolean> => {
  try {
    const data = await readFile<LocationsData>(LOCATIONS_FILE, userId);
    const locations = data?.locations || [];
    const location = locations.find((loc) => loc.id === id);

    if (!location) {
      return false; // Location not found
    }

    // Check if location is in use by items (only check non-deleted items)
    const { getAllItems } = await import('./InventoryService');
    const items = await getAllItems(userId);
    const inUse = items.some((item) => item.location === id);

    if (inUse) {
      throw new Error('Cannot delete location that is in use by items');
    }

    // If already deleted, return true (idempotent)
    if (location.deletedAt) {
      return true;
    }

    // Soft delete: set deletedAt and update updatedAt
    const index = locations.findIndex((loc) => loc.id === id);
    const now = new Date().toISOString();
    locations[index] = {
      ...locations[index],
      deletedAt: now,
      updatedAt: now,
    };

    const success = await writeFile<LocationsData>(LOCATIONS_FILE, { locations }, userId);

    return success;
  } catch (error) {
    console.error('Error deleting location:', error);
    return false;
  }
};

