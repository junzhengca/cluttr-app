import { call, put, select, takeLatest, takeEvery, delay, fork, cancel } from 'redux-saga/effects';
import type { Task } from 'redux-saga';
import type { RootState } from '../types';
import {
  setLocations,
  updateLocation as updateLocationSlice,
  setLoading,
  setAddingLocation,
  addUpdatingLocationId,
  removeUpdatingLocationId,
  setError,
} from '../slices/locationSlice';
import { setActiveHomeId } from '../slices/authSlice';
import { createSubscriptionSaga } from './firestoreSubscriptionSaga';
import { locationService } from '../../services/LocationService';
import {
  locationsCol,
  locationFromDoc,
} from '../../services/firebase/firestoreRefs';
import type { Location } from '../../types/inventory';
import { sagaLogger } from '../../utils/Logger';
import { getGlobalToast } from '../../components/organisms/ToastProvider';
import i18n from '../../i18n/i18n';
import Ionicons from '@expo/vector-icons/Ionicons';

// Action types
const LOAD_LOCATIONS = 'location/LOAD_LOCATIONS';
const ADD_LOCATION = 'location/ADD_LOCATION';
const DELETE_LOCATION = 'location/DELETE_LOCATION';
const UPDATE_LOCATION = 'location/UPDATE_LOCATION';

// Action creators
export const loadLocations = () => ({ type: LOAD_LOCATIONS });
export const addLocationAction = (name: string, icon?: string) => ({
  type: ADD_LOCATION,
  payload: { name, icon },
});
export const deleteLocationAction = (id: string) => ({
  type: DELETE_LOCATION,
  payload: id,
});
export const updateLocationAction = (id: string, name: string, icon?: string) => ({
  type: UPDATE_LOCATION,
  payload: { id, name, icon },
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
    sagaLogger.error('No active home - cannot perform location operation');
    throw new Error('No active home selected');
  }
  return activeHomeId;
}

/** Live locations listener for the active home. */
const subscribeLocationsSaga = createSubscriptionSaga<Location>({
  name: 'Locations',
  buildQuery: locationsCol,
  fromDoc: locationFromDoc,
  sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
  setItems: setLocations,
  setLoading,
  setError,
});

function* addLocationSaga(action: {
  type: string;
  payload: { name: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { name, icon } = action.payload;
  if (!name.trim()) return;

  sagaLogger.verbose(`addLocationSaga - Creating location: "${name}"`);

  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setAddingLocation(true));
    yield put(setError(null));

    const newLocation = locationService.createLocation(homeId, { name, icon });
    sagaLogger.verbose(`Location created: id=${newLocation.id}, name="${newLocation.name}"`);
  } catch (error) {
    sagaLogger.error('Error adding location', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add location';
    yield put(setError(errorMessage));
  } finally {
    yield put(setAddingLocation(false));
  }
}

function* deleteLocationSaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(getActiveHomeId)) as string;
    yield put(setError(null));
    locationService.deleteLocation(homeId, action.payload);
  } catch (error) {
    sagaLogger.error('Error deleting location', error);
    const errorMessage =
      error instanceof Error ? error.message : i18n.t('location.deleteError', 'Failed to delete location');
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

/**
 * Runs after DEBOUNCE_MS: writes the current state for this id to Firestore.
 */
function* debouncedUpdateForId(id: string): Generator<unknown, void, unknown> {
  try {
    yield delay(DEBOUNCE_MS);

    const state = (yield select()) as RootState;
    const currentLocation = state.location.locations.find((l) => l.id === id);
    if (!currentLocation) return;

    const homeId = (yield call(getActiveHomeId)) as string;
    locationService.updateLocation(homeId, id, {
      name: currentLocation.name.trim(),
      icon: currentLocation.icon,
    });
  } catch (error) {
    sagaLogger.error('Error updating location', error);
  } finally {
    yield put(removeUpdatingLocationId(id));
    pendingUpdateTasks.delete(id);
  }
}

/**
 * On each UPDATE_LOCATION: apply optimistic update, then schedule a single debounced write per id.
 */
function* updateLocationDebounceSaga(action: {
  type: string;
  payload: { id: string; name: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { id, name, icon } = action.payload;

  const state = (yield select()) as RootState;
  const previousLocation = state.location.locations.find((l) => l.id === id);
  if (!previousLocation) {
    sagaLogger.error('updateLocationSaga: location not found', id);
    const errorMessage = i18n.t('location.updateError', 'Failed to save location');
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    return;
  }

  const optimisticLocation: Location = {
    ...previousLocation,
    name: name.trim(),
    icon: icon !== undefined ? (icon as keyof typeof Ionicons.glyphMap) : previousLocation.icon,
  };
  yield put(updateLocationSlice(optimisticLocation));
  yield put(addUpdatingLocationId(id));

  const existing = pendingUpdateTasks.get(id);
  if (existing) {
    yield cancel(existing);
    pendingUpdateTasks.delete(id);
  }
  const task = (yield fork(debouncedUpdateForId, id)) as Task;
  pendingUpdateTasks.set(id, task);
}

// Watcher
export function* locationSaga(): Generator<unknown, void, unknown> {
  yield takeLatest([setActiveHomeId.type, LOAD_LOCATIONS], subscribeLocationsSaga);
  yield takeLatest(ADD_LOCATION, addLocationSaga);
  yield takeEvery(DELETE_LOCATION, deleteLocationSaga);
  yield takeEvery(UPDATE_LOCATION, updateLocationDebounceSaga);
}
