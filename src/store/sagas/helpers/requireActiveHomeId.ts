import { select } from 'redux-saga/effects';
import type { RootState } from '../../types';
import { sagaLogger } from '../../../utils/Logger';

/**
 * Select the active home ID from Redux state. Throws if no home is active so
 * the calling saga's catch block surfaces the error; `domain` only labels the
 * log line (e.g. 'inventory', 'todo').
 */
export function* requireActiveHomeId(
  domain: string,
): Generator<unknown, string, unknown> {
  const state = (yield select()) as RootState;
  const activeHomeId = state.auth.activeHomeId;
  if (!activeHomeId) {
    sagaLogger.error(`No active home - cannot perform ${domain} operation`);
    throw new Error('No active home selected');
  }
  return activeHomeId;
}
