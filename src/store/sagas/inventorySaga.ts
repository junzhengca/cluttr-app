import { call, put, select, takeLatest, takeEvery, delay, fork, cancel } from 'redux-saga/effects';
import type { Task } from 'redux-saga';
import type { RootState } from '../types';
import {
  setItems,
  updateItem as updateItemSlice,
  setLoading,
  setError,
  addUpdatingItemId,
  removeUpdatingItemId,
} from '../slices/inventorySlice';
import { setActiveHomeId } from '../slices/authSlice';
import { createSubscriptionSaga } from './firestoreSubscriptionSaga';
import { inventoryService } from '../../services/InventoryService';
import {
  inventoryCol,
  inventoryItemFromDoc,
} from '../../services/firebase/firestoreRefs';
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

/** Live inventory listener for the active home. */
const subscribeItemsSaga = createSubscriptionSaga<InventoryItem>({
  name: 'Inventory',
  buildQuery: inventoryCol,
  fromDoc: inventoryItemFromDoc,
  sort: (a, b) => b.createdAt.localeCompare(a.createdAt),
  setItems,
  setLoading,
  setError,
});

function* createItemSaga(action: {
  type: string;
  payload: Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));

    // Latency-compensated write: the local snapshot delivers the new item
    // immediately, even offline.
    const newItem = inventoryService.createInventoryItem(homeId, action.payload);
    sagaLogger.verbose(`Item created: id=${newItem.id}, name="${newItem.name}"`);
  } catch (error) {
    sagaLogger.error('Error creating item', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

function* deleteItemSaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));
    inventoryService.deleteInventoryItem(homeId, action.payload);
  } catch (error) {
    sagaLogger.error('Error deleting item', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

/**
 * Runs after DEBOUNCE_MS: writes the current state for this id to Firestore.
 * Coalesces keystroke-level edits into fewer billed writes; the snapshot is
 * the source of truth, so no revert logic is needed.
 */
function* debouncedUpdateForId(id: string): Generator<unknown, void, unknown> {
  try {
    yield delay(DEBOUNCE_MS);

    const state = (yield select()) as RootState;
    const currentItem = state.inventory.items.find((i) => i.id === id);
    if (!currentItem) return;

    const homeId = (yield call(getActiveHomeId)) as string;
    inventoryService.updateInventoryItem(homeId, id, {
      name: currentItem.name,
      location: currentItem.location,
      detailedLocation: currentItem.detailedLocation,
      status: currentItem.status,
      icon: currentItem.icon,
      iconColor: currentItem.iconColor,
      warningThreshold: currentItem.warningThreshold,
      categoryId: currentItem.categoryId,
      batches: currentItem.batches,
    });
  } catch (error) {
    sagaLogger.error('Error updating item', error);
  } finally {
    yield put(removeUpdatingItemId(id));
    pendingUpdateTasks.delete(id);
  }
}

/**
 * On each UPDATE_ITEM: apply optimistic update, then schedule a single debounced write per id.
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
  const task = (yield fork(debouncedUpdateForId, id)) as Task;
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
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));

    // Optimistic local update; the snapshot confirms it
    const state = (yield select()) as RootState;
    const currentItem = state.inventory.items.find((i) => i.id === id);
    if (currentItem) {
      yield put(
        updateItemSlice({
          ...currentItem,
          batches,
          updatedAt: new Date().toISOString(),
        }),
      );
    }

    inventoryService.updateInventoryItem(homeId, id, { batches });
  } catch (error) {
    sagaLogger.error('Error updating item batches', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update item';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

// Watcher
export function* inventorySaga(): Generator<unknown, void, unknown> {
  yield takeLatest([setActiveHomeId.type, LOAD_ITEMS], subscribeItemsSaga);
  yield takeLatest(CREATE_ITEM, createItemSaga);
  yield takeEvery(DELETE_ITEM, deleteItemSaga);
  yield takeEvery(UPDATE_ITEM, updateItemDebounceSaga);
  yield takeEvery(UPDATE_ITEM_BATCHES, updateItemBatchesSaga);
}
