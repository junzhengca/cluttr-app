import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { useTranslation } from 'react-i18next';
import type {
  StyledProps,
  StyledPropsWith,
} from '../../utils/styledComponents';
import { useTodoCategories } from '../../store/hooks';
import { getTodoCategoryDisplayName } from '../../utils/todoCategoryI18n';
import type { Theme } from '../../theme/types';

const PickerContainer = styled(View)`
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const CategoryScrollView = styled(ScrollView).attrs(() => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
}))`
  flex-grow: 0;
`;

const CategoryButton = styled(TouchableOpacity)<{ isSelected: boolean }>`
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.full}px;
  background-color: ${({
    theme,
    isSelected,
  }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.surface};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-width: 1px;
  border-color: ${({
    theme,
    isSelected,
  }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : 'transparent'};
`;

const CategoryText = styled(Text)<{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.regular};
  color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.surface : theme.colors.textSecondary};
`;

const ManageButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.full}px;
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
  border-style: dashed;
`;

const ManageText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.regular};
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

export interface TodoCategoryPickerProps {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  /** When provided, renders a trailing manage chip (and keeps the picker visible with zero categories). */
  onManagePress?: () => void;
}

export const TodoCategoryPicker: React.FC<TodoCategoryPickerProps> = ({
  selectedCategoryId,
  onSelect,
  onManagePress,
}) => {
  const theme = useTheme() as Theme;
  const { t } = useTranslation();
  const { categories } = useTodoCategories();

  // Select first category by default if none selected
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      onSelect(categories[0].id);
    }
  }, [categories, selectedCategoryId, onSelect]);

  // Scroll content padding uses theme spacing for consistency
  const scrollContentStyle = {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  };

  if (categories.length === 0 && !onManagePress) {
    return null;
  }

  return (
    <PickerContainer>
      <CategoryScrollView contentContainerStyle={scrollContentStyle}>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <CategoryButton
              key={category.id}
              isSelected={isSelected}
              onPress={() => onSelect(category.id)}
              activeOpacity={0.7}
            >
              <CategoryText isSelected={isSelected}>
                {getTodoCategoryDisplayName(category, t)}
              </CategoryText>
            </CategoryButton>
          );
        })}
        {onManagePress && (
          <ManageButton onPress={onManagePress} activeOpacity={0.7}>
            <Ionicons
              name="pricetags-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <ManageText>{t('todoCategories.manage')}</ManageText>
          </ManageButton>
        )}
      </CategoryScrollView>
    </PickerContainer>
  );
};
