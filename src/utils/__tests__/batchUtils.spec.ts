/**
 * Unit tests for batchUtils
 *
 * Covers: getTotalAmount, getTotalValue, getEarliestExpiry, getLatestPurchase
 */

import {
  getTotalAmount,
  getTotalValue,
  getEarliestExpiry,
  getLatestPurchase,
} from '../batchUtils';
import type { ItemBatch } from '../../types/inventory';

const makeBatch = (overrides: Partial<ItemBatch> = {}): ItemBatch => ({
  id: 'batch-1',
  amount: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('getTotalAmount', () => {
  it('returns 0 for an empty array', () => {
    expect(getTotalAmount([])).toBe(0);
  });

  it('sums amounts across batches', () => {
    const batches = [
      makeBatch({ id: 'a', amount: 2 }),
      makeBatch({ id: 'b', amount: 3 }),
      makeBatch({ id: 'c', amount: 5 }),
    ];
    expect(getTotalAmount(batches)).toBe(10);
  });

  it('handles zero amounts', () => {
    const batches = [makeBatch({ amount: 0 }), makeBatch({ amount: 0 })];
    expect(getTotalAmount(batches)).toBe(0);
  });

  it('handles fractional amounts', () => {
    const batches = [makeBatch({ amount: 0.5 }), makeBatch({ amount: 1.5 })];
    expect(getTotalAmount(batches)).toBe(2);
  });
});

describe('getTotalValue', () => {
  it('returns 0 for an empty array', () => {
    expect(getTotalValue([])).toBe(0);
  });

  it('sums prices across batches', () => {
    const batches = [makeBatch({ price: 10 }), makeBatch({ price: 25.5 })];
    expect(getTotalValue(batches)).toBe(35.5);
  });

  it('treats missing prices as 0', () => {
    const batches = [
      makeBatch({ price: undefined }),
      makeBatch({ price: 10 }),
      makeBatch({}),
    ];
    expect(getTotalValue(batches)).toBe(10);
  });

  it('returns 0 when no batches have prices', () => {
    const batches = [makeBatch({}), makeBatch({})];
    expect(getTotalValue(batches)).toBe(0);
  });

  it('handles zero prices', () => {
    const batches = [makeBatch({ price: 0 }), makeBatch({ price: 5 })];
    expect(getTotalValue(batches)).toBe(5);
  });
});

describe('getEarliestExpiry', () => {
  it('returns undefined for an empty array', () => {
    expect(getEarliestExpiry([])).toBeUndefined();
  });

  it('returns undefined when no batches have an expiry date', () => {
    const batches = [makeBatch({}), makeBatch({ expiryDate: undefined })];
    expect(getEarliestExpiry(batches)).toBeUndefined();
  });

  it('returns the earliest expiry date', () => {
    const batches = [
      makeBatch({ expiryDate: '2025-06-01' }),
      makeBatch({ expiryDate: '2024-12-31' }),
      makeBatch({ expiryDate: '2025-01-15' }),
    ];
    expect(getEarliestExpiry(batches)).toBe('2024-12-31');
  });

  it('ignores batches without an expiry date', () => {
    const batches = [
      makeBatch({}),
      makeBatch({ expiryDate: '2025-03-01' }),
      makeBatch({ expiryDate: undefined }),
    ];
    expect(getEarliestExpiry(batches)).toBe('2025-03-01');
  });

  it('handles a single batch', () => {
    expect(getEarliestExpiry([makeBatch({ expiryDate: '2025-01-01' })])).toBe(
      '2025-01-01'
    );
  });
});

describe('getLatestPurchase', () => {
  it('returns undefined for an empty array', () => {
    expect(getLatestPurchase([])).toBeUndefined();
  });

  it('returns undefined when no batches have a purchase date', () => {
    const batches = [makeBatch({}), makeBatch({ purchaseDate: undefined })];
    expect(getLatestPurchase(batches)).toBeUndefined();
  });

  it('returns the latest purchase date', () => {
    const batches = [
      makeBatch({ purchaseDate: '2024-01-01' }),
      makeBatch({ purchaseDate: '2024-06-15' }),
      makeBatch({ purchaseDate: '2024-03-10' }),
    ];
    expect(getLatestPurchase(batches)).toBe('2024-06-15');
  });

  it('ignores batches without a purchase date', () => {
    const batches = [
      makeBatch({ purchaseDate: '2024-02-01' }),
      makeBatch({}),
      makeBatch({ purchaseDate: undefined }),
    ];
    expect(getLatestPurchase(batches)).toBe('2024-02-01');
  });

  it('handles a single batch', () => {
    expect(getLatestPurchase([makeBatch({ purchaseDate: '2024-05-05' })])).toBe(
      '2024-05-05'
    );
  });
});
