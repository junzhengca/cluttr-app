/**
 * Unit tests for the handleSagaError saga helper.
 *
 * The generator is driven manually with gen.next() — no redux-saga runtime.
 * Covers: effect sequence (log -> put(setError) -> toast), Error-instance vs
 * i18n-fallback message branch, and the null-toast branch.
 */

import { put } from 'redux-saga/effects';
import { handleSagaError } from '../handleSagaError';
import { sagaLogger } from '../../../../utils/Logger';
import { getGlobalToast } from '../../../../utils/toastRegistry';
import i18n from '../../../../i18n/i18n';

jest.mock('../../../../utils/Logger', () => ({
  sagaLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
  },
}));

jest.mock('../../../../utils/toastRegistry', () => ({
  getGlobalToast: jest.fn(),
}));

jest.mock('../../../../i18n/i18n', () => ({
  __esModule: true,
  default: { t: jest.fn() },
}));

const mockedGetGlobalToast = getGlobalToast as unknown as jest.Mock;
const mockedT = i18n.t as unknown as jest.Mock;

// Plain action creator matching the slices' setError shape structurally.
const setError = (message: string | null) => ({
  type: 'test/setError',
  payload: message,
});

const config = {
  logMessage: 'Failed to create item',
  setError,
  fallbackKey: 'errors.createItemFailed',
  fallbackText: 'Failed to create item',
};

describe('handleSagaError', () => {
  it('logs, puts setError with the Error message, then toasts it (effect sequence)', () => {
    const toastFn = jest.fn();
    mockedGetGlobalToast.mockReturnValue(toastFn);
    const error = new Error('boom');
    const gen = handleSagaError(error, config);

    // First next: logs synchronously, then yields the put effect.
    const first = gen.next();
    expect(sagaLogger.error).toHaveBeenCalledTimes(1);
    expect(sagaLogger.error).toHaveBeenCalledWith('Failed to create item', error);
    expect(first.done).toBe(false);
    expect(first.value).toEqual(put(setError('boom')));

    // Toast has not fired yet — it runs after the put effect resumes.
    expect(toastFn).not.toHaveBeenCalled();

    // Second next: generator completes and surfaces the toast.
    const second = gen.next();
    expect(second.done).toBe(true);
    expect(toastFn).toHaveBeenCalledTimes(1);
    expect(toastFn).toHaveBeenCalledWith('boom', 'error');

    // Error-instance branch: i18n fallback is not consulted.
    expect(mockedT).not.toHaveBeenCalled();
  });

  it('uses the i18n fallback message when the error is not an Error instance', () => {
    const toastFn = jest.fn();
    mockedGetGlobalToast.mockReturnValue(toastFn);
    mockedT.mockReturnValue('Translated fallback');
    const gen = handleSagaError('plain string failure', config);

    const first = gen.next();

    expect(mockedT).toHaveBeenCalledTimes(1);
    expect(mockedT).toHaveBeenCalledWith(
      'errors.createItemFailed',
      'Failed to create item',
    );
    expect(first.value).toEqual(put(setError('Translated fallback')));

    gen.next();
    expect(toastFn).toHaveBeenCalledWith('Translated fallback', 'error');
  });

  it('does not crash when no global toast is registered', () => {
    mockedGetGlobalToast.mockReturnValue(null);
    const gen = handleSagaError(new Error('boom'), config);

    const first = gen.next();
    expect(first.value).toEqual(put(setError('boom')));

    const second = gen.next();
    expect(second.done).toBe(true);
    // setError was still dispatched and the logger still ran.
    expect(sagaLogger.error).toHaveBeenCalledWith(
      'Failed to create item',
      expect.any(Error),
    );
  });
});
