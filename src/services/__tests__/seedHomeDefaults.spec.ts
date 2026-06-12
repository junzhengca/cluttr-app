/**
 * Unit tests for seedHomeDefaults
 *
 * Covers:
 * - one create call per preset (8 inventory categories, 5 locations, 12 todo
 *   categories) with the exact payloads, names resolved through i18n.t
 * - error containment: a throwing service never propagates out of seeding
 * - locale guard: every i18n key the presets rely on resolves to a non-empty
 *   string in en, zh-CN, and ja
 */

import { seedHomeDefaults } from '../seedHomeDefaults';
import { inventoryCategoryService } from '../InventoryCategoryService';
import { locationService } from '../LocationService';
import { todoCategoryService } from '../TodoCategoryService';
import i18n from '../../i18n/i18n';
import { storageLogger } from '../../utils/Logger';
import { defaultInventoryCategories } from '../../data/defaultCategories';
import { defaultLocations } from '../../data/defaultLocations';
import { defaultTodoCategoryIds } from '../../data/defaultTodoCategories';
import en from '../../i18n/locales/en.json';
import zhCN from '../../i18n/locales/zh-CN.json';
import ja from '../../i18n/locales/ja.json';

jest.mock('../InventoryCategoryService', () => ({
  inventoryCategoryService: { createCategory: jest.fn() },
}));
jest.mock('../LocationService', () => ({
  locationService: { createLocation: jest.fn() },
}));
jest.mock('../TodoCategoryService', () => ({
  todoCategoryService: { createCategory: jest.fn() },
}));
jest.mock('../../i18n/i18n', () => ({
  __esModule: true,
  default: { t: jest.fn() },
}));
jest.mock('../../utils/Logger', () => ({
  storageLogger: { error: jest.fn() },
}));

const mockedCreateCategory =
  inventoryCategoryService.createCategory as jest.Mock;
const mockedCreateLocation = locationService.createLocation as jest.Mock;
const mockedCreateTodoCategory =
  todoCategoryService.createCategory as unknown as jest.Mock;
const mockedT = i18n.t as unknown as jest.Mock;
const mockedLoggerError = storageLogger.error as jest.Mock;

const HOME_ID = 'home-1';

beforeEach(() => {
  // resetMocks is on in jest.config.js, so re-establish the implementation.
  mockedT.mockImplementation((key: string) => `tr:${key}`);
});

describe('seedHomeDefaults', () => {
  it('creates one inventory category per preset with i18n name, icon and color', () => {
    seedHomeDefaults(HOME_ID);

    expect(mockedCreateCategory).toHaveBeenCalledTimes(8);
    for (const preset of defaultInventoryCategories) {
      expect(mockedCreateCategory).toHaveBeenCalledWith(HOME_ID, {
        name: `tr:categories.${preset.id}`,
        icon: preset.icon,
        color: preset.color,
      });
    }
  });

  it('creates one location per preset with i18n name and icon', () => {
    seedHomeDefaults(HOME_ID);

    expect(mockedCreateLocation).toHaveBeenCalledTimes(5);
    for (const preset of defaultLocations) {
      expect(mockedCreateLocation).toHaveBeenCalledWith(HOME_ID, {
        name: `tr:locations.${preset.id}`,
        icon: preset.icon,
      });
    }
  });

  it('creates one name-only todo category per preset id', () => {
    seedHomeDefaults(HOME_ID);

    expect(mockedCreateTodoCategory).toHaveBeenCalledTimes(12);
    for (const id of defaultTodoCategoryIds) {
      expect(mockedCreateTodoCategory).toHaveBeenCalledWith(HOME_ID, {
        name: `tr:todoCategories.${id}`,
      });
    }
  });

  it('resolves every preset name through i18n exactly once', () => {
    seedHomeDefaults(HOME_ID);

    const expectedKeys = [
      ...defaultInventoryCategories.map((p) => `categories.${p.id}`),
      ...defaultLocations.map((p) => `locations.${p.id}`),
      ...defaultTodoCategoryIds.map((id) => `todoCategories.${id}`),
    ];
    expect(mockedT).toHaveBeenCalledTimes(expectedKeys.length);
    for (const key of expectedKeys) {
      expect(mockedT).toHaveBeenCalledWith(key);
    }
  });

  it('logs and swallows service errors instead of breaking home creation', () => {
    mockedCreateCategory.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    expect(() => seedHomeDefaults(HOME_ID)).not.toThrow();
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'Failed to seed default lists for new home',
      expect.any(Error)
    );
  });
});

describe('preset i18n keys exist in every locale', () => {
  const locales: Record<string, Record<string, Record<string, unknown>>> = {
    en,
    'zh-CN': zhCN,
    ja,
  };

  it.each(Object.keys(locales))('%s has all preset names', (locale) => {
    const translations = locales[locale];
    const lookups = [
      ...defaultInventoryCategories.map((p) => ['categories', p.id]),
      ...defaultLocations.map((p) => ['locations', p.id]),
      ...defaultTodoCategoryIds.map((id) => ['todoCategories', id]),
    ];
    for (const [namespace, id] of lookups) {
      const value = translations[namespace]?.[id];
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});
