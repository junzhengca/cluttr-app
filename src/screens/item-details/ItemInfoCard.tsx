import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { InventoryItem } from '../../types/inventory';
import type { StyledProps } from '../../utils/styledComponents';

const HeaderCard = styled(View)`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.xl}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.03;
  shadow-radius: 8px;
  elevation: 2;
`;

const ItemName = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.xl}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  letter-spacing: -0.2px;
`;

const BadgesContainer = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const BadgesAndQuantityRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Badge = styled(View) <{ color?: string, isSelected?: boolean }>`
  background-color: ${({ isSelected, theme }: StyledProps & { isSelected?: boolean }) =>
    isSelected ? theme.colors.primary : theme.colors.borderLight};
  padding-horizontal: 10px;
  padding-vertical: 5px;
  border-radius: 8px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const BadgeText = styled(Text) <{ isSelected?: boolean }>`
  color: ${({ theme, isSelected }: StyledProps & { isSelected?: boolean }) =>
    isSelected ? 'white' : theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 600;
`;

const ColorDot = styled(View) <{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ color }: { color: string }) => color};
  margin-right: 6px;
`;

const TotalAmountRow = styled(View)`
  flex-direction: row;
  align-items: baseline;
`;

const TotalAmountLabel = styled(Text)`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
  margin-right: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TotalAmountValue = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

interface ItemInfoCardProps {
  item: InventoryItem;
  locationName: string;
  categoryName: string;
  categoryColor?: string;
  totalAmount: number;
}

export const ItemInfoCard: React.FC<ItemInfoCardProps> = ({
  item,
  locationName,
  categoryName,
  categoryColor,
  totalAmount,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <HeaderCard>
      <ItemName>{item.name}</ItemName>

      <BadgesAndQuantityRow>
        <BadgesContainer>
          {locationName ? (
            <Badge isSelected={false}>
              <BadgeText isSelected={false}>{locationName}</BadgeText>
            </Badge>
          ) : null}
          {categoryName ? (
            <Badge isSelected={false}>
              <ColorDot color={categoryColor || theme.colors.secondary} />
              <BadgeText isSelected={false}>{categoryName}</BadgeText>
            </Badge>
          ) : null}
        </BadgesContainer>

        <TotalAmountRow>
          <TotalAmountLabel>{t('itemDetails.fields.quantity')} : </TotalAmountLabel>
          <TotalAmountValue>
            {totalAmount}{item.batches && item.batches.length > 0 && item.batches[0].unit ? ` ${item.batches[0].unit}` : ''}
          </TotalAmountValue>
        </TotalAmountRow>
      </BadgesAndQuantityRow>
    </HeaderCard>
  );
};
