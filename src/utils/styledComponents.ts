import type { Theme } from '../theme/types';

/**
 * Helper type for styled component props that include theme
 * Usage: ${({ theme }: StyledProps) => theme.colors.background}
 */
export type StyledProps = { theme: Theme };

/**
 * Helper type for styled component props with custom props and theme
 * Usage: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) => ...}
 */
export type StyledPropsWith<T> = { theme: Theme } & T;

