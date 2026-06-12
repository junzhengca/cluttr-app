import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import type { IoniconsName } from '../../types/icons';
import { getLightColor } from '../../utils/colors';
import type { StyledProps } from '../../utils/styledComponents';
import { BaseCard } from '../atoms';
import { useTheme } from '../../theme/ThemeProvider';

const IconContainer = styled(View)<{ backgroundColor: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.lg}px;
  background-color: ${({ backgroundColor }: { backgroundColor: string }) =>
    backgroundColor};
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const ContentContainer = styled(View)`
  flex: 1;
  justify-content: center;
`;

const CategoryName = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

const ActionsContainer = styled(View)`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  align-items: center;
`;

const ActionButton = styled(TouchableOpacity)`
  padding: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

/** Minimal structural type so the card works for any category domain. */
export interface CategoryPreviewLike {
  id: string;
  name: string;
  icon?: string;
}

export interface CategoryPreviewCardProps<
  T extends CategoryPreviewLike = CategoryPreviewLike,
> {
  category: T;
  /** Resolved display name (e.g. i18n-translated); falls back to category.name. */
  displayName?: string;
  onEdit?: (category: T) => void;
  onDelete?: (categoryId: string) => void;
}

/**
 * CategoryPreviewCard - A card component for displaying category previews
 * Uses the same BaseCard styling as ItemCard for consistency
 */
export const CategoryPreviewCard = <
  T extends CategoryPreviewLike = CategoryPreviewLike,
>({
  category,
  displayName,
  onEdit,
  onDelete,
}: CategoryPreviewCardProps<T>) => {
  const theme = useTheme();

  return (
    <BaseCard compact>
      <IconContainer backgroundColor={getLightColor(theme.colors.primary)}>
        <Ionicons
          name={(category.icon || 'pricetag-outline') as IoniconsName}
          size={24}
          color={theme.colors.primary}
        />
      </IconContainer>

      <ContentContainer>
        <CategoryName>{displayName ?? category.name}</CategoryName>
      </ContentContainer>

      {(onEdit || onDelete) && (
        <ActionsContainer>
          {onEdit && (
            <ActionButton onPress={() => onEdit(category)} activeOpacity={0.7}>
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.colors.primary}
              />
            </ActionButton>
          )}
          {onDelete && (
            <ActionButton
              onPress={() => onDelete(category.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.error}
              />
            </ActionButton>
          )}
        </ActionsContainer>
      )}
    </BaseCard>
  );
};
