/**
 * Color manipulation utilities
 */

/**
 * Get a light/transparent version of a color for use as background
 * Adds transparency to hex colors by appending opacity value
 * @param color - Color string (hex format preferred)
 * @param opacity - Opacity value to append (default: '15' for ~8% opacity)
 * @returns Color string with opacity appended, or original color if not hex
 */
export const getLightColor = (color: string, opacity: string = '15'): string => {
  if (color.startsWith('#')) {
    return color + opacity;
  }
  return color;
};

