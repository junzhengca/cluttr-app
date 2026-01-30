import { InventoryItem } from '../types/inventory';
import { readFile, writeFile } from './FileSystemService';
import { generateItemId } from '../utils/idGenerator';
import { isExpiringSoon } from '../utils/dateUtils';
import { syncCallbackRegistry } from './SyncCallbackRegistry';

const ITEMS_FILE = 'items.json';

interface ItemsData {
  items: InventoryItem[];
}

/**
 * Get all inventory items (excluding deleted items)
 */
export const getAllItems = async (userId?: string): Promise<InventoryItem[]> => {
  const data = await readFile<ItemsData>(ITEMS_FILE, userId);
  const items = data?.items || [];
  return items.filter((item) => !item.deletedAt);
};

/**
 * Get all inventory items for sync (including deleted items)
 */
export const getAllItemsForSync = async (userId?: string): Promise<InventoryItem[]> => {
  const data = await readFile<ItemsData>(ITEMS_FILE, userId);
  return data?.items || [];
};

/**
 * Get a single item by ID (excluding deleted items)
 */
export const getItemById = async (id: string, userId?: string): Promise<InventoryItem | null> => {
  const items = await getAllItems(userId);
  return items.find((item) => item.id === id && !item.deletedAt) || null;
};

/**
 * Create a new item
 */
export const createItem = async (item: Omit<InventoryItem, 'id'>, userId?: string): Promise<InventoryItem | null> => {
  try {
    const items = await getAllItems(userId);
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...item,
      status: item.status || 'using', // Default to 'using' if not provided
      id: generateItemId(),
      createdAt: now,
      updatedAt: now,
    };

    items.push(newItem);
    const success = await writeFile<ItemsData>(ITEMS_FILE, { items }, userId);

    if (success) {
      console.log('[InventoryService] Triggering sync after createItem');
      syncCallbackRegistry.trigger('inventoryItems', userId);
    }

    return success ? newItem : null;
  } catch (error) {
    console.error('Error creating item:', error);
    return null;
  }
};

/**
 * Update an existing item
 */
export const updateItem = async (
  id: string,
  updates: Partial<Omit<InventoryItem, 'id'>>,
  userId?: string
): Promise<InventoryItem | null> => {
  try {
    console.log('[InventoryService] updateItem called with id:', id, 'updates:', updates);
    const items = await getAllItems(userId);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    console.log('[InventoryService] Updated item to be written:', items[index]);
    const success = await writeFile<ItemsData>(ITEMS_FILE, { items }, userId);

    if (success) {
      console.log('[InventoryService] Triggering sync after updateItem');
      syncCallbackRegistry.trigger('inventoryItems', userId);
    }

    return success ? items[index] : null;
  } catch (error) {
    console.error('Error updating item:', error);
    return null;
  }
};

/**
 * Delete an item (soft delete - sets deletedAt timestamp)
 */
export const deleteItem = async (id: string, userId?: string): Promise<boolean> => {
  try {
    const data = await readFile<ItemsData>(ITEMS_FILE, userId);
    const items = data?.items || [];
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return false; // Item not found
    }

    // If already deleted, return true (idempotent)
    if (items[index].deletedAt) {
      return true;
    }

    // Soft delete: set deletedAt and update updatedAt
    const now = new Date().toISOString();
    items[index] = {
      ...items[index],
      deletedAt: now,
      updatedAt: now,
    };

    const success = await writeFile<ItemsData>(ITEMS_FILE, { items }, userId);

    if (success) {
      console.log('[InventoryService] Triggering sync after deleteItem');
      syncCallbackRegistry.trigger('inventoryItems', userId);
    }

    return success;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
};

/**
 * Search and filter items
 */
export const searchItems = async (
  query?: string,
  filters?: {
    expiringSoon?: boolean; // Items expiring within 7 days
  }
): Promise<InventoryItem[]> => {
  let items = await getAllItems(); // Already filters out deleted items

  // Filter by expiring soon
  if (filters?.expiringSoon) {
    items = items.filter((item) => isExpiringSoon(item.expiryDate));
  }

  // Search by query
  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.location.toLowerCase().includes(lowerQuery) ||
        item.detailedLocation.toLowerCase().includes(lowerQuery)
    );
  }

  return items;
};

