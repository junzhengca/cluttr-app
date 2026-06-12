import { put } from 'redux-saga/effects';
import { sagaLogger } from '../../../utils/Logger';
import { getGlobalToast } from '../../../utils/toastRegistry';
import i18n from '../../../i18n/i18n';

/** Matches the slices' `setError` action creators structurally. */
type SetErrorActionCreator = (message: string | null) => {
  type: string;
  payload: string | null;
};

/**
 * Shared error tail for domain sagas: log, store the message in the slice's
 * `error` field, and surface a toast. The message is the thrown Error's
 * message when available, otherwise the i18n fallback.
 */
export function* handleSagaError(
  error: unknown,
  config: {
    logMessage: string;
    setError: SetErrorActionCreator;
    fallbackKey: string;
    fallbackText: string;
  }
): Generator<unknown, void, unknown> {
  sagaLogger.error(config.logMessage, error);
  const errorMessage =
    error instanceof Error
      ? error.message
      : i18n.t(config.fallbackKey, config.fallbackText);
  yield put(config.setError(errorMessage));
  const toast = getGlobalToast();
  if (toast) toast(errorMessage, 'error');
}
