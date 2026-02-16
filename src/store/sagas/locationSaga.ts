import { call, put, select, takeLatest, takeEvery, delay, fork, cancel } from 'redux-saga/effects';
import type { Task } from 'redux-saga';
import type { RootState } from '../types';
import {
  setLocations,
  addLocation as addLocationSlice,
  updateLocation as updateLocationSlice,
  removeLocation as removeLocationSlice,
  setLoading,
  setAddingLocation,
  addUpdatingLocationId,
  removeUpdatingLocationId,
  setError,
} from '../slices/locationSlice';
import { locationService } from '../../services/LocationService';
import type { ApiClient } from '../../services/ApiClient';
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
    sagaLogger.error('No active home - cannot perform location operation');
    throw new Error('No active home selected');
  }
  return activeHomeId;
}

function* loadLocationsSaga(): Generator<unknown, void, unknown> {
  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const locations = (yield call(
      [locationService, 'fetchLocations'],
      apiClient,
      homeId
    )) as Location[];
    yield put(setLocations(locations));
  } catch (error) {
    sagaLogger.error('Error loading locations', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load locations';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* addLocationSaga(action: {
  type: string;
  payload: { name: string; icon?: string };
}): Generator<unknown, void, unknown> {
  const { name, icon } = action.payload;
  if (!name.trim()) return;

  sagaLogger.verbose(`addLocationSaga - Creating location: "${name}"`);

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setAddingLocation(true));
    yield put(setError(null));

    const newLocation = (yield call(
      [locationService, 'createLocation'],
      apiClient,
      homeId,
      { name, icon }
    )) as Location | null;

    if (newLocation) {
      sagaLogger.verbose(
        `Location created: id=${newLocation.id}, name="${newLocation.name}"`
      );
      yield put(addLocationSlice(newLocation));
    } else {
      sagaLogger.error('Failed to create location: newLocation is null/undefined');
      yield put(setError('Failed to create location'));
    }
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
  const id = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setError(null));

    // Optimistically remove from UI first
    yield put(removeLocationSlice(id));

    // Then call API
    const success = (yield call(
      [locationService, 'deleteLocation'],
      apiClient,
      homeId,
      id
    )) as boolean;

    if (!success) {
      // Revert on failure
      sagaLogger.error('Failed to delete location');
      const errorMessage = i18n.t('location.deleteError', 'Failed to delete location');
      yield put(setError(errorMessage));
      const toast = getGlobalToast();
      if (toast) toast(errorMessage, 'error');
      // Reload locations to get correct state
      yield call(loadLocationsSaga);
    }
  } catch (error) {
    sagaLogger.error('Error deleting location', error);
    const errorMessage =
      error instanceof Error ? error.message : i18n.t('location.deleteError', 'Failed to delete location');
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    // Reload locations to revert optimistic update
    yield call(loadLocationsSaga);
  }
}

/**
 * Runs after DEBOUNCE_MS: sends current state for this id to API, then applies or reverts.
 * previousLocation is the state before the optimistic update (used to revert on error).
 */
function* debouncedUpdateForId(
  id: string,
  previousLocation: Location
): Generator<unknown, void, unknown> {
  let payloadSent = { name: '', icon: '' as string | undefined };
  try {
    yield delay(DEBOUNCE_MS);

    const state = (yield select()) as RootState;
    const currentLocation = state.location.locations.find((l) => l.id === id);
    if (!currentLocation) return;

    payloadSent = {
      name: currentLocation.name.trim(),
      icon: currentLocation.icon,
    };

    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    const updatedLocation = (yield call(
      [locationService, 'updateLocation'],
      apiClient,
      homeId,
      id,
      { name: payloadSent.name, icon: payloadSent.icon }
    )) as Location | null;

    if (updatedLocation) {
      const stateAfter = (yield select()) as RootState;
      const now = stateAfter.location.locations.find((l) => l.id === id);
      const stillCurrent =
        now &&
        now.name.trim() === payloadSent.name &&
        now.icon === payloadSent.icon;
      if (stillCurrent) {
        yield put(updateLocationSlice(updatedLocation));
      }
    }
  } catch (error) {
    sagaLogger.error('Error updating location', error);
    const errorMessage =
      error instanceof Error ? error.message : i18n.t('location.updateError', 'Failed to save location');
    const stateAfter = (yield select()) as RootState;
    const now = stateAfter.location.locations.find((l) => l.id === id);
    const stillCurrent =
      now &&
      now.name.trim() === payloadSent.name &&
      now.icon === payloadSent.icon;
    if (stillCurrent) {
      yield put(updateLocationSlice(previousLocation));
      yield put(setError(errorMessage));
      const toast = getGlobalToast();
      if (toast) toast(errorMessage, 'error');
    }
  } finally {
    yield put(removeUpdatingLocationId(id));
    pendingUpdateTasks.delete(id);
  }
}

/**
 * On each UPDATE_LOCATION: apply optimistic update, then schedule a single debounced API call per id.
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
  const task = (yield fork(debouncedUpdateForId, id, previousLocation)) as Task;
  pendingUpdateTasks.set(id, task);
}

// Watcher
export function* locationSaga(): Generator<unknown, void, unknown> {
  yield takeLatest(LOAD_LOCATIONS, loadLocationsSaga);
  yield takeLatest(ADD_LOCATION, addLocationSaga);
  yield takeEvery(DELETE_LOCATION, deleteLocationSaga);
  yield takeEvery(UPDATE_LOCATION, updateLocationDebounceSaga);
}
