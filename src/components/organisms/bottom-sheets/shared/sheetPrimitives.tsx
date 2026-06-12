import React from 'react';
import styled from 'styled-components/native';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';

import type { StyledProps } from '../../../../utils/styledComponents';

// ---------------------------------------------------------------------------
// Shared styled primitives for full-screen form bottom sheets
// (extracted from CreateItemBottomSheet / EditItemBottomSheet /
// ItemFormBottomSheet — styles are copied verbatim).
// ---------------------------------------------------------------------------

export const Backdrop = styled(BottomSheetBackdrop)`
  background-color: rgba(0, 0, 0, 0.5);
`;

export const ContentContainer = styled.View`
  flex: 1;
  border-top-left-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  border-top-right-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  overflow: hidden;
`;

export const FooterContainer = styled.View<{
  bottomInset: number;
  showSafeArea: boolean;
}>`
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  padding-top: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-bottom: ${({
  bottomInset,
  showSafeArea,
  theme,
}: StyledProps & { bottomInset: number; showSafeArea: boolean }) =>
    showSafeArea ? bottomInset + theme.spacing.md : theme.spacing.md}px;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.03;
  shadow-radius: 4px;
  elevation: 2;
`;

export const SectionDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }: StyledProps) => theme.colors.border};
  margin-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

// ---------------------------------------------------------------------------
// Backdrop renderer
// ---------------------------------------------------------------------------

/**
 * The standard semi-opaque backdrop used by the item form sheets.
 *
 * Defined at module level, so it is referentially stable and can be passed
 * directly as `backdropComponent={renderStandardBackdrop}` (no `useCallback`
 * needed at call sites).
 */
export const renderStandardBackdrop = (
  props: BottomSheetBackdropProps,
): React.ReactElement => (
  <Backdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
);

// ---------------------------------------------------------------------------
// Standard BottomSheetModal props
// ---------------------------------------------------------------------------

/**
 * The `BottomSheetModal` props shared verbatim by CreateItemBottomSheet and
 * EditItemBottomSheet (full-screen, keyboard-aware form sheets).
 *
 * Spread first so call sites can still override individual props:
 * `<BottomSheetModal {...STANDARD_SHEET_PROPS} ... />`
 */
export const STANDARD_SHEET_PROPS: Pick<
  BottomSheetModalProps,
  | 'snapPoints'
  | 'keyboardBehavior'
  | 'keyboardBlurBehavior'
  | 'android_keyboardInputMode'
  | 'enablePanDownToClose'
  | 'enableContentPanningGesture'
  | 'enableHandlePanningGesture'
  | 'handleComponent'
  | 'enableDynamicSizing'
> = {
  snapPoints: ['100%'],
  keyboardBehavior: 'extend',
  keyboardBlurBehavior: 'restore',
  android_keyboardInputMode: 'adjustResize',
  enablePanDownToClose: true,
  enableContentPanningGesture: false,
  enableHandlePanningGesture: false,
  handleComponent: null,
  enableDynamicSizing: false,
};
