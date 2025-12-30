/**
 * Layout calculation utilities
 */

/**
 * Calculate bottom padding for scrollable content
 * Accounts for navigation bar, margins, safe area insets, and extra spacing
 * @param bottomInset - Safe area bottom inset
 * @param navBarHeight - Navigation bar height (default: 60)
 * @param margin - Vertical margin (default: 32, which is 16*2)
 * @param extraSpacing - Extra spacing to add (default: 24)
 * @returns Total bottom padding value
 */
export const calculateBottomPadding = (
  bottomInset: number,
  navBarHeight: number = 60,
  margin: number = 32,
  extraSpacing: number = 24
): number => {
  return navBarHeight + margin + bottomInset + extraSpacing;
};

/**
 * Calculate bottom padding for bottom action bar
 * Accounts for button height, padding, safe area insets, and extra spacing
 * @param bottomInset - Safe area bottom inset
 * @param buttonHeight - Button height (default: 50)
 * @param topPadding - Top padding (default: 24)
 * @param bottomPadding - Bottom padding (default: 16)
 * @param extraSpacing - Extra spacing to add (default: 16)
 * @returns Total bottom padding value
 */
export const calculateBottomActionBarPadding = (
  bottomInset: number,
  buttonHeight: number = 50,
  topPadding: number = 24,
  bottomPadding: number = 16,
  extraSpacing: number = 16
): number => {
  return buttonHeight + topPadding + bottomPadding + bottomInset + extraSpacing;
};

