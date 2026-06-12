import { call, put, select, take, delay } from 'redux-saga/effects';
import type { EventChannel } from 'redux-saga';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { Action } from '@reduxjs/toolkit';
import type { RootState } from '../types';
import { setActiveHomeId } from '../slices/authSlice';
import { accessDenied } from './authSaga';
import {
  createSnapshotChannel,
  isPermissionDenied,
  SnapshotEvent,
} from '../../services/firebase/firestoreRefs';
import { sagaLogger } from '../../utils/Logger';

// A freshly created home (or just-accepted membership) may not have committed
// server-side when listeners attach, producing a transient permission-denied.
const PERMISSION_RETRIES = 2;
const PERMISSION_RETRY_DELAY_MS = 1500;

interface SubscriptionConfig<T> {
  /** Listener name for logs, e.g. 'Inventory'. */
  name: string;
  buildQuery: (homeId: string) => FirebaseFirestoreTypes.Query;
  fromDoc: (doc: FirebaseFirestoreTypes.DocumentSnapshot, homeId: string) => T;
  sort: (a: T, b: T) => number;
  setItems: (items: T[]) => Action;
  setLoading?: (loading: boolean) => Action;
  setError?: (error: string | null) => Action;
}

/**
 * Build a saga that maintains a live Firestore listener for the active home.
 * Wire it with `takeLatest([setActiveHomeId.type, LOAD_X], saga)` — takeLatest
 * cancels the previous listener on home switch / logout / refresh, and the
 * finally block detaches the snapshot listener.
 *
 * Permission-denied errors are retried a few times (writes creating the home
 * may still be in flight) before being treated as real access revocation.
 */
export function createSubscriptionSaga<T>(config: SubscriptionConfig<T>) {
  return function* subscriptionSaga(action: {
    type: string;
    payload?: string | null;
  }): Generator<unknown, void, unknown> {
    const homeId =
      action.type === setActiveHomeId.type
        ? (action.payload as string | null)
        : ((yield select()) as RootState).auth.activeHomeId;

    if (!homeId) {
      yield put(config.setItems([]));
      if (config.setLoading) yield put(config.setLoading(false));
      return;
    }

    if (config.setLoading) yield put(config.setLoading(true));
    if (config.setError) yield put(config.setError(null));

    let retriesLeft = PERMISSION_RETRIES;

    for (;;) {
      const channel = (yield call(
        createSnapshotChannel,
        config.buildQuery(homeId)
      )) as EventChannel<SnapshotEvent>;
      let retry = false;

      try {
        while (true) {
          const event = (yield take(channel)) as SnapshotEvent;

          if (event.error) {
            // onSnapshot errors are terminal — the listener has stopped.
            if (isPermissionDenied(event.error) && retriesLeft > 0) {
              retriesLeft--;
              retry = true;
              sagaLogger.warn(
                `${config.name} listener permission-denied, retrying (${retriesLeft} left)`
              );
              break;
            }
            sagaLogger.error(`${config.name} listener error`, event.error);
            if (isPermissionDenied(event.error)) {
              yield put(accessDenied(homeId));
            } else if (config.setError) {
              yield put(config.setError(event.error.message));
            }
            if (config.setLoading) yield put(config.setLoading(false));
            break;
          }

          retriesLeft = PERMISSION_RETRIES;
          const items = event
            .snapshot!.docs.map((doc) => config.fromDoc(doc, homeId))
            .sort(config.sort);
          yield put(config.setItems(items));
          if (config.setLoading) yield put(config.setLoading(false));
        }
      } finally {
        channel.close();
      }

      if (!retry) return;
      yield delay(PERMISSION_RETRY_DELAY_MS);
    }
  };
}
