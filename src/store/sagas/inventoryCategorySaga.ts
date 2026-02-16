import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { RootState } from '../types';
import {
  setCategories,
  silentSetCategories,
  addCategory as addCategorySlice,
  updateCategory as updateCategorySlice,
  removeCategory as removeCategorySlice,
  setLoading,
  setError,
} from '../slices/inventoryCategorySlice';
import { inventoryCategoryService } from '../../services/InventoryCategoryService';
import type { ApiClient } from '../../services/ApiClient';
import type { InventoryCategory } from '../../types/inventory';
import { sagaLogger } from '../../utils/Logger';
import { getGlobalToast } from '../../components/organisms/ToastProvider';

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
    sagaLogger.error('No active home - cannot perform inventory category operation');
    throw new Error('No active home selected');
  }
  return activeHomeId;
}

function* loadCategoriesSaga(): Generator<unknown, void, unknown> {
  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const categories = (yield call(
      [inventoryCategoryService, 'fetchCategories'],
      apiClient,
      homeId
    )) as InventoryCategory[];
    yield put(setCategories(categories));
  } catch (error) {
    sagaLogger.error('Error loading inventory categories', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load categories';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* silentLoadCategoriesSaga(): Generator<unknown, void, unknown> {
  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    const categories = (yield call(
      [inventoryCategoryService, 'fetchCategories'],
      apiClient,
      homeId
    )) as InventoryCategory[];
    yield put(silentSetCategories(categories));
  } catch (error) {
    sagaLogger.error('Error silently loading inventory categories', error);
    // Don't update error state on silent load
  }
}

function* addCategorySaga(action: {
  type: string;
  payload: { name: string; description?: string; color?: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { name, description, color, icon } = action.payload;
  if (!name.trim()) return;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const newCategory = (yield call(
      [inventoryCategoryService, 'createCategory'],
      apiClient,
      homeId,
      { name, description, color, icon }
    )) as InventoryCategory | null;

    if (newCategory) {
      yield put(addCategorySlice(newCategory));
    }
  } catch (error) {
    sagaLogger.error('Error adding inventory category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add category';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  } finally {
    yield put(setLoading(false));
  }
}

function* updateCategorySaga(action: {
  type: string;
  payload: { id: string; name: string; description?: string; color?: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { id, name, description, color, icon } = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const updatedCategory = (yield call(
      [inventoryCategoryService, 'updateCategory'],
      apiClient,
      homeId,
      id,
      { name, description, color, icon }
    )) as InventoryCategory | null;

    if (updatedCategory) {
      yield put(updateCategorySlice(updatedCategory));
    }
  } catch (error) {
    sagaLogger.error('Error updating inventory category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update category';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  } finally {
    yield put(setLoading(false));
  }
}

function* deleteCategorySaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  const id = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    // Optimistically remove from UI first
    yield put(removeCategorySlice(id));

    // Then call API
    const success = (yield call(
      [inventoryCategoryService, 'deleteCategory'],
      apiClient,
      homeId,
      id
    )) as boolean;

    if (!success) {
      // Revert on failure
      sagaLogger.error('Failed to delete inventory category');
      const errorMessage = 'Failed to delete category';
      yield put(setError(errorMessage));
      // Reload categories to get correct state
      yield call(loadCategoriesSaga);
    }
  } catch (error) {
    sagaLogger.error('Error deleting inventory category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete category';
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    // Reload categories to revert optimistic update
    yield call(loadCategoriesSaga);
  } finally {
    yield put(setLoading(false));
  }
}

// Watcher
export function* inventoryCategorySaga(): Generator<unknown, void, unknown> {
  yield takeLatest(LOAD_CATEGORIES, loadCategoriesSaga);
  yield takeLatest(SILENT_LOAD_CATEGORIES, silentLoadCategoriesSaga);
  yield takeLatest(ADD_CATEGORY, addCategorySaga);
  yield takeLatest(UPDATE_CATEGORY, updateCategorySaga);
  yield takeLatest(DELETE_CATEGORY, deleteCategorySaga);
}
