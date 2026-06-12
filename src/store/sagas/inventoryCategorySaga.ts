import { call, takeLatest, put } from 'redux-saga/effects';
import {
  setCategories,
  setLoading,
  setError,
} from '../slices/inventoryCategorySlice';
import { setActiveHomeId } from '../slices/authSlice';
import { createSubscriptionSaga } from './firestoreSubscriptionSaga';
import { requireActiveHomeId } from './helpers/requireActiveHomeId';
import { handleSagaError } from './helpers/handleSagaError';
import { inventoryCategoryService } from '../../services/InventoryCategoryService';
import {
  inventoryCategoriesCol,
  inventoryCategoryFromDoc,
} from '../../services/firebase/firestoreRefs';
import type { InventoryCategory } from '../../types/inventory';
import { sagaLogger } from '../../utils/Logger';

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
    const homeId = (yield call(requireActiveHomeId, 'inventory category')) as string;
    yield put(setError(null));
    inventoryCategoryService.createCategory(homeId, { name, description, color, icon });
  } catch (error) {
    yield call(handleSagaError, error, {
      logMessage: 'Error adding inventory category',
      setError,
      fallbackKey: 'inventoryCategory.addError',
      fallbackText: 'Failed to add category',
    });
  }
}

function* updateCategorySaga(action: {
  type: string;
  payload: { id: string; name: string; description?: string; color?: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { id, name, description, color, icon } = action.payload;

  try {
    const homeId = (yield call(requireActiveHomeId, 'inventory category')) as string;
    yield put(setError(null));
    inventoryCategoryService.updateCategory(homeId, id, { name, description, color, icon });
  } catch (error) {
    yield call(handleSagaError, error, {
      logMessage: 'Error updating inventory category',
      setError,
      fallbackKey: 'inventoryCategory.updateError',
      fallbackText: 'Failed to update category',
    });
  }
}

function* deleteCategorySaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(requireActiveHomeId, 'inventory category')) as string;
    yield put(setError(null));
    inventoryCategoryService.deleteCategory(homeId, action.payload);
  } catch (error) {
    yield call(handleSagaError, error, {
      logMessage: 'Error deleting inventory category',
      setError,
      fallbackKey: 'inventoryCategory.deleteError',
      fallbackText: 'Failed to delete category',
    });
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
