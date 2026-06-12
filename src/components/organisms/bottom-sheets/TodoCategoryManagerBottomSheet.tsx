import React, { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import styled from 'styled-components/native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import type { StyledProps } from '../../../utils/styledComponents';
import type { TodoCategory } from '../../../types/inventory';
import { getTodoCategoryDisplayName } from '../../../utils/todoCategoryI18n';
import { useTodoCategories } from '../../../store/hooks';
import { useKeyboardVisibility } from '../../../hooks';
import { BottomSheetHeader, FormSection, UncontrolledInput } from '../../atoms';
import { CategoryPreviewCard, BottomActionBar } from '../../molecules';
import { Backdrop } from './shared/sheetPrimitives';

const ContentContainer = styled.View`
  flex: 1;
  position: relative;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const EmptyState = styled.View`
  align-items: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const EmptyStateText = styled.Text`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  text-align: center;
`;

export interface TodoCategoryManagerBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
}

type FormMode = 'list' | 'create' | 'edit';

/**
 * TodoCategoryManagerBottomSheet - Manage todo (shopping) categories.
 * List/create/rename/delete; writes flow through the todo saga (fire-and-forget),
 * the live todoCategories snapshot updates the list.
 */
export const TodoCategoryManagerBottomSheet: React.FC<
  TodoCategoryManagerBottomSheetProps
> = ({ bottomSheetRef }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { categories, createCategory, updateCategory, deleteCategory } =
    useTodoCategories();
  const { isKeyboardVisible, dismissKeyboard } = useKeyboardVisibility();

  const [mode, setMode] = useState<FormMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const snapPoints = useMemo(() => ['100%'], []);

  const handleClose = useCallback(() => {
    dismissKeyboard();
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef, dismissKeyboard]);

  const resetForm = useCallback(() => {
    setName('');
    setEditingId(null);
    setMode('list');
  }, []);

  const handleStartCreate = useCallback(() => {
    setName('');
    setEditingId(null);
    setMode('create');
  }, []);

  const handleStartEdit = useCallback((category: TodoCategory) => {
    setName(category.name);
    setEditingId(category.id);
    setMode('edit');
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('common.error'), t('todoCategories.errors.enterName'));
      return;
    }
    if (editingId) {
      updateCategory(editingId, trimmed);
    } else {
      createCategory(trimmed);
    }
    resetForm();
  }, [name, editingId, updateCategory, createCategory, resetForm, t]);

  const handleDelete = useCallback(
    (categoryId: string) => {
      Alert.alert(
        t('todoCategories.delete.title'),
        t('todoCategories.delete.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => deleteCategory(categoryId),
          },
        ],
        { cancelable: true }
      );
    },
    [deleteCategory, t]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <Backdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  );

  const headerTitle =
    mode === 'edit'
      ? t('todoCategories.editTitle')
      : mode === 'create'
        ? t('todoCategories.createTitle')
        : t('todoCategories.title');

  const renderFooter = useCallback(() => {
    if (mode === 'create' || mode === 'edit') {
      return (
        <BottomActionBar
          actions={[
            {
              label: t('common.cancel'),
              onPress: resetForm,
              variant: 'outlined',
            },
            {
              label: t('common.save'),
              onPress: handleSave,
              variant: 'filled',
              iconName: 'checkmark',
            },
          ]}
          safeArea={!isKeyboardVisible}
          inBottomSheet
        />
      );
    }
    return (
      <BottomActionBar
        actions={[
          {
            label: t('todoCategories.createTitle'),
            onPress: handleStartCreate,
            variant: 'filled',
            iconName: 'add',
          },
        ]}
        safeArea={!isKeyboardVisible}
        inBottomSheet
      />
    );
  }, [mode, resetForm, handleSave, handleStartCreate, t, isKeyboardVisible]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      enablePanDownToClose
      enableContentPanningGesture={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableHandlePanningGesture={false}
      topInset={insets.top}
      index={0}
      footerComponent={renderFooter}
      enableDynamicSizing={false}
    >
      <ContentContainer>
        <BottomSheetHeader
          title={headerTitle}
          subtitle={t('todoCategories.subtitle')}
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
          {mode === 'list' ? (
            <FormSection label={t('todoCategories.listLabel')}>
              {categories.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>
                    {t('todoCategories.emptyState')}
                  </EmptyStateText>
                </EmptyState>
              ) : (
                <View>
                  {categories.map((category) => (
                    <CategoryPreviewCard
                      key={category.id}
                      category={category}
                      displayName={getTodoCategoryDisplayName(category, t)}
                      onEdit={handleStartEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              )}
            </FormSection>
          ) : (
            <FormSection label={t('todoCategories.nameLabel')}>
              <UncontrolledInput
                key={editingId ?? 'create'}
                defaultValue={name}
                onChangeText={setName}
                onBlur={() => {}}
                placeholder={t('todoCategories.placeholder')}
                placeholderTextColor={theme.colors.textLight}
                autoFocus
              />
            </FormSection>
          )}
        </BottomSheetScrollView>
      </ContentContainer>
    </BottomSheetModal>
  );
};
