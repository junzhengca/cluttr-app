import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/InventoryService';
import { categoryService } from '../../services/CategoryService';
import { locationService } from '../../services/LocationService';
import { addItems, upsertItems, removeItems } from '../slices/inventorySlice';
import {
  addTodoCategories,
  upsertTodoCategories,
  removeTodoCategories,
} from '../slices/todoSlice';
import type { InventoryItem, TodoCategory } from '../../types/inventory';
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
export interface StorageOnlyEntity<T> {
  type: 'storage';
  key: string;
  syncMethod: (homeId: string, apiClient: ApiClient, deviceId: string) => Promise<SyncDelta<T>>;
}

export type SyncEntityEntry = DeltaDispatchedEntity<InventoryItem> | DeltaDispatchedEntity<TodoCategory> | StorageOnlyEntity<InventoryItem> | StorageOnlyEntity<TodoCategory>;

/**
 * Registry of all syncable entity types.
 * Removed todoItems and todoCategories as they now use direct CRUD API calls.
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
  {
    type: 'delta',
    key: 'categories',
    syncMethod: (homeId, apiClient, deviceId) =>
      categoryService.syncCategories(homeId, apiClient, deviceId),
    addAction: addTodoCategories,
    upsertAction: upsertTodoCategories,
    removeAction: removeTodoCategories,
  },
  {
    type: 'delta',
    key: 'locations',
    syncMethod: (homeId, apiClient, deviceId) =>
      locationService.syncLocations(homeId, apiClient, deviceId),
    addAction: addTodoCategories,
    upsertAction: upsertTodoCategories,
    removeAction: removeTodoCategories,
  },
];
