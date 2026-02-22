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
  flex-direction: row;
  align-items: center;
`;

const RightContainer = styled(View)`
  flex: 1;
  justify-content: center;
`;

const HeaderRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
  justify-content: flex-start;
`;

// Remaining Days Badge
const ExpiryBadge = styled(View) <{ isExpired?: boolean; isNear?: boolean }>`
  width: 48px;
  height: 48px;
  background-color: ${({ theme, isExpired, isNear }: StyledProps & { isExpired?: boolean; isNear?: boolean }) => {
        if (isExpired) return theme.colors.errorLight || '#FFEBEE';
        if (isNear) return '#FFF9C4'; // Light yellow
        return '#F2F0F9'; // Light purple background as per image
    }};
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const ExpiryText = styled(Text) <{ isExpired?: boolean; isNear?: boolean }>`
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  line-height: 18px;
  color: ${({ theme, isExpired, isNear }: StyledProps & { isExpired?: boolean; isNear?: boolean }) => {
        if (isExpired) return theme.colors.error;
        if (isNear) return '#F57F17'; // Darker yellow/orange
        return '#5B517E'; // Deep purple text as per image
    }};
`;

const QuantityText = styled(Text)`
  font-size: 18px;
  font-weight: 800;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-right: 12px;
`;

const VendorBadge = styled(View)`
  background-color: ${({ theme }: StyledProps) => theme.colors.background || '#F4F6F8'};
  padding-horizontal: 8px;
  padding-vertical: 4px;
  border-radius: 6px;
`;

const VendorText = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary || '#6B7280'};
`;

const DetailsRow = styled(View)`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const DetailText = styled(Text)`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }: StyledProps) => theme.colors.textLight || '#9CA3AF'};
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
            if (expiryStatus.days <= 3) isNear = true; // Changed to 3 days to match standard purple styling for 7 days
        }

        return (
            <ExpiryBadge isExpired={isExpired} isNear={isNear}>
                <ExpiryText isExpired={isExpired} isNear={isNear}>{text}</ExpiryText>
            </ExpiryBadge>
        );
    };

    return (
        <BaseCard compact style={{ marginBottom: 12, paddingVertical: 12 }}>
            <ContentWrapper>
                {renderExpiryBadge()}
                <RightContainer>
                    <HeaderRow>
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
                                {t('itemDetails.batch.unitPrice')}{formatPrice(batch.price, currencySymbol)}
                            </DetailText>
                        )}
                    </DetailsRow>
                </RightContainer>
            </ContentWrapper>
        </BaseCard>
    );
};
