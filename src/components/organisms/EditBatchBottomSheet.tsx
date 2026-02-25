import React, { useCallback, useMemo, useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Keyboard, Alert } from 'react-native';
import styled from 'styled-components/native';
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from 'react-redux';

import type { ItemBatch } from '../../types/inventory';
import type { StyledProps } from '../../utils/styledComponents';
import { useTheme } from '../../theme/ThemeProvider';
import { useKeyboardVisibility } from '../../hooks/useKeyboardVisibility';
import { useEditBatchForm } from '../../hooks/useEditBatchForm';
import { useAppDispatch } from '../../store/hooks';
import type { RootState } from '../../store';
import { BottomSheetHeader, GlassButton, FormSection, UncontrolledInput } from '../atoms';
import { BatchDetailsFormSection, DatePicker } from '../molecules';
import { uiLogger } from '../../utils/Logger';
import { updateItemAction } from '../../store/sagas/inventorySaga';

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Backdrop = styled(BottomSheetBackdrop)`
  background-color: rgba(0, 0, 0, 0.5);
`;

const ContentContainer = styled.View`
  flex: 1;
  border-top-left-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  border-top-right-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  overflow: hidden;
`;

const FormContainer = styled.View`
  flex-direction: column;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const FooterContainer = styled.View<{
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EditBatchBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    onBatchUpdated?: () => void;
}

export interface EditBatchBottomSheetRef {
    present: (itemId: string, batchId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EditBatchBottomSheet = forwardRef<
    EditBatchBottomSheetRef,
    EditBatchBottomSheetProps
>(({ bottomSheetRef, onBatchUpdated }, ref) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const store = useStore();
    const { isKeyboardVisible } = useKeyboardVisibility();

    // Track which item and batch ID are currently being edited
    const currentItemIdRef = useRef<string | null>(null);
    const currentBatchIdRef = useRef<string | null>(null);

    // Track the item to pass context to the header if needed
    const [currentItemName, setCurrentItemName] = useState<string>('');

    // State for initial data
    const [initialData, setInitialData] = useState<ItemBatch | null>(null);

    // --- Form hook ---------------------------------------------------------

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
    } = useEditBatchForm({
        initialData,
        onFormValidChange: handleFormValidChange,
    });

    // --- Refs for sheet behaviour ------------------------------------------

    const isShowingConfirmationRef = useRef(false);
    const isClosingIntentionallyRef = useRef(false);
    const isFormDirtyRef = useRef(isFormDirty);

    useEffect(() => {
        isFormDirtyRef.current = isFormDirty;
    }, [isFormDirty]);

    // --- Sheet handlers ----------------------------------------------------

    const handleSheetChange = useCallback(
        (index: number) => {
            if (index === -1) {
                if (isClosingIntentionallyRef.current) {
                    isClosingIntentionallyRef.current = false;
                    Keyboard.dismiss();
                    setInitialData(null);
                    return;
                }

                if (isFormDirtyRef.current() && !isShowingConfirmationRef.current) {
                    isShowingConfirmationRef.current = true;
                    bottomSheetRef.current?.snapToIndex(0);

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
                                    resetForm();
                                    isClosingIntentionallyRef.current = true;
                                    bottomSheetRef.current?.dismiss();
                                    setInitialData(null);
                                },
                            },
                        ],
                        { cancelable: true },
                    );
                    return;
                }

                Keyboard.dismiss();
                setInitialData(null);
                return;
            }
        },
        [resetForm, bottomSheetRef, t],
    );

    const handleClose = useCallback(
        (skipDirtyCheck?: boolean | Event) => {
            const shouldSkipCheck =
                typeof skipDirtyCheck === 'boolean' ? skipDirtyCheck : false;

            if (
                !shouldSkipCheck &&
                isFormDirtyRef.current() &&
                !isShowingConfirmationRef.current
            ) {
                isShowingConfirmationRef.current = true;
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
                                resetForm();
                                isClosingIntentionallyRef.current = true;
                                bottomSheetRef.current?.dismiss();
                            },
                        },
                    ],
                    { cancelable: true },
                );
                return;
            }

            Keyboard.dismiss();
            isClosingIntentionallyRef.current = true;
            bottomSheetRef.current?.dismiss();
        },
        [resetForm, bottomSheetRef, t],
    );

    // --- Submit ------------------------------------------------------------

    const handleSubmit = useCallback(async () => {
        const formValues = getFormValues();
        uiLogger.info('EditBatchBottomSheet handleSubmit', formValues);

        const itemId = currentItemIdRef.current;
        const batchId = currentBatchIdRef.current;
        if (!itemId || !batchId) {
            uiLogger.error('No itemId or batchId found for update');
            return;
        }

        const state = store.getState() as RootState;
        const item = state.inventory.items.find(i => i.id === itemId);
        if (!item || !item.batches) {
            uiLogger.error('Item or batches not found for update');
            return;
        }

        setIsLoading(true);
        try {
            const parsedAmount = parseInt(formValues.amount || '1', 10);
            const parsedPrice = parseFloat(formValues.price);

            const updatedBatches = item.batches.map(batch => {
                if (batch.id === batchId) {
                    return {
                        ...batch,
                        amount: isNaN(parsedAmount) || parsedAmount < 1 ? 1 : parsedAmount,
                        price: isNaN(parsedPrice) ? undefined : parsedPrice,
                        unit: formValues.unit.trim() || undefined,
                        vendor: formValues.vendor.trim() || undefined,
                        expiryDate: formValues.expiryDate?.toISOString(),
                        note: formValues.note.trim() || undefined,
                    };
                }
                return batch;
            });

            dispatch(updateItemAction(item.id, { batches: updatedBatches }));

            handleClose(true);
            resetForm();
            onBatchUpdated?.();
        } catch (error) {
            uiLogger.error('Error updating batch', error);
            Alert.alert(
                t('common.error'),
                t('itemDetails.error.updateFailed'),
            );
        } finally {
            setIsLoading(false);
        }
    }, [getFormValues, dispatch, handleClose, resetForm, onBatchUpdated, t, store]);

    // --- Expose present method ---------------------------------------------

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

                const batch = (item.batches || []).find(b => b.id === batchId);
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

    // --- Bottom sheet config ------------------------------------

    const snapPoints = useMemo(() => ['90%'], []);
    const keyboardBehavior = useMemo(() => 'extend' as const, []);
    const keyboardBlurBehavior = useMemo(() => 'restore' as const, []);

    const renderBackdrop = useCallback(
        (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
            <Backdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        ),
        [],
    );

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
        [handleSubmit, isLoading, isFormValid, isKeyboardVisible, insets.bottom, t, theme],
    );

    // --- Render ------------------------------------------------------------

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            enableContentPanningGesture={false}
            keyboardBehavior={keyboardBehavior}
            keyboardBlurBehavior={keyboardBlurBehavior}
            android_keyboardInputMode="adjustResize"
            enableHandlePanningGesture={false}
            handleComponent={null}
            topInset={insets.top}
            index={0}
            footerComponent={renderFooter}
            enableDynamicSizing={false}
            onChange={handleSheetChange}
            backgroundStyle={{ backgroundColor: theme.colors.background }}
        >
            <ContentContainer>
                <BottomSheetHeader
                    title={t('itemDetails.batch.editBatch')}
                    subtitle={currentItemName}
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
                    enableOnPanDownToDismiss={false}
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
                                minimumDate={undefined}
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

EditBatchBottomSheet.displayName = 'EditBatchBottomSheet';
