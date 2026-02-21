import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, TextInput } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { useInventoryCategories } from '../../store/hooks';
import { BottomSheetHeader, GlassButton, FormSection, UncontrolledInput } from '../atoms';
import { StyledProps } from '../../utils/styledComponents';
import { useKeyboardVisibility } from '../../hooks/useKeyboardVisibility';
import { uiLogger } from '../../utils/Logger';
import { ColorPalette } from '../molecules/ColorPalette';
import { categoryColors } from '../../data/categoryColors';

const ContentContainer = styled.View`
  flex: 1;
  border-top-left-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  border-top-right-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  overflow: hidden;
`;

const FormContainer = styled.View`
  flex-direction: column;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const ErrorBanner = styled.View`
  background-color: ${({ theme }: StyledProps) => theme.colors.error};
  padding: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  margin-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.sm}px;
`;

const ErrorText = styled.Text`
  color: ${({ theme }: StyledProps) => theme.colors.surface};
  font-size: 12px;
`;

const FooterContainer = styled.View<{
    bottomInset: number;
    showSafeArea: boolean;
}>`
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  padding-top: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-bottom: ${({ bottomInset, showSafeArea, theme }: StyledProps & { bottomInset: number; showSafeArea: boolean }) =>
        showSafeArea ? bottomInset + theme.spacing.md : theme.spacing.md}px;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.03;
  shadow-radius: 4px;
  elevation: 2;
`;

export interface CreateCategoryBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    onCategoryCreated?: (categoryId: string) => void;
    onClose?: () => void;
}

export const CreateCategoryBottomSheet: React.FC<CreateCategoryBottomSheetProps> = ({
    bottomSheetRef,
    onCategoryCreated,
    onClose,
}) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const { createCategory, loading: creatingCategory, error: categoriesError } = useInventoryCategories();
    const { isKeyboardVisible } = useKeyboardVisibility();

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);

    const nameInputRef = useRef<TextInput>(null);

    // Initialize with random color
    useEffect(() => {
        const randomColor = categoryColors[Math.floor(Math.random() * categoryColors.length)];
        setSelectedColor(randomColor);
    }, []);

    const handleClose = useCallback(() => {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();

        // Reset state on close
        setTimeout(() => {
            setName('');
            setSelectedColor(categoryColors[Math.floor(Math.random() * categoryColors.length)]);
            setLocalError(null);
            nameInputRef.current?.clear();
        }, 300);
    }, [bottomSheetRef]);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    const displayError = localError || categoriesError;

    const renderFooter = useCallback(() => {
        const handleSubmit = async () => {
            const trimmedName = name.trim();
            if (!trimmedName) {
                setLocalError(t('categories.create.errors.enterName'));
                return;
            }

            setLocalError(null);

            try {
                createCategory(trimmedName, undefined, selectedColor, 'folder-outline');

                handleClose();

                // Pass a temp ID since the creation is async without a direct return
                onCategoryCreated?.('temp-id');
            } catch (error) {
                uiLogger.error('Failed to create category', error);
                setLocalError(t('categories.create.errors.createFailed'));
            }
        };

        return (
            <FooterContainer bottomInset={insets.bottom} showSafeArea={!isKeyboardVisible}>
                {displayError && (
                    <ErrorBanner style={{ marginBottom: 8 }}>
                        <ErrorText>{displayError}</ErrorText>
                    </ErrorBanner>
                )}
                <GlassButton
                    text={t('categories.create.submit')}
                    onPress={handleSubmit}
                    tintColor={theme.colors.primary}
                    textColor={theme.colors.surface}
                    disabled={!name.trim() || creatingCategory}
                    loading={creatingCategory}
                    icon="checkmark"
                    style={{ width: '100%' }}
                />
            </FooterContainer>
        );
    }, [
        insets.bottom,
        isKeyboardVisible,
        name,
        selectedColor,
        creatingCategory,
        displayError,
        createCategory,
        handleClose,
        onCategoryCreated,
        t,
        theme,
    ]);

    // Height considerations for the footer
    const footerHeight = 82 + (isKeyboardVisible ? 0 : insets.bottom);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            enableDynamicSizing={true}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={true}
            handleComponent={null}
            android_keyboardInputMode="adjustResize"
            backgroundStyle={{ backgroundColor: theme.colors.background }}
            topInset={insets.top}
            stackBehavior="push"
            index={0}
            footerComponent={renderFooter}
            onChange={(index) => {
                if (index === -1) {
                    Keyboard.dismiss();
                    setName('');
                    setSelectedColor(categoryColors[Math.floor(Math.random() * categoryColors.length)]);
                    setLocalError(null);
                    nameInputRef.current?.clear();
                    onClose?.();
                }
            }}
        >
            <ContentContainer>
                <BottomSheetView style={{ paddingBottom: footerHeight }}>
                    <BottomSheetHeader
                        title={t('categories.create.title')}
                        subtitle={t('categories.create.subtitle')}
                        onClose={handleClose}
                    />
                    <FormContainer>
                        <FormSection label={t('categories.create.nameLabel')}>
                            <UncontrolledInput
                                ref={nameInputRef}
                                defaultValue={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (localError) setLocalError(null);
                                }}
                                onBlur={() => { }}
                                placeholder={t('categories.create.namePlaceholder')}
                                placeholderTextColor={theme.colors.textLight}
                                editable={!creatingCategory}
                                autoFocus
                            />
                        </FormSection>

                        <FormSection label={""}>
                            <ColorPalette
                                selectedColor={selectedColor}
                                onColorSelect={setSelectedColor}
                                showLabel={true}
                                edgeToEdge={true}
                            />
                        </FormSection>
                    </FormContainer>
                </BottomSheetView>
            </ContentContainer>
        </BottomSheetModal>
    );
};
