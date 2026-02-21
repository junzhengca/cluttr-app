import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type {
    StyledProps,
    StyledPropsWith,
} from '../../utils/styledComponents';
import { useCategories } from '../../hooks/useCategories';
import { getInventoryCategoryDisplayName } from '../../utils/inventoryCategoryI18n';
import type { Theme } from '../../theme/types';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { CreateCategoryBottomSheet } from '../organisms/CreateCategoryBottomSheet';

const FilterContainer = styled(View)`
  margin-bottom: 0px;
`;

const CategoryScrollView = styled(ScrollView).attrs(() => ({
    horizontal: true,
    showsHorizontalScrollIndicator: false,
}))`
  flex-grow: 0;
`;

// Pill-shaped item container
const CategoryButton = styled(TouchableOpacity) <{ isSelected: boolean }>`
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.full}px;
  flex-direction: row;
  align-items: center;
  background-color: ${({
    theme,
    isSelected,
}: StyledPropsWith<{ isSelected: boolean }>) =>
        isSelected ? theme.colors.primary : theme.colors.surface};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
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
  color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
        isSelected ? theme.colors.surface : theme.colors.text};
`;

const CountText = styled(Text) <{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
        isSelected ? theme.colors.surface : theme.colors.textSecondary};
  margin-left: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  opacity: 0.7;
`;

const CreateCategoryButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.full}px;
  background-color: transparent;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-width: 1.5px;
  border-style: dotted;
  border-color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

export interface CategoryFilterProps {
    selectedCategoryId: string | null;
    onSelect: (categoryId: string | null) => void;
    counts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    selectedCategoryId,
    onSelect,
    counts = {},
}) => {
    const { t } = useTranslation();
    const theme = useTheme() as Theme;
    const { categories, loading } = useCategories();
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);

    const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

    if (loading && categories.length === 0) {
        return null; // Or skeleton
    }

    return (
        <FilterContainer>
            <CategoryScrollView
                contentContainerStyle={{
                    paddingLeft: theme.spacing.md,
                    paddingRight: theme.spacing.md,
                }}
            >
                {/* All Categories Option */}
                <CategoryButton
                    isSelected={selectedCategoryId === null}
                    onPress={() => onSelect(null)}
                    activeOpacity={0.7}
                >
                    <ColorDot color={selectedCategoryId === null ? 'transparent' : theme.colors.textSecondary} style={{ borderWidth: 1, borderColor: selectedCategoryId === null ? theme.colors.surface : theme.colors.border }} />
                    <CategoryText isSelected={selectedCategoryId === null}>
                        {t('categories.all')}
                    </CategoryText>
                    <CountText isSelected={selectedCategoryId === null}>
                        {totalCount}
                    </CountText>
                </CategoryButton>

                {/* Categories */}
                {categories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    return (
                        <CategoryButton
                            key={category.id}
                            isSelected={isSelected}
                            onPress={() => onSelect(category.id)}
                            activeOpacity={0.7}
                        >
                            <ColorDot color={category.color || theme.colors.secondary} />
                            <CategoryText isSelected={isSelected}>
                                {getInventoryCategoryDisplayName(category, t)}
                            </CategoryText>
                            <CountText isSelected={isSelected}>
                                {counts[category.id] || 0}
                            </CountText>
                        </CategoryButton>
                    );
                })}

                <CreateCategoryButton
                    onPress={() => {
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
            </CategoryScrollView>

            <CreateCategoryBottomSheet
                bottomSheetRef={bottomSheetRef}
            />
        </FilterContainer>
    );
};
