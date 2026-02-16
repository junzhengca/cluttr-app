import { call, put, select, takeLatest, takeEvery, delay, fork, cancel } from 'redux-saga/effects';
import type { Task } from 'redux-saga';
import type { RootState } from '../types';
import {
  setItems,
  addItem as addItemSlice,
  updateItem as updateItemSlice,
  removeItem as removeItemSlice,
  setLoading,
  setError,
  addUpdatingItemId,
  removeUpdatingItemId,
} from '../slices/inventorySlice';
import { inventoryService } from '../../services/InventoryService';
import type { ApiClient } from '../../services/ApiClient';
import type { InventoryItem } from '../../types/inventory';
import { sagaLogger } from '../../utils/Logger';
import { getGlobalToast } from '../../components/organisms/ToastProvider';

// Action types
const LOAD_ITEMS = 'inventory/LOAD_ITEMS';
const CREATE_ITEM = 'inventory/CREATE_ITEM';
const DELETE_ITEM = 'inventory/DELETE_ITEM';
const UPDATE_ITEM = 'inventory/UPDATE_ITEM';
const UPDATE_ITEM_BATCHES = 'inventory/UPDATE_ITEM_BATCHES';

// Action creators
export const loadItems = () => ({ type: LOAD_ITEMS });
export const createItemAction = (item: Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>) => ({
  type: CREATE_ITEM,
  payload: item,
});
export const deleteItemAction = (id: string) => ({ type: DELETE_ITEM, payload: id });
export const updateItemAction = (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>>) => ({
  type: UPDATE_ITEM,
  payload: { id, updates },
});
export const updateItemBatchesAction = (id: string, batches: InventoryItem['batches']) => ({
  type: UPDATE_ITEM_BATCHES,
  payload: { id, batches },
});

const DEBOUNCE_MS = 400;
const pendingUpdateTasks = new Map<string, Task>();

/**
 * Get API client from Redux state
 */
function* getApiClient(): Generator<unknown, ApiClient, unknown> {
  const state = (yield select()) as RootState;
  const apiClient = state.auth.apiClient;
  if (!apiClient) {
    sagaLogger.error('No API client available');
    throw new Error('No API client available');
  }
  return apiClient;
}

/**
 * Get active home ID from Redux state
 */
function* getActiveHomeId(): Generator<unknown, string, unknown> {
  const state = (yield select()) as RootState;
  const activeHomeId = state.auth.activeHomeId;
  if (!activeHomeId) {
    sagaLogger.error('No active home - cannot perform inventory operation');
    throw new Error('No active home selected');
  }
  return activeHomeId;
}

function* loadItemsSaga(): Generator<unknown, void, unknown> {
  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const items = (yield call(
      [inventoryService, 'fetchInventoryItems'],
      apiClient,
      homeId
    )) as InventoryItem[];
    yield put(setItems(items));
  } catch (error) {
    sagaLogger.error('Error loading items', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load items';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* createItemSaga(action: {
  type: string;
  payload: Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>;
}): Generator<unknown, void, unknown> {
  const item = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const newItem = (yield call(
      [inventoryService, 'createInventoryItem'],
      apiClient,
      homeId,
      item
    )) as InventoryItem | null;

    if (newItem) {
      sagaLogger.verbose(`Item created: id=${newItem.id}, name="${newItem.name}"`);
      yield put(addItemSlice(newItem));
    } else {
      sagaLogger.error('Failed to create item: newItem is null/undefined');
      yield put(setError('Failed to create item'));
    }
  } catch (error) {
    sagaLogger.error('Error creating item', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  } finally {
    yield put(setLoading(false));
  }
}

function* deleteItemSaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  const id = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setError(null));

    // Optimistically remove from UI first
    yield put(removeItemSlice(id));

    // Then call API
    const success = (yield call(
      [inventoryService, 'deleteInventoryItem'],
      apiClient,
      homeId,
      id
    )) as boolean;

    if (!success) {
      // Revert on failure
      sagaLogger.error('Failed to delete item');
      const errorMessage = 'Failed to delete item';
      yield put(setError(errorMessage));
      const toast = getGlobalToast();
      if (toast) toast(errorMessage, 'error');
      // Reload items to get correct state
      yield call(loadItemsSaga);
    }
  } catch (error) {
    sagaLogger.error('Error deleting item', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    // Reload items to revert optimistic update
    yield call(loadItemsSaga);
  }
}

/**
 * Runs after DEBOUNCE_MS: sends current state for this id to API, then applies or reverts.
 * previousItem is the state before the optimistic update (used to revert on error).
 */
function* debouncedUpdateForId(
  id: string,
  previousItem: InventoryItem
): Generator<unknown, void, unknown> {
  let payloadSent: Partial<Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>> = {};
  try {
    yield delay(DEBOUNCE_MS);

    const state = (yield select()) as RootState;
    const currentItem = state.inventory.items.find((i) => i.id === id);
    if (!currentItem) return;

    payloadSent = {
      name: currentItem.name,
      location: currentItem.location,
      detailedLocation: currentItem.detailedLocation,
      status: currentItem.status,
      icon: currentItem.icon,
      iconColor: currentItem.iconColor,
      warningThreshold: currentItem.warningThreshold,
      categoryId: currentItem.categoryId,
      batches: currentItem.batches,
    };

    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    const updatedItem = (yield call(
      [inventoryService, 'updateInventoryItem'],
      apiClient,
      homeId,
      id,
      payloadSent
    )) as InventoryItem | null;

    if (updatedItem) {
      const stateAfter = (yield select()) as RootState;
      const now = stateAfter.inventory.items.find((i) => i.id === id);
      const stillCurrent =
        now &&
        now.name === payloadSent.name &&
        now.location === payloadSent.location &&
        now.detailedLocation === payloadSent.detailedLocation &&
        now.status === payloadSent.status;
      if (stillCurrent) {
        yield put(updateItemSlice(updatedItem));
      }
    }
  } catch (error) {
    sagaLogger.error('Error updating item', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to save item';
    const stateAfter = (yield select()) as RootState;
    const now = stateAfter.inventory.items.find((i) => i.id === id);
    const stillCurrent =
      now &&
      now.name === payloadSent.name &&
      now.location === payloadSent.location &&
      now.detailedLocation === payloadSent.detailedLocation &&
      now.status === payloadSent.status;
    if (stillCurrent) {
      yield put(updateItemSlice(previousItem));
      yield put(setError(errorMessage));
      const toast = getGlobalToast();
      if (toast) toast(errorMessage, 'error');
    }
  } finally {
    yield put(removeUpdatingItemId(id));
    pendingUpdateTasks.delete(id);
  }
}

/**
 * On each UPDATE_ITEM: apply optimistic update, then schedule a single debounced API call per id.
 */
function* updateItemDebounceSaga(action: {
  type: string;
  payload: { id: string; updates: Partial<Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>> };
}): Generator<unknown, void, unknown> {
  const { id, updates } = action.payload;

  const state = (yield select()) as RootState;
  const previousItem = state.inventory.items.find((i) => i.id === id);
  if (!previousItem) {
    sagaLogger.error('updateItemSaga: item not found', id);
    const errorMessage = 'Failed to save item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    return;
  }

  const optimisticItem: InventoryItem = {
    ...previousItem,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  yield put(updateItemSlice(optimisticItem));
  yield put(addUpdatingItemId(id));

  const existing = pendingUpdateTasks.get(id);
  if (existing) {
    yield cancel(existing);
    pendingUpdateTasks.delete(id);
  }
  const task = (yield fork(debouncedUpdateForId, id, previousItem)) as Task;
  pendingUpdateTasks.set(id, task);
}

/**
 * Handle batch updates separately without debounce (these are less frequent)
 */
function* updateItemBatchesSaga(action: {
  type: string;
  payload: { id: string; batches: InventoryItem['batches'] };
}): Generator<unknown, void, unknown> {
  const { id, batches } = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setError(null));

    // Optimistically update UI first
    const state = (yield select()) as RootState;
    const currentItem = state.inventory.items.find((i) => i.id === id);
    if (currentItem) {
      const optimisticItem = {
        ...currentItem,
        batches,
        updatedAt: new Date().toISOString(),
      };
      yield put(updateItemSlice(optimisticItem));
    }

    // Then call API
    const updatedItem = (yield call(
      [inventoryService, 'updateInventoryItem'],
      apiClient,
      homeId,
      id,
      { batches }
    )) as InventoryItem | null;

    if (updatedItem) {
      yield put(updateItemSlice(updatedItem));
    }
  } catch (error) {
    sagaLogger.error('Error updating item batches', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    // Revert on error
    yield call(loadItemsSaga);
  }
}

// Watcher
export function* inventorySaga(): Generator<unknown, void, unknown> {
  yield takeLatest(LOAD_ITEMS, loadItemsSaga);
  yield takeLatest(CREATE_ITEM, createItemSaga);
  yield takeEvery(DELETE_ITEM, deleteItemSaga);
  yield takeEvery(UPDATE_ITEM, updateItemDebounceSaga);
  yield takeEvery(UPDATE_ITEM_BATCHES, updateItemBatchesSaga);
}
