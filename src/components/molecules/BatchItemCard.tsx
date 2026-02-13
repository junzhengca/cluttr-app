import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { ItemBatch } from '../../types/inventory';
import { formatPrice } from '../../utils/formatters';
import type { StyledProps } from '../../utils/styledComponents';
import { BaseCard } from '../atoms';


interface BatchItemCardProps {
    batch: ItemBatch;
    currencySymbol: string;
}

const ContentWrapper = styled(View)`
  width: 100%;
`;

const HeaderRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  justify-content: flex-start;
`;

// Remaining Days Badge
const ExpiryBadge = styled(View) <{ isExpired?: boolean; isNear?: boolean }>`
  background-color: ${({ theme, isExpired, isNear }: StyledProps & { isExpired?: boolean; isNear?: boolean }) => {
        if (isExpired) return theme.colors.errorLight || '#FFEBEE';
        if (isNear) return '#FFF9C4'; // Light yellow
        return theme.colors.successLight || '#E8F5E9';
    }};
  padding-horizontal: 8px;
  padding-vertical: 4px;
  border-radius: 8px;
  margin-right: 12px;
`;

const ExpiryText = styled(Text) <{ isExpired?: boolean; isNear?: boolean }>`
  font-size: 12px;
  font-weight: bold;
  color: ${({ theme, isExpired, isNear }: StyledProps & { isExpired?: boolean; isNear?: boolean }) => {
        if (isExpired) return theme.colors.error;
        if (isNear) return '#F57F17'; // Darker yellow/orange
        return theme.colors.success;
    }};
`;

const QuantityText = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-right: 12px;
`;

const VendorBadge = styled(View)`
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
  padding-horizontal: 8px;
  padding-vertical: 2px;
  border-radius: 4px;
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
`;

const VendorText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

const DetailsRow = styled(View)`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const DetailText = styled(Text)`
  font-size: 12px;
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
`;

export const BatchItemCard: React.FC<BatchItemCardProps> = ({ batch, currencySymbol }) => {
    const { t } = useTranslation();

    const getExpiryStatus = (expiryDate?: string) => {
        if (!expiryDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { type: 'expired', days: Math.abs(diffDays) };
        if (diffDays === 0) return { type: 'today', days: 0 };
        return { type: 'remaining', days: diffDays };
    };

    const expiryStatus = getExpiryStatus(batch.expiryDate);

    const renderExpiryBadge = () => {
        if (!expiryStatus) return null;

        let text = '';
        let isExpired = false;
        let isNear = false;

        if (expiryStatus.type === 'expired') {
            text = t('itemDetails.batch.daysOverdue', { days: expiryStatus.days });
            isExpired = true;
        } else if (expiryStatus.type === 'today') {
            text = t('itemDetails.batch.today');
            isNear = true;
        } else {
            text = t('itemDetails.batch.remainingDays', { days: expiryStatus.days });
            // Consider "near" if less than 7 days, for example. 
            // Or just always yellow as per screenshot seems to imply standard state?
            // Screenshot has "Remains 3 days" in yellow.
            if (expiryStatus.days <= 7) isNear = true;
        }

        return (
            <ExpiryBadge isExpired={isExpired} isNear={isNear}>
                <ExpiryText isExpired={isExpired} isNear={isNear}>{text}</ExpiryText>
            </ExpiryBadge>
        );
    };

    return (
        <BaseCard compact style={{ marginBottom: 8 }}>
            <ContentWrapper>
                <HeaderRow>
                    {renderExpiryBadge()}
                    <QuantityText>
                        x{batch.amount}{batch.unit}
                    </QuantityText>
                    {batch.vendor && (
                        <VendorBadge>
                            <VendorText>{batch.vendor}</VendorText>
                        </VendorBadge>
                    )}
                </HeaderRow>

                <DetailsRow>
                    {batch.purchaseDate && (
                        <DetailText>
                            {t('itemDetails.batch.inboundDate')}{batch.purchaseDate.split('T')[0]}
                        </DetailText>
                    )}
                    {batch.expiryDate && (
                        <DetailText>
                            {t('itemDetails.batch.expiryDate')}{batch.expiryDate.split('T')[0]}
                        </DetailText>
                    )}
                    {batch.price != null && batch.price > 0 && (
                        <DetailText>
                            {formatPrice(batch.price, currencySymbol)}
                        </DetailText>
                    )}
                </DetailsRow>
            </ContentWrapper>
        </BaseCard>
    );
};
