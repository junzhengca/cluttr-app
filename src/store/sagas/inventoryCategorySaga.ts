import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { RootState } from '../types';
import {
  setCategories,
  setLoading,
  setError,
} from '../slices/inventoryCategorySlice';
import { setActiveHomeId } from '../slices/authSlice';
import { createSubscriptionSaga } from './firestoreSubscriptionSaga';
import { inventoryCategoryService } from '../../services/InventoryCategoryService';
import {
  inventoryCategoriesCol,
  inventoryCategoryFromDoc,
} from '../../services/firebase/firestoreRefs';
import type { InventoryCategory } from '../../types/inventory';
import { sagaLogger } from '../../utils/Logger';
import { getGlobalToast } from '../../utils/toastRegistry';

// Action types
const LOAD_CATEGORIES = 'inventoryCategory/LOAD_CATEGORIES';
const SILENT_LOAD_CATEGORIES = 'inventoryCategory/SILENT_LOAD_CATEGORIES';
const ADD_CATEGORY = 'inventoryCategory/ADD_CATEGORY';
const UPDATE_CATEGORY = 'inventoryCategory/UPDATE_CATEGORY';
const DELETE_CATEGORY = 'inventoryCategory/DELETE_CATEGORY';

// Action creators
export const loadCategories = () => ({ type: LOAD_CATEGORIES });
export const silentLoadCategories = () => ({ type: SILENT_LOAD_CATEGORIES });
export const addCategoryAction = (name: string, description?: string, color?: string, icon?: string) => ({
  type: ADD_CATEGORY,
  payload: { name, description, color, icon },
});
export const updateCategoryAction = (id: string, name: string, description?: string, color?: string, icon?: string) => ({
  type: UPDATE_CATEGORY,
  payload: { id, name, description, color, icon },
});
export const deleteCategoryAction = (id: string) => ({
  type: DELETE_CATEGORY,
  payload: id,
});

/**
 * Get active home ID from Redux state
 */
function* getActiveHomeId(): Generator<unknown, string, unknown> {
  const state = (yield select()) as RootState;
  const activeHomeId = state.auth.activeHomeId;
  if (!activeHomeId) {
    sagaLogger.error('No active home - cannot perform inventory category operation');
    throw new Error('No active home selected');
  }
  return activeHomeId;
}

/** Live inventory-categories listener for the active home. */
const subscribeCategoriesSaga = createSubscriptionSaga<InventoryCategory>({
  name: 'Inventory categories',
  buildQuery: inventoryCategoriesCol,
  fromDoc: inventoryCategoryFromDoc,
  sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
  setItems: setCategories,
  setLoading,
  setError,
});

/** Silent loads are no-ops: the live listener is already current. */
function* silentLoadCategoriesSaga(): Generator<unknown, void, unknown> {
  yield call([sagaLogger, 'verbose'], 'Silent category load skipped (live listener active)');
}

function* addCategorySaga(action: {
  type: string;
  payload: { name: string; description?: string; color?: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { name, description, color, icon } = action.payload;
  if (!name.trim()) return;

  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));
    inventoryCategoryService.createCategory(homeId, { name, description, color, icon });
  } catch (error) {
    sagaLogger.error('Error adding inventory category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add category';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

function* updateCategorySaga(action: {
  type: string;
  payload: { id: string; name: string; description?: string; color?: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { id, name, description, color, icon } = action.payload;

  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));
    inventoryCategoryService.updateCategory(homeId, id, { name, description, color, icon });
  } catch (error) {
    sagaLogger.error('Error updating inventory category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update category';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

function* deleteCategorySaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));
    inventoryCategoryService.deleteCategory(homeId, action.payload);
  } catch (error) {
    sagaLogger.error('Error deleting inventory category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete category';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

// Watcher
export function* inventoryCategorySaga(): Generator<unknown, void, unknown> {
  yield takeLatest([setActiveHomeId.type, LOAD_CATEGORIES], subscribeCategoriesSaga);
  yield takeLatest(SILENT_LOAD_CATEGORIES, silentLoadCategoriesSaga);
  yield takeLatest(ADD_CATEGORY, addCategorySaga);
  yield takeLatest(UPDATE_CATEGORY, updateCategorySaga);
  yield takeLatest(DELETE_CATEGORY, deleteCategorySaga);
}
