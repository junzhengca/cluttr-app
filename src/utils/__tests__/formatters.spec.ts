/**
 * Unit tests for formatters utilities
 *
 * Covers: formatLocation, formatDate, formatPrice, formatCurrency
 */

import { formatLocation, formatDate, formatPrice, formatCurrency } from '../formatters';
import type { LocationTranslateFn } from '../locationI18n';

// Simple translation stub: returns a mapped value, then defaultValue, then the key
const translations: Record<string, string> = {
  'locations.living-room': 'Living Room',
  'locations.kitchen': 'Kitchen',
  'itemDetails.notSet': 'Not set',
};

const t: LocationTranslateFn = (key, options) =>
  translations[key] ?? options?.defaultValue ?? key;

describe('formatLocation', () => {
  it('formats a default location without detailed location', () => {
    expect(formatLocation('living-room', undefined, t)).toBe('Living Room');
  });

  it('formats a default location with detailed location', () => {
    expect(formatLocation('living-room', 'Desk', t)).toBe('Living Room • Desk');
  });

  it('treats empty detailed location as absent', () => {
    expect(formatLocation('kitchen', '', t)).toBe('Kitchen');
  });

  it('treats whitespace-only detailed location as absent', () => {
    expect(formatLocation('kitchen', '   ', t)).toBe('Kitchen');
  });

  it('uses the resolved name for custom locations', () => {
    expect(formatLocation('abc123-custom-id', undefined, t, 'Wine Cellar')).toBe('Wine Cellar');
  });

  it('falls back to the raw id for custom locations without a name', () => {
    expect(formatLocation('abc123-custom-id', undefined, t)).toBe('abc123-custom-id');
  });

  it('appends detailed location to custom location names', () => {
    expect(formatLocation('abc123-custom-id', 'Top shelf', t, 'Wine Cellar')).toBe(
      'Wine Cellar • Top shelf'
    );
  });
});

describe('formatDate', () => {
  it('formats a Date object with the default zh-CN locale', () => {
    const date = new Date(2024, 0, 15); // Jan 15 2024, local time
    expect(formatDate(date)).toBe('2024/01/15');
  });

  it('formats an ISO date string', () => {
    // Local-time ISO string to avoid timezone day shifts
    expect(formatDate('2024-03-05T12:00:00')).toBe('2024/03/05');
  });

  it('formats with an explicit locale', () => {
    const date = new Date(2024, 0, 15);
    expect(formatDate(date, 'en-US')).toBe('01/15/2024');
  });

  it('returns the default fallback for null', () => {
    expect(formatDate(null)).toBe('未设置');
  });

  it('returns the default fallback for undefined', () => {
    expect(formatDate(undefined)).toBe('未设置');
  });

  it('returns the default fallback for an empty string', () => {
    expect(formatDate('')).toBe('未设置');
  });

  it('returns the default fallback for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('未设置');
  });

  it('returns the default fallback for an invalid Date object', () => {
    expect(formatDate(new Date('invalid'))).toBe('未设置');
  });

  it('uses the translated fallback when t is provided', () => {
    expect(formatDate(null, 'zh-CN', (key) => translations[key] ?? key)).toBe('Not set');
    expect(formatDate('garbage', 'zh-CN', (key) => translations[key] ?? key)).toBe('Not set');
  });
});

describe('formatPrice', () => {
  it('formats a price with a currency symbol', () => {
    expect(formatPrice(100, '$')).toBe('$ 100');
  });

  it('formats zero', () => {
    expect(formatPrice(0, '¥')).toBe('¥ 0');
  });

  it('applies locale grouping for large numbers', () => {
    expect(formatPrice(1000, '¥')).toBe(`¥ ${(1000).toLocaleString()}`);
  });
});

describe('formatCurrency', () => {
  describe('without wan format (default)', () => {
    it('formats small values as-is', () => {
      expect(formatCurrency(999, '$')).toBe('$ 999');
    });

    it('formats zero', () => {
      expect(formatCurrency(0, '$')).toBe('$ 0');
    });

    it('rounds and groups values >= 1000', () => {
      expect(formatCurrency(1234.56, '$')).toBe(`$ ${(1235).toLocaleString()}`);
    });

    it('does not shorten large values', () => {
      expect(formatCurrency(2000000, '$')).toBe(`$ ${(2000000).toLocaleString()}`);
    });
  });

  describe('with wan format, Chinese locale', () => {
    it('uses 亿 for values >= 100 million', () => {
      expect(formatCurrency(150000000, '¥', true, 'zh-CN')).toBe('¥1.5亿');
    });

    it('uses w with no decimals for >= 1 million when wan >= 100', () => {
      expect(formatCurrency(1500000, '¥', true, 'zh-CN')).toBe('¥150w');
    });

    it('uses w with one decimal for >= 10,000', () => {
      expect(formatCurrency(15000, '¥', true, 'zh-CN')).toBe('¥1.5w');
    });

    it('uses lowercase k for >= 1,000', () => {
      expect(formatCurrency(1500, '¥', true, 'zh-CN')).toBe('¥1.5k');
    });

    it('falls back to regular formatting below 1,000', () => {
      expect(formatCurrency(999, '¥', true, 'zh-CN')).toBe('¥ 999');
    });
  });

  describe('with wan format, English locale', () => {
    it('uses B for values >= 100 million', () => {
      expect(formatCurrency(1500000000, '$', true, 'en-US')).toBe('$1.5B');
    });

    it('uses M for >= 1 million', () => {
      expect(formatCurrency(2500000, '$', true, 'en-US')).toBe('$2.5M');
    });

    it('uses K for >= 10,000', () => {
      expect(formatCurrency(15000, '$', true, 'en-US')).toBe('$15.0K');
    });

    it('uses K for >= 1,000', () => {
      expect(formatCurrency(1500, '$', true, 'en-US')).toBe('$1.5K');
    });

    it('falls back to regular formatting below 1,000', () => {
      expect(formatCurrency(500, '$', true, 'en-US')).toBe('$ 500');
    });
  });
});
