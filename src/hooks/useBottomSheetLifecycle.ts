import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

export interface UseBottomSheetLifecycleOptions {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  /** Getter (not a value) so the latest dirtiness is read at event time. */
  isFormDirty: () => boolean;
  /** Called when the user confirms discarding their changes. */
  resetForm: () => void;
  /**
   * Called whenever the sheet has actually closed (intentionally via
   * `handleClose`/discard, or via a clean pan-down with a pristine form).
   * NOT called while a nested modal is temporarily covering the sheet.
   */
  onClosed?: () => void;
  /**
   * Called when the sheet reaches a non-closed snap index (e.g. focus an
   * input when `index === 0`). Auto-focus behaviour belongs here.
   */
  onOpened?: (index: number) => void;
}

export interface UseBottomSheetLifecycleResult {
  /** Pass as `onChange` to the `BottomSheetModal`. */
  handleSheetChange: (index: number) => void;
  /**
   * Close the sheet, prompting a discard confirmation if the form is dirty.
   * May receive a press event when wired directly to `onPress`/`onClose`
   * props, hence the `unknown` parameter — only a literal `true` skips the
   * dirty check.
   */
  handleClose: (skipDirtyCheck?: unknown) => void;
  /**
   * Flag that a nested modal (picker, etc.) is opening on top of this sheet,
   * so a transient `index === -1` is not treated as a close.
   */
  setOpeningNestedModal: (isOpening: boolean) => void;
  /** Dismiss immediately with no dirty check (e.g. after a successful submit). */
  dismissIntentionally: () => void;
}

/**
 * Shared dirty-close-confirmation lifecycle for full-screen form bottom
 * sheets, extracted from CreateItemBottomSheet / EditItemBottomSheet.
 *
 * Flow (matching both item sheets):
 * - Pan-down / backdrop close with a dirty form snaps the sheet back to
 *   index 0 and shows a discard Alert; "Discard" resets the form and
 *   dismisses intentionally, "Keep editing" leaves the sheet open.
 * - `handleClose` shows the same Alert (without snapping back) unless the
 *   form is pristine or `skipDirtyCheck === true`.
 * - The intentional-close path always dismisses the keyboard and fires
 *   `onClosed` exactly once, from the final `onChange(-1)`.
 *
 * Known behavioural difference between the two source sheets, unified here:
 * EditItemBottomSheet additionally cleared its `initialData` state inside the
 * discard Alert's onPress (as well as in the close branches), while
 * CreateItemBottomSheet only notified `onSheetClose` from the close branches.
 * This hook fires `onClosed` once per close (from the intentional-close
 * branch after `dismiss()` settles), which is equivalent for both: Edit's
 * extra `setInitialData(null)` was an idempotent duplicate of the reset it
 * already performed on close.
 */
export const useBottomSheetLifecycle = ({
  bottomSheetRef,
  isFormDirty,
  resetForm,
  onClosed,
  onOpened,
}: UseBottomSheetLifecycleOptions): UseBottomSheetLifecycleResult => {
  const { t } = useTranslation();

  // --- Lifecycle refs ------------------------------------------------------

  const isShowingConfirmationRef = useRef(false);
  const isClosingIntentionallyRef = useRef(false);
  const isOpeningNestedModalRef = useRef(false);

  // Ref mirrors keep the returned callbacks referentially stable while always
  // reading the latest values.
  const isFormDirtyRef = useRef(isFormDirty);
  const resetFormRef = useRef(resetForm);
  const onClosedRef = useRef(onClosed);
  const onOpenedRef = useRef(onOpened);

  useEffect(() => {
    isFormDirtyRef.current = isFormDirty;
    resetFormRef.current = resetForm;
    onClosedRef.current = onClosed;
    onOpenedRef.current = onOpened;
  }, [isFormDirty, resetForm, onClosed, onOpened]);

  // --- Internal helpers ----------------------------------------------------

  /**
   * Shows the discard-changes Alert. `isShowingConfirmationRef` must be set
   * to `true` by the caller before invoking (matches the source sheets'
   * statement ordering around `snapToIndex`).
   */
  const showDiscardAlert = useCallback(() => {
    Alert.alert(
      t('common.confirmation'),
      t('common.discardChanges'),
      [
        {
          text: t('common.keepEditing'),
          style: 'cancel',
          onPress: () => {
            isShowingConfirmationRef.current = false;
          },
        },
        {
          text: t('common.discard'),
          style: 'destructive',
          onPress: () => {
            isShowingConfirmationRef.current = false;
            Keyboard.dismiss();
            resetFormRef.current();
            isClosingIntentionallyRef.current = true;
            bottomSheetRef.current?.dismiss();
          },
        },
      ],
      { cancelable: true }
    );
  }, [bottomSheetRef, t]);

  // --- Returned handlers ---------------------------------------------------

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        if (isClosingIntentionallyRef.current) {
          isClosingIntentionallyRef.current = false;
          Keyboard.dismiss();
          onClosedRef.current?.();
          return;
        }

        if (isOpeningNestedModalRef.current) {
          return;
        }

        if (isFormDirtyRef.current() && !isShowingConfirmationRef.current) {
          isShowingConfirmationRef.current = true;
          bottomSheetRef.current?.snapToIndex(0);
          showDiscardAlert();
          return;
        }

        Keyboard.dismiss();
        onClosedRef.current?.();
        return;
      }

      onOpenedRef.current?.(index);
    },
    [bottomSheetRef, showDiscardAlert]
  );

  const dismissIntentionally = useCallback(() => {
    Keyboard.dismiss();
    isClosingIntentionallyRef.current = true;
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef]);

  const handleClose = useCallback(
    (skipDirtyCheck?: unknown) => {
      const shouldSkipCheck =
        typeof skipDirtyCheck === 'boolean' ? skipDirtyCheck : false;

      if (
        !shouldSkipCheck &&
        isFormDirtyRef.current() &&
        !isShowingConfirmationRef.current
      ) {
        isShowingConfirmationRef.current = true;
        showDiscardAlert();
        return;
      }

      dismissIntentionally();
    },
    [dismissIntentionally, showDiscardAlert]
  );

  const setOpeningNestedModal = useCallback((isOpening: boolean) => {
    isOpeningNestedModalRef.current = isOpening;
  }, []);

  return {
    handleSheetChange,
    handleClose,
    setOpeningNestedModal,
    dismissIntentionally,
  };
};
