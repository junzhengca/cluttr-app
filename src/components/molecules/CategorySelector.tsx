import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { Category } from '../../types/inventory';
import { useInventoryCategories } from '../../store/hooks';
import { getInventoryCategoryDisplayName } from '../../utils/inventoryCategoryI18n';
import type { StyledProps, StyledPropsWith } from '../../utils/styledComponents';
import type { Theme } from '../../theme/types';

const Container = styled(View)``;

const ScrollContainer = styled(ScrollView)`
  flex-direction: row;
`;

const CategoryButton = styled(TouchableOpacity) <{ isSelected: boolean }>`
  flex-direction: row;
  align-items: center;
  padding-horizontal: 16px;
  padding-vertical: 6px;
  border-radius: 18px;
  background-color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.surface};
  border-width: 1.5px;
  border-color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.border};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;

  /* Elevation for Android */
  elevation: ${({ isSelected }: { isSelected: boolean }) => (isSelected ? 4 : 0)};

  /* Shadow for iOS */
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: ${({ isSelected }: { isSelected: boolean }) => (isSelected ? 0.1 : 0)};
  shadow-radius: 2px;
`;

const ColorDot = styled(View) <{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ color }: { color: string }) => color};
  margin-right: 6px;
`;

const CategoryText = styled(Text) <{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.surface : theme.colors.textSecondary};
`;

const CreateCategoryButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding-horizontal: 16px;
  padding-vertical: 6px;
  border-radius: 18px;
  background-color: transparent;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
  border-width: 1.5px;
  border-style: dotted;
  border-color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  align-self: stretch;
`;

export interface CategorySelectorProps {
  categories?: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onOpeningNestedModal?: (isOpening: boolean) => void;
}

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { CreateCategoryBottomSheet } from '../organisms/CreateCategoryBottomSheet';

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories: providedCategories,
  selectedCategory: parentSelectedCategory,
  onCategoryChange,
  onOpeningNestedModal,
}) => {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(parentSelectedCategory || 'all');
  const [categories, setCategories] = useState<Category[]>([]);
  const { categories: allCategories } = useInventoryCategories();

  // Scroll content padding uses theme spacing for consistency
  const scrollContentStyle = {
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  };

  const loadCategories = useCallback(() => {
    if (providedCategories) {
      setCategories(providedCategories);
      return;
    }

    // Use categories from Redux state
    const allCategory: Category = {
      id: 'all',
      name: 'all',
      label: t('categories.all'),
      isCustom: false,
      homeId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories([allCategory, ...allCategories]);
  }, [providedCategories, t, allCategories]);

  // Load categories when categories from Redux change
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Sync internal state with parent's selectedCategory prop
  useEffect(() => {
    if (parentSelectedCategory !== undefined) {
      setSelectedCategory(parentSelectedCategory);
    }
  }, [parentSelectedCategory]);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  return (
    <Container>
      <ScrollContainer
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            isSelected={selectedCategory === category.id}
            onPress={() => handleCategoryPress(category.id)}
            activeOpacity={0.8}
          >
            <ColorDot
              color={category.id === 'all'
                ? (selectedCategory === 'all' ? 'transparent' : theme.colors.textSecondary)
                : (category.color || theme.colors.secondary)}
              style={category.id === 'all' ? { borderWidth: 1, borderColor: selectedCategory === 'all' ? theme.colors.surface : theme.colors.border } : {}}
            />
            <CategoryText isSelected={selectedCategory === category.id}>
              {category.label || (category.id === 'all'
                ? t('categories.all')
                : getInventoryCategoryDisplayName(category, t))}
            </CategoryText>
          </CategoryButton>
        ))}

        <CreateCategoryButton
          onPress={() => {
            onOpeningNestedModal?.(true);
            bottomSheetRef.current?.present();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={20}
            color={theme.colors.textSecondary}
          />
        </CreateCategoryButton>
      </ScrollContainer>

      <CreateCategoryBottomSheet
        bottomSheetRef={bottomSheetRef}
        onClose={() => onOpeningNestedModal?.(false)}
      />
    </Container>
  );
};
