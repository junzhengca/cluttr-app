import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TouchableOpacity, Alert, View, Text } from 'react-native';
import styled from 'styled-components/native';
// Note: View and Text are imported above and will be used in styled components
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import type { StyledProps } from '../utils/styledComponents';
import { Category } from '../types/inventory';
import { getAllCategories, createCategory, updateCategory, deleteCategory, isCategoryInUse } from '../services/CategoryService';
import { IconSelector } from './IconSelector';
import { ColorPalette } from './ColorPalette';
import { categoryIcons } from '../data/categoryIcons';
import { categoryColors } from '../data/categoryColors';

const Backdrop = styled(BottomSheetBackdrop)`
  background-color: rgba(0, 0, 0, 0.5);
`;

const Header = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const HeaderLeft = styled(View)`
  flex: 1;
`;

const Title = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.xxl}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const Subtitle = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

const CloseButton = styled(TouchableOpacity)`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

const FormSection = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const Label = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const Input = styled(BottomSheetTextInput)`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

const CategoriesList = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const CategoryItem = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const CategoryIcon = styled(View)`
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const CategoryInfo = styled(View)`
  flex: 1;
`;

const CategoryName = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

const CategoryActions = styled(View)`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const ActionButton = styled(TouchableOpacity)`
  padding: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const ButtonRow = styled(View)`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.md}px;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const Button = styled(TouchableOpacity)<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  background-color: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  border-width: ${({ variant }) => (variant === 'secondary' ? '1px' : '0px')};
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
`;

const ButtonText = styled(Text)<{ variant?: 'primary' | 'secondary' }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.surface : theme.colors.text};
  margin-left: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const EmptyState = styled(View)`
  align-items: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const EmptyStateText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  text-align: center;
`;

interface CategoryManagerBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  onCategoriesChanged?: () => void;
}

export const CategoryManagerBottomSheet: React.FC<CategoryManagerBottomSheetProps> = ({
  bottomSheetRef,
  onCategoriesChanged,
}) => {
  const theme = useTheme();
  const [_categories, setCategories] = useState<Category[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>(categoryIcons?.[0] || 'cube-outline');
  const [selectedColor, setSelectedColor] = useState<string>(categoryColors?.[0] || '#4A90E2');
  const [isLoading, setIsLoading] = useState(false);

  const snapPoints = useMemo(() => ['90%'], []);

  const keyboardBehavior = useMemo(() => 'interactive', []);
  const keyboardBlurBehavior = useMemo(() => 'restore', []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await getAllCategories();
        setCategories(allCategories);
        const custom = allCategories.filter((cat) => cat.isCustom);
        setCustomCategories(custom);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setIsCreating(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryLabel('');
    setSelectedIcon(categoryIcons?.[0] || 'cube-outline');
    setSelectedColor(categoryColors?.[0] || '#4A90E2');
  }, [bottomSheetRef]);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryLabel('');
    setSelectedIcon(categoryIcons?.[0] || 'cube-outline');
    setSelectedColor(categoryColors?.[0] || '#4A90E2');
  }, []);

  const handleStartEdit = useCallback((category: Category) => {
    setIsCreating(false);
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryLabel(category.label);
    setSelectedIcon(category.icon || categoryIcons[0]);
    setSelectedColor(category.iconColor || categoryColors[0]);
  }, []);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryLabel('');
    setSelectedIcon(categoryIcons?.[0] || 'cube-outline');
    setSelectedColor(categoryColors?.[0] || '#4A90E2');
  }, []);

  const handleSave = useCallback(async () => {
    if (!categoryName.trim() || !categoryLabel.trim()) {
      Alert.alert('错误', '请输入分类名称');
      return;
    }

    setIsLoading(true);
    try {
      let result: Category | null = null;

      if (editingCategoryId) {
        // Update existing category
        result = await updateCategory(editingCategoryId, {
          name: categoryName.trim(),
          label: categoryLabel.trim(),
          icon: selectedIcon,
          iconColor: selectedColor,
        });
      } else {
        // Create new category
        result = await createCategory({
          name: categoryName.trim(),
          label: categoryLabel.trim(),
          icon: selectedIcon,
          iconColor: selectedColor,
        });
      }

      if (result) {
        // Reload categories
        const allCategories = await getAllCategories();
        setCategories(allCategories);
        const custom = allCategories.filter((cat) => cat.isCustom);
        setCustomCategories(custom);

        // Reset form
        setIsCreating(false);
        setEditingCategoryId(null);
        setCategoryName('');
        setCategoryLabel('');
        setSelectedIcon(categoryIcons[0]);
        setSelectedColor(categoryColors[0]);

        // Notify parent
        if (onCategoriesChanged) {
          onCategoriesChanged();
        }
      } else {
        Alert.alert('错误', editingCategoryId ? '更新分类失败，请重试' : '创建分类失败，请重试');
      }
    } catch (error: unknown) {
      console.error('Error saving category:', error);
      const errorMessage = error instanceof Error ? error.message : undefined;
      Alert.alert('错误', errorMessage || (editingCategoryId ? '更新分类失败' : '创建分类失败'));
    } finally {
      setIsLoading(false);
    }
  }, [categoryName, categoryLabel, selectedIcon, selectedColor, editingCategoryId, onCategoriesChanged]);

  const handleDelete = useCallback(async (categoryId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个分类吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const inUse = await isCategoryInUse(categoryId);
              if (inUse) {
                Alert.alert('错误', '无法删除正在使用的分类');
                return;
              }

              const success = await deleteCategory(categoryId);
              if (success) {
                // Reload categories
                const allCategories = await getAllCategories();
                setCategories(allCategories);
                const custom = allCategories.filter((cat) => cat.isCustom);
                setCustomCategories(custom);

                // Notify parent
                if (onCategoriesChanged) {
                  onCategoriesChanged();
                }
              } else {
                Alert.alert('错误', '删除分类失败，请重试');
              }
            } catch (error: unknown) {
              console.error('Error deleting category:', error);
              const errorMessage = error instanceof Error ? error.message : undefined;
              Alert.alert('错误', errorMessage || '删除分类失败');
            }
          },
        },
      ]
    );
  }, [onCategoriesChanged]);

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => <Backdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const showForm = isCreating || editingCategoryId !== null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableContentPanningGesture
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      android_keyboardInputMode="adjustResize"
      enableHandlePanningGesture={false}
      index={0}
    >
      <BottomSheetScrollView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnPanDownToDismiss={false}
      >
        <Header>
          <HeaderLeft>
            <Title>{showForm ? (editingCategoryId ? '编辑分类' : '新建分类') : '管理分类'}</Title>
            <Subtitle>
              {showForm
                ? '设置分类名称、图标和颜色'
                : '创建和编辑自定义分类'}
            </Subtitle>
          </HeaderLeft>
          <CloseButton onPress={handleClose}>
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </CloseButton>
        </Header>

        {!showForm ? (
          <>
            <Button onPress={handleStartCreate} variant="primary" activeOpacity={0.8}>
              <Ionicons name="add" size={20} color={theme.colors.surface} />
              <ButtonText variant="primary">新建分类</ButtonText>
            </Button>

            <FormSection>
              <Label>自定义分类</Label>
              {customCategories.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>还没有自定义分类</EmptyStateText>
                </EmptyState>
              ) : (
                <CategoriesList>
                  {customCategories.map((category) => (
                    <CategoryItem key={category.id}>
                      <CategoryIcon>
                        <Ionicons
                          name={category.icon || 'cube-outline'}
                          size={24}
                          color={category.iconColor || theme.colors.primary}
                        />
                      </CategoryIcon>
                      <CategoryInfo>
                        <CategoryName>{category.label}</CategoryName>
                      </CategoryInfo>
                      <CategoryActions>
                        <ActionButton onPress={() => handleStartEdit(category)} activeOpacity={0.7}>
                          <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                        </ActionButton>
                        <ActionButton onPress={() => handleDelete(category.id)} activeOpacity={0.7}>
                          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                        </ActionButton>
                      </CategoryActions>
                    </CategoryItem>
                  ))}
                </CategoriesList>
              )}
            </FormSection>
          </>
        ) : (
          <>
            <FormSection>
              <Label>分类名称（英文）</Label>
              <Input
                placeholder="例如: electronics"
                value={categoryName}
                onChangeText={setCategoryName}
                placeholderTextColor={theme.colors.textLight}
              />
            </FormSection>

            <FormSection>
              <Label>分类名称（中文）</Label>
              <Input
                placeholder="例如: 电子产品"
                value={categoryLabel}
                onChangeText={setCategoryLabel}
                placeholderTextColor={theme.colors.textLight}
              />
            </FormSection>

            <FormSection>
              <IconSelector
                selectedIcon={selectedIcon}
                iconColor={selectedColor}
                onIconSelect={setSelectedIcon}
              />
            </FormSection>

            <FormSection>
              <ColorPalette
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            </FormSection>

            <ButtonRow>
              <Button onPress={handleCancel} variant="secondary" activeOpacity={0.8}>
                <ButtonText variant="secondary">取消</ButtonText>
              </Button>
              <Button onPress={handleSave} variant="primary" disabled={isLoading} activeOpacity={0.8}>
                <Ionicons name="checkmark" size={20} color={theme.colors.surface} />
                <ButtonText variant="primary">保存</ButtonText>
              </Button>
            </ButtonRow>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

