import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from 'react-redux';

import type { InventoryItem, ItemBatch } from '../../../types/inventory';
import type { StyledProps } from '../../../utils/styledComponents';
import { useTheme } from '../../../theme/ThemeProvider';
import { useKeyboardVisibility } from '../../../hooks/useKeyboardVisibility';
import { useBatchForm } from '../../../hooks/useBatchForm';
import { useBottomSheetLifecycle } from '../../../hooks/useBottomSheetLifecycle';
import { useAppDispatch } from '../../../store/hooks';
import type { RootState } from '../../../store';
import {
  BottomSheetHeader,
  GlassButton,
  FormSection,
  UncontrolledInput,
} from '../../atoms';
import { BatchDetailsFormSection, DatePicker } from '../../molecules';
import { uiLogger } from '../../../utils/Logger';
import { generateItemId } from '../../../utils/idGenerator';
import { updateItemAction } from '../../../store/sagas/inventorySaga';
import {
  ContentContainer,
  FooterContainer,
  renderStandardBackdrop,
  STANDARD_SHEET_PROPS,
} from './shared/sheetPrimitives';

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const FormContainer = styled.View`
  flex-direction: column;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Both source batch sheets used 90% (vs the 100% standard item sheets). */
const SNAP_POINTS = ['90%'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchFormMode = 'add' | 'edit';

interface BatchFormBottomSheetBaseProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
}

export interface BatchFormBottomSheetAddProps extends BatchFormBottomSheetBaseProps {
  mode: 'add';
  /** The item the new batch is appended to. */
  item: InventoryItem;
  onBatchAdded?: () => void;
  onSheetClose?: () => void;
}

export interface BatchFormBottomSheetEditProps extends BatchFormBottomSheetBaseProps {
  mode: 'edit';
  onBatchUpdated?: () => void;
}

export type BatchFormBottomSheetProps =
  | BatchFormBottomSheetAddProps
  | BatchFormBottomSheetEditProps;

export interface BatchFormBottomSheetRef {
  /** Edit mode: look up the batch in the store, populate the form, present. */
  present: (itemId: string, batchId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Unified bottom sheet for adding ('add' mode) and editing ('edit' mode) an
 * inventory item batch.
 *
 * Add mode: takes the target `item` as a prop and appends a new batch
 * (generated id + createdAt) via the inventory update dispatch.
 *
 * Edit mode: presented imperatively via `ref.present(itemId, batchId)`; looks
 * the batch up in the store, populates the form, and replaces the batch in
 * place on submit (preserving its id/createdAt).
 */
export const BatchFormBottomSheet = forwardRef<
  BatchFormBottomSheetRef,
  BatchFormBottomSheetProps
>((props, ref) => {
  const { mode, bottomSheetRef } = props;
  const addItem = props.mode === 'add' ? props.item : undefined;
  const onBatchAdded = props.mode === 'add' ? props.onBatchAdded : undefined;
  const onSheetClose = props.mode === 'add' ? props.onSheetClose : undefined;
  const onBatchUpdated =
    props.mode === 'edit' ? props.onBatchUpdated : undefined;

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const store = useStore();
  const { isKeyboardVisible } = useKeyboardVisibility();

  // --- Edit mode: batch being edited ---------------------------------------

  const currentItemIdRef = useRef<string | null>(null);
  const currentBatchIdRef = useRef<string | null>(null);
  // Item name shown in the header subtitle (edit mode)
  const [currentItemName, setCurrentItemName] = useState<string>('');
  // State for initial data (triggers form population in hook's useEffect)
  const [initialData, setInitialData] = useState<ItemBatch | null>(null);

  // --- Form hook ------------------------------------------------------------

  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormValidChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const {
    priceInputRef,
    amountInputRef,
    unitInputRef,
    vendorInputRef,
    noteInputRef,
    defaultPrice,
    defaultAmount,
    defaultUnit,
    defaultVendor,
    defaultNote,
    expiryDate,
    formKey,
    setExpiryDate,
    getFormValues,
    isFormDirty,
    resetForm,
    handlePriceChange,
    handlePriceBlur,
    handleAmountChange,
    handleAmountBlur,
    handleUnitChange,
    handleUnitBlur,
    handleVendorChange,
    handleVendorBlur,
    handleNoteChange,
    handleNoteBlur,
  } = useBatchForm({
    mode,
    initialData: mode === 'edit' ? initialData : null,
    onFormValidChange: handleFormValidChange,
  });

  // --- Sheet lifecycle (dirty-close confirmation) ---------------------------

  const handleClosed = useCallback(() => {
    if (mode === 'add') {
      onSheetClose?.();
    } else {
      // Reset initial data when sheet closes to avoid stale data next time
      setInitialData(null);
    }
  }, [mode, onSheetClose]);

  const { handleSheetChange, handleClose } = useBottomSheetLifecycle({
    bottomSheetRef,
    isFormDirty,
    resetForm,
    onClosed: handleClosed,
  });

  // --- Submit ---------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const formValues = getFormValues();
    uiLogger.info('BatchFormBottomSheet handleSubmit', formValues);

    let targetItem: InventoryItem | undefined;
    let batchId: string | null = null;

    if (mode === 'add') {
      targetItem = addItem;
      if (!targetItem) {
        uiLogger.error('No item provided for add');
        return;
      }
    } else {
      const itemId = currentItemIdRef.current;
      batchId = currentBatchIdRef.current;
      if (!itemId || !batchId) {
        uiLogger.error('No itemId or batchId found for update');
        return;
      }

      const state = store.getState() as RootState;
      targetItem = state.inventory.items.find((i) => i.id === itemId);
      if (!targetItem || !targetItem.batches) {
        uiLogger.error('Item or batches not found for update');
        return;
      }
    }

    setIsLoading(true);
    try {
      const parsedAmount = parseInt(formValues.amount || '1', 10);
      const parsedPrice = parseFloat(formValues.price);

      const batchFields = {
        amount: isNaN(parsedAmount) || parsedAmount < 1 ? 1 : parsedAmount,
        price: isNaN(parsedPrice) ? undefined : parsedPrice,
        unit: formValues.unit.trim() || undefined,
        vendor: formValues.vendor.trim() || undefined,
        expiryDate: formValues.expiryDate?.toISOString(),
        note: formValues.note.trim() || undefined,
      };

      let updatedBatches: ItemBatch[];
      if (mode === 'add') {
        const newBatch: ItemBatch = {
          id: generateItemId(),
          ...batchFields,
          createdAt: new Date().toISOString(),
        };
        updatedBatches = [...(targetItem.batches || []), newBatch];
      } else {
        updatedBatches = (targetItem.batches || []).map((batch) =>
          batch.id === batchId ? { ...batch, ...batchFields } : batch
        );
      }

      dispatch(updateItemAction(targetItem.id, { batches: updatedBatches }));

      handleClose(true);
      resetForm();
      if (mode === 'add') {
        onBatchAdded?.();
      } else {
        onBatchUpdated?.();
      }
    } catch (error) {
      uiLogger.error(
        mode === 'add' ? 'Error adding batch' : 'Error updating batch',
        error
      );
      Alert.alert(t('common.error'), t('itemDetails.error.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [
    mode,
    addItem,
    getFormValues,
    dispatch,
    handleClose,
    resetForm,
    onBatchAdded,
    onBatchUpdated,
    t,
    store,
  ]);

  // --- Expose present method (edit mode) -------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      present: (itemId: string, batchId: string) => {
        uiLogger.info('present called with batchId', batchId);
        const state = store.getState() as RootState;
        const items = state.inventory.items;

        const item = items.find((i) => i.id === itemId);
        if (!item) {
          uiLogger.info('Item not found!');
          return;
        }

        const batch = (item.batches || []).find((b) => b.id === batchId);
        if (!batch) {
          uiLogger.info('Batch not found!');
          return;
        }

        currentItemIdRef.current = itemId;
        currentBatchIdRef.current = batchId;
        setCurrentItemName(item.name);
        setInitialData(batch);

        setTimeout(() => {
          bottomSheetRef.current?.present();
        }, 0);
      },
    }),
    [store, bottomSheetRef]
  );

  // --- Render helpers ---------------------------------------------------------

  const renderFooter = useCallback(
    () => (
      <FooterContainer
        bottomInset={insets.bottom}
        showSafeArea={!isKeyboardVisible}
      >
        <GlassButton
          text={isLoading ? t('common.saving') : t('common.save')}
          onPress={handleSubmit}
          icon="checkmark"
          loading={isLoading}
          tintColor={theme.colors.primary}
          textColor={theme.colors.surface}
          disabled={!isFormValid || isLoading}
          style={{ width: '100%' }}
        />
      </FooterContainer>
    ),
    [
      handleSubmit,
      isLoading,
      isFormValid,
      isKeyboardVisible,
      insets.bottom,
      t,
      theme,
    ]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      {...STANDARD_SHEET_PROPS}
      snapPoints={SNAP_POINTS}
      backdropComponent={renderStandardBackdrop}
      topInset={insets.top}
      index={0}
      footerComponent={renderFooter}
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
    >
      <ContentContainer>
        <BottomSheetHeader
          title={t(
            mode === 'add'
              ? 'itemDetails.batch.addBatch'
              : 'itemDetails.batch.editBatch'
          )}
          subtitle={mode === 'add' ? (addItem?.name ?? '') : currentItemName}
          onClose={handleClose}
        />
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormContainer key={formKey}>
            <BatchDetailsFormSection
              defaultPrice={defaultPrice}
              defaultAmount={defaultAmount}
              defaultUnit={defaultUnit}
              defaultVendor={defaultVendor}
              priceInputRef={priceInputRef}
              amountInputRef={amountInputRef}
              unitInputRef={unitInputRef}
              vendorInputRef={vendorInputRef}
              onPriceChange={handlePriceChange}
              onAmountChange={handleAmountChange}
              onUnitChange={handleUnitChange}
              onVendorChange={handleVendorChange}
              onPriceBlur={handlePriceBlur}
              onAmountBlur={handleAmountBlur}
              onUnitBlur={handleUnitBlur}
              onVendorBlur={handleVendorBlur}
            />

            <FormSection label={t('createItem.fields.expiryDate')}>
              <DatePicker
                value={expiryDate}
                onChange={setExpiryDate}
                minimumDate={mode === 'add' ? new Date() : undefined}
              />
            </FormSection>

            <FormSection label={t('createItem.fields.note')}>
              <UncontrolledInput
                ref={noteInputRef}
                defaultValue={defaultNote}
                onChangeText={handleNoteChange}
                onBlur={handleNoteBlur}
                placeholder={t('createItem.placeholders.note')}
                placeholderTextColor={theme.colors.textLight}
                multiline
              />
            </FormSection>
          </FormContainer>
        </BottomSheetScrollView>
      </ContentContainer>
    </BottomSheetModal>
  );
});

BatchFormBottomSheet.displayName = 'BatchFormBottomSheet';
