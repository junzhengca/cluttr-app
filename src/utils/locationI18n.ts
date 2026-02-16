/**
 * i18n for default locations.
 * IDs match server defaults (CluttrServer utils/location_helpers.ts).
 * For default IDs we show translated name; for custom locations we show the API name.
 */

export const DEFAULT_LOCATION_IDS = new Set([
  'kitchen',
  'pantry',
  'refrigerator',
  'freezer',
  'bathroom',
  'bedroom',
  'living-room',
  'garage',
  'basement',
  'laundry-room',
  'storage',
  'other',
]);

export interface LocationLike {
  id: string;
  name: string;
}

/** Minimal type for i18n t() as used by this helper. */
export type LocationTranslateFn = (
  key: string,
  options?: { defaultValue?: string }
) => string;

/**
 * Returns the display name for a location: translated for default locations,
 * or the API name for custom locations.
 */
export function getLocationDisplayName(
  location: LocationLike,
  t: LocationTranslateFn
): string {
  if (DEFAULT_LOCATION_IDS.has(location.id)) {
    return t(`locations.${location.id}`, { defaultValue: location.name });
  }
  return location.name;
}

/**
 * Returns the display name when only id (and optionally name) is available.
 * Used by formatLocation and similar call sites.
 */
export function getLocationDisplayNameForId(
  id: string,
  name: string | undefined,
  t: LocationTranslateFn
): string {
  if (DEFAULT_LOCATION_IDS.has(id)) {
    return t(`locations.${id}`, { defaultValue: name ?? id });
  }
  return name ?? id;
}
