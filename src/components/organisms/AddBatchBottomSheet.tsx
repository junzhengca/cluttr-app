import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard, Alert } from 'react-native';
import styled from 'styled-components/native';
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { InventoryItem, ItemBatch } from '../../types/inventory';
import type { StyledProps } from '../../utils/styledComponents';
import { useTheme } from '../../theme/ThemeProvider';
import { useKeyboardVisibility } from '../../hooks/useKeyboardVisibility';
import { useAddBatchForm } from '../../hooks/useAddBatchForm';
import { useAppDispatch } from '../../store/hooks';
import { BottomSheetHeader, Button, FormSection, UncontrolledInput } from '../atoms';
import { BatchDetailsFormSection, DatePicker } from '../molecules';
import { uiLogger } from '../../utils/Logger';
import { generateItemId } from '../../utils/idGenerator';
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
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
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

export interface AddBatchBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    item: InventoryItem;
    onBatchAdded?: () => void;
    onSheetClose?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AddBatchBottomSheet: React.FC<AddBatchBottomSheetProps> = ({
    bottomSheetRef,
    item,
    onBatchAdded,
    onSheetClose,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { isKeyboardVisible } = useKeyboardVisibility();

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
    } = useAddBatchForm({
        onFormValidChange: handleFormValidChange,
    });

    // --- Refs for sheet behaviour ------------------------------------------

    const isShowingConfirmationRef = useRef(false);
    const isClosingIntentionallyRef = useRef(false);
    const isFormDirtyRef = useRef(isFormDirty);

    // Update ref when isFormDirty check function changes (rarely)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    useMemo(() => {
        isFormDirtyRef.current = isFormDirty;
    }, [isFormDirty]);

    // --- Sheet handlers ----------------------------------------------------

    const handleSheetChange = useCallback(
        (index: number) => {
            if (index === -1) {
                if (isClosingIntentionallyRef.current) {
                    isClosingIntentionallyRef.current = false;
                    Keyboard.dismiss();
                    onSheetClose?.();
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
                                },
                            },
                        ],
                        { cancelable: true },
                    );
                    return;
                }

                Keyboard.dismiss();
                onSheetClose?.();
                return;
            }
        },
        [onSheetClose, resetForm, bottomSheetRef, t],
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
        uiLogger.info('AddBatchBottomSheet handleSubmit', formValues);

        setIsLoading(true);
        try {
            const now = new Date().toISOString();

            const parsedAmount = parseInt(formValues.amount || '1', 10);
            const parsedPrice = parseFloat(formValues.price);

            const newBatch: ItemBatch = {
                id: generateItemId(),
                amount: isNaN(parsedAmount) || parsedAmount < 1 ? 1 : parsedAmount,
                price: isNaN(parsedPrice) ? undefined : parsedPrice,
                unit: formValues.unit.trim() || undefined,
                vendor: formValues.vendor.trim() || undefined,
                expiryDate: formValues.expiryDate?.toISOString(),
                note: formValues.note.trim() || undefined,
                createdAt: now,
            };

            const updatedBatches = [...(item.batches || []), newBatch];

            dispatch(updateItemAction(item.id, { batches: updatedBatches }));

            handleClose(true);
            resetForm();
            onBatchAdded?.();
        } catch (error) {
            uiLogger.error('Error adding batch', error);
            Alert.alert(
                t('common.error'),
                t('itemDetails.error.updateFailed'),
            );
        } finally {
            setIsLoading(false);
        }
    }, [getFormValues, dispatch, handleClose, resetForm, onBatchAdded, t, item]);

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
                <Button
                    label={t('common.save')}
                    onPress={handleSubmit}
                    variant="primary"
                    icon="checkmark"
                    disabled={!isFormValid || isLoading}
                />
            </FooterContainer>
        ),
        [handleSubmit, isLoading, isFormValid, isKeyboardVisible, insets.bottom, t],
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
            backgroundStyle={{ backgroundColor: theme.colors.surface }}
        >
            <ContentContainer>
                <BottomSheetHeader
                    title={t('itemDetails.batch.addBatch')}
                    subtitle={item.name}
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
                                minimumDate={new Date()}
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
};
