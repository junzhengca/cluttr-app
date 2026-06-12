/**
 * Unit tests for the requireActiveHomeId saga helper.
 *
 * The generator is driven manually with gen.next(value) — no redux-saga
 * runtime is involved.
 */

import { select } from 'redux-saga/effects';
import { requireActiveHomeId } from '../requireActiveHomeId';
import { sagaLogger } from '../../../../utils/Logger';

jest.mock('../../../../utils/Logger', () => ({
  sagaLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    verbose: jest.fn(),
  },
}));

describe('requireActiveHomeId', () => {
  it('yields a parameterless select effect first', () => {
    const gen = requireActiveHomeId('inventory');

    const first = gen.next();

    expect(first.done).toBe(false);
    expect(first.value).toEqual(select());
  });

  it('returns the active home id when present in state', () => {
    const gen = requireActiveHomeId('inventory');
    gen.next(); // select effect

    const result = gen.next({ auth: { activeHomeId: 'home-123' } });

    expect(result.done).toBe(true);
    expect(result.value).toBe('home-123');
    expect(sagaLogger.error).not.toHaveBeenCalled();
  });

  it('throws and logs when no home is active (null)', () => {
    const gen = requireActiveHomeId('inventory');
    gen.next(); // select effect

    expect(() => gen.next({ auth: { activeHomeId: null } })).toThrow(
      'No active home selected'
    );
    expect(sagaLogger.error).toHaveBeenCalledTimes(1);
    expect(sagaLogger.error).toHaveBeenCalledWith(
      'No active home - cannot perform inventory operation'
    );
  });

  it('throws when activeHomeId is an empty string (falsy)', () => {
    const gen = requireActiveHomeId('todo');
    gen.next(); // select effect

    expect(() => gen.next({ auth: { activeHomeId: '' } })).toThrow(
      'No active home selected'
    );
    expect(sagaLogger.error).toHaveBeenCalledWith(
      'No active home - cannot perform todo operation'
    );
  });
});
