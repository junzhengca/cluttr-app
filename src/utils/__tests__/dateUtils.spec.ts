/**
 * Unit tests for dateUtils
 *
 * Covers: isExpiringSoon, countExpiringItems
 */

import { isExpiringSoon, countExpiringItems } from '../dateUtils';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** ISO string offset from now by the given number of days (plus a 1h safety margin). */
const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * DAY_MS + HOUR_MS).toISOString();

describe('isExpiringSoon', () => {
  it('returns true for a date within the default 7-day window', () => {
    expect(isExpiringSoon(daysFromNow(3))).toBe(true);
  });

  it('returns true for a date just inside the window edge', () => {
    expect(isExpiringSoon(daysFromNow(6))).toBe(true);
  });

  it('returns false for a date beyond the window', () => {
    expect(isExpiringSoon(daysFromNow(8))).toBe(false);
  });

  it('returns false for a date in the past', () => {
    expect(isExpiringSoon(daysFromNow(-1))).toBe(false);
  });

  it('respects a custom day window', () => {
    expect(isExpiringSoon(daysFromNow(10), 14)).toBe(true);
    expect(isExpiringSoon(daysFromNow(10), 5)).toBe(false);
  });

  it('accepts a Date object', () => {
    expect(isExpiringSoon(new Date(Date.now() + 2 * DAY_MS))).toBe(true);
  });

  it('returns false for null', () => {
    expect(isExpiringSoon(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isExpiringSoon(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isExpiringSoon('')).toBe(false);
  });

  it('returns false for an invalid date string', () => {
    expect(isExpiringSoon('not-a-date')).toBe(false);
  });

  it('returns false for an invalid Date object', () => {
    expect(isExpiringSoon(new Date('invalid'))).toBe(false);
  });
});

describe('countExpiringItems', () => {
  it('returns 0 for an empty array', () => {
    expect(countExpiringItems([])).toBe(0);
  });

  it('counts items whose earliest batch expiry is within the window', () => {
    const items = [
      { batches: [{ expiryDate: daysFromNow(2) }] }, // expiring
      { batches: [{ expiryDate: daysFromNow(30) }] }, // not expiring
      { batches: [{ expiryDate: daysFromNow(5) }] }, // expiring
    ];
    expect(countExpiringItems(items)).toBe(2);
  });

  it('uses the earliest expiry date across batches', () => {
    const items = [
      {
        batches: [
          { expiryDate: daysFromNow(30) },
          { expiryDate: daysFromNow(2) }, // earliest, within window
        ],
      },
    ];
    expect(countExpiringItems(items)).toBe(1);
  });

  it('skips items without batches', () => {
    expect(countExpiringItems([{}, { batches: undefined }])).toBe(0);
  });

  it('skips items with empty batches arrays', () => {
    expect(countExpiringItems([{ batches: [] }])).toBe(0);
  });

  it('ignores batches without an expiry date', () => {
    const items = [
      { batches: [{ expiryDate: undefined }, { expiryDate: null }] },
      { batches: [{ expiryDate: null }, { expiryDate: daysFromNow(1) }] },
    ];
    expect(countExpiringItems(items)).toBe(1);
  });

  it('does not count items whose earliest expiry is in the past', () => {
    const items = [{ batches: [{ expiryDate: daysFromNow(-2) }, { expiryDate: daysFromNow(3) }] }];
    // Earliest (past) date is used, and past dates are not "expiring soon"
    expect(countExpiringItems(items)).toBe(0);
  });

  it('respects a custom day window', () => {
    const items = [{ batches: [{ expiryDate: daysFromNow(10) }] }];
    expect(countExpiringItems(items, 14)).toBe(1);
    expect(countExpiringItems(items, 7)).toBe(0);
  });
});
