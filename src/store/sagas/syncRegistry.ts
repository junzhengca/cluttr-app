import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/InventoryService';
import { categoryService } from '../../services/CategoryService';
import { locationService } from '../../services/LocationService';
import { triggerCategoryRefresh } from '../slices/refreshSlice';
import { addItems, upsertItems, removeItems } from '../slices/inventorySlice';
import type { InventoryItem, Category, Location } from '../../types/inventory';
import type { SyncDelta } from '../../types/sync';
import type { ApiClient } from '../../services/ApiClient';

/**
 * A delta-dispatched entity has batch Redux actions for granular state updates.
 */
export interface DeltaDispatchedEntity<T> {
  type: 'delta';
  key: string;
  syncMethod: (homeId: string, apiClient: ApiClient, deviceId: string) => Promise<SyncDelta<T>>;
  addAction: ActionCreatorWithPayload<T[]>;
  upsertAction: ActionCreatorWithPayload<T[]>;
  removeAction: ActionCreatorWithPayload<string[]>;
}

/**
 * A storage-only entity syncs to storage but has no batch Redux actions.
 * The UI refreshes via triggerCategoryRefresh.
 */
export interface StorageOnlyEntity {
  type: 'storage';
  key: string;
  syncMethod: (homeId: string, apiClient: ApiClient, deviceId: string) => Promise<SyncDelta<unknown>>;
}

export type SyncEntityEntry = DeltaDispatchedEntity<InventoryItem> | DeltaDispatchedEntity<Category> | DeltaDispatchedEntity<Location> | StorageOnlyEntity;

/**
 * Registry of all syncable entity types.
 * - inventoryItems: Uses delta-dispatched actions for Redux state updates
 * - categories: Uses storage-only pattern (UI refreshes via triggerCategoryRefresh)
 * - locations: Uses storage-only pattern
 *
 * Note: todoItems and todoCategories are NOT included - they use direct CRUD API calls.
 */
export const syncRegistry: SyncEntityEntry[] = [
  // Delta-dispatched entities
  {
    type: 'delta',
    key: 'inventoryItems',
    syncMethod: (homeId, apiClient, deviceId) =>
      inventoryService.syncItems(homeId, apiClient, deviceId),
    addAction: addItems,
    upsertAction: upsertItems,
    removeAction: removeItems,
  },
  // Storage-only entities (trigger refresh instead of batch actions)
  {
    type: 'storage',
    key: 'categories',
    syncMethod: (homeId, apiClient, deviceId) =>
      categoryService.syncCategories(homeId, apiClient, deviceId),
  },
  {
    type: 'storage',
    key: 'locations',
    syncMethod: (homeId, apiClient, deviceId) =>
      locationService.syncLocations(homeId, apiClient, deviceId),
  },
];
