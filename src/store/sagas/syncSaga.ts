import { call, put, select, delay, spawn, take, actionChannel } from 'redux-saga/effects';
import { buffers } from '@redux-saga/core';
import { triggerCategoryRefresh } from '../slices/refreshSlice';
import { dataInitializationService } from '../../services/DataInitializationService';
import { Home } from '../../types/home';
import { HomeScopedEntity, InventoryItem, TodoCategory } from '../../types/inventory';
import { SyncDelta } from '../../types/sync';
import type { ApiClient } from '../../services/ApiClient';
import type { RootState } from '../types';
import { getDeviceId } from '../../utils/deviceUtils';
import { syncLogger } from '../../utils/Logger';
import { syncRegistry, type DeltaDispatchedEntity } from './syncRegistry';

// Action types
const SYNC_ALL = 'sync/SYNC_ALL';
const REQUEST_SYNC = 'sync/REQUEST_SYNC';

// Action creators
export const syncAllAction = () => ({ type: SYNC_ALL });
export const requestSync = () => ({ type: REQUEST_SYNC });

/**
 * Resolve pending IDs from Redux state for a given registry key.
 * Note: todoItems and todoCategories no longer use pending states (direct CRUD API)
 */
function getPendingIdsFromState(state: RootState, key: string): Set<string> {
  let items: { pendingUpdate?: boolean; pendingCreate?: boolean; id: string }[] = [];
  
  if (key === 'inventoryItems') {
    items = state.inventory.items;
  }
  
  return new Set(
    items.filter(i => i.pendingUpdate || i.pendingCreate).map(i => i.id)
  );
}

/**
 * Unified sync function that syncs ALL entity types for ALL homes.
 * Replaces both syncItemsSaga and syncTodosSaga.
 * Note: Homes are now fetched during auth flow, not during periodic sync.
 */
function* syncAllSaga(): Generator<unknown, void, unknown> {
  try {
    const state = (yield select()) as RootState;
    const { apiClient, isAuthenticated, activeHomeId } = state.auth;

    if (!apiClient || !isAuthenticated) return;

    syncLogger.info('Starting unified sync sequence');

    // 1. Get all homes from HomeService (homes should already be loaded from auth flow)
    const HomeModule = (yield import('../../services/HomeService')) as { homeService: { getHomes: () => Home[] } };
    const homeService = HomeModule.homeService;
    const homes = (yield call([homeService, 'getHomes'])) as Home[];
    const deviceId = (yield call(getDeviceId)) as string;

    syncLogger.info(`Syncing content for ${homes.length} homes`);

    let activeHomeChanged = false;

    // 3. For each home, sync ALL entity types unconditionally
    for (const home of homes) {
      try {
        syncLogger.info(`Processing home: ${home.name} (${home.id})`);

        // Ensure data files exist
        yield call([dataInitializationService, 'initializeHomeData'], home.id);

        const isActiveHome = home.id === activeHomeId;

        // Sync every registered entity type (unconditionally -- fixes pull bug)
        for (const entry of syncRegistry) {
          try {
            const delta = (yield call(
              entry.syncMethod,
              home.id,
              apiClient as ApiClient,
              deviceId,
            )) as SyncDelta<HomeScopedEntity>;

            if (isActiveHome && !delta.unchanged && (entry as { type: string }).type === 'delta') {
              activeHomeChanged = true;

              // Apply delta to Redux for delta-dispatched entities only
              const currentState = (yield select()) as RootState;
              const pendingIds = getPendingIdsFromState(currentState, entry.key);
              const deltaEntry = entry as DeltaDispatchedEntity<InventoryItem> | DeltaDispatchedEntity<TodoCategory>;

              // Dispatch created before updated to ensure new entities exist before updates
              if (delta.created.length > 0) {
                const filtered = delta.created.filter(e => !pendingIds.has(e.id));
                if (filtered.length > 0) {
                  if ('addAction' in deltaEntry) {
                    yield put(deltaEntry.addAction(filtered as InventoryItem[] & TodoCategory[]));
                  }
                }
              }
              if (delta.updated.length > 0) {
                const filtered = delta.updated.filter(e => !pendingIds.has(e.id));
                if (filtered.length > 0) {
                  if ('upsertAction' in deltaEntry) {
                    yield put(deltaEntry.upsertAction(filtered as InventoryItem[] & TodoCategory[]));
                  }
                }
              }
              if (delta.deleted.length > 0) {
                const filtered = delta.deleted.filter(id => !pendingIds.has(id));
                if (filtered.length > 0) {
                  if ('removeAction' in deltaEntry) {
                    yield put(deltaEntry.removeAction(filtered));
                  }
                }
              }
            }
          } catch (entityError) {
            syncLogger.error(`Error syncing ${entry.key} for home ${home.id}`, entityError);
            // Continue to next entity type
          }
        }
      } catch (homeError) {
        syncLogger.error(`Error syncing home ${home.id}`, homeError);
        // Continue to next home
      }
    }

    // 4. Refresh UI if active home had changes
    if (activeHomeChanged) {
      yield put(triggerCategoryRefresh());
    } else {
      syncLogger.info('No changes for active home - skipping UI refresh');
    }

  } catch (error) {
    syncLogger.error('Error in unified sync sequence', error);
  }
}

/**
 * Single periodic sync timer (replaces two independent timers).
 */
function* periodicSyncSaga(): Generator<unknown, void, unknown> {
  while (true) {
    yield delay(5 * 60 * 1000);
    const state = (yield select()) as RootState;
    if (state.auth.isAuthenticated) {
      syncLogger.info('Triggering periodic sync');
      yield put(syncAllAction());
    }
  }
}

/**
 * Single debounced sync channel (replaces two independent channels).
 * Uses a sliding buffer so only latest request is kept.
 */
function* debouncedSyncSaga(): Generator<unknown, void, unknown> {
  const channel = yield actionChannel(REQUEST_SYNC, buffers.sliding(1));

  syncLogger.verbose('Debounced sync saga started');

  while (true) {
    yield take(channel as Parameters<typeof take>[0]);

    // Wait 2 seconds for more requests to accumulate
    yield delay(2000);

    syncLogger.verbose('Debounced sync: executing sync after inactivity period');
    yield call(syncAllSaga);
  }
}

// Root sync saga
export function* syncSaga(): Generator<unknown, void, unknown> {
  // Listen for immediate sync requests
  yield spawn(function* () {
    while (true) {
      yield take(SYNC_ALL);
      yield call(syncAllSaga);
    }
  });

  // Start periodic sync
  yield spawn(periodicSyncSaga);

  // Start debounced sync
  yield spawn(debouncedSyncSaga);
}
