import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps } from '../../utils/styledComponents';

import {
  IconContainer,
  SectionTitle,
  SettingsTextButton,
} from '../../components';
import { useSubscription } from '../../hooks/useSubscription';
import { useToast } from '../../hooks/useToast';
import { SettingsSectionCard } from './SettingsSectionCard';

const SectionWrapper = styled(View)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const StatusRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const TextContainer = styled(View)`
  flex: 1;
  flex-direction: column;
  margin-left: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const ItemLabel = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const ItemDescription = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.regular};
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
`;

/**
 * Cluttr Pro subscription management. Hidden entirely when the RevenueCat SDK
 * is unavailable (dev client built before the SDK was added, or missing key).
 */
export const SubscriptionSection: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    isAvailable,
    isPro,
    proEntitlement,
    presentPaywall,
    presentCustomerCenter,
    restorePurchases,
  } = useSubscription();

  const handleUpgrade = useCallback(async () => {
    const unlocked = await presentPaywall();
    if (unlocked) {
      toast.showToast(
        t('settings.subscription.purchaseSuccess', 'Welcome to Cluttr Pro!'),
        'success'
      );
    }
  }, [presentPaywall, toast, t]);

  const handleRestore = useCallback(async () => {
    const result = await restorePurchases();
    if (result.error) {
      toast.showToast(
        t('settings.subscription.restoreError', 'Failed to restore purchases'),
        'error'
      );
    } else if (result.unlocked) {
      toast.showToast(
        t('settings.subscription.restoreSuccess', 'Purchases restored'),
        'success'
      );
    } else {
      toast.showToast(
        t('settings.subscription.restoreNone', 'No purchases to restore'),
        'info'
      );
    }
  }, [restorePurchases, toast, t]);

  const handleManage = useCallback(() => {
    presentCustomerCenter();
  }, [presentCustomerCenter]);

  if (!isAvailable) return null;

  const statusDescription = !proEntitlement?.expirationDate
    ? t('settings.subscription.lifetime', 'Lifetime access')
    : proEntitlement.willRenew
      ? t('settings.subscription.renewsOn', 'Renews on {{date}}', {
          date: new Date(proEntitlement.expirationDate).toLocaleDateString(),
        })
      : t('settings.subscription.expiresOn', 'Expires on {{date}}', {
          date: new Date(proEntitlement.expirationDate).toLocaleDateString(),
        });

  return (
    <SectionWrapper>
      <SectionTitle
        title={t('settings.subscription.title', 'Cluttr Pro')}
        icon="sparkles-outline"
      />
      <SettingsSectionCard>
        {isPro ? (
          <>
            <StatusRow>
              <IconContainer icon="checkmark-circle-outline" />
              <TextContainer>
                <ItemLabel>
                  {t('settings.subscription.active', 'Cluttr Pro is active')}
                </ItemLabel>
                <ItemDescription>{statusDescription}</ItemDescription>
              </TextContainer>
            </StatusRow>
            <SettingsTextButton
              label={t('settings.subscription.manage', 'Manage Subscription')}
              icon="card-outline"
              onPress={handleManage}
              noMarginBottom
            />
          </>
        ) : (
          <>
            <SettingsTextButton
              label={t(
                'settings.subscription.upgrade',
                'Upgrade to Cluttr Pro'
              )}
              icon="sparkles-outline"
              onPress={handleUpgrade}
            />
            <SettingsTextButton
              label={t('settings.subscription.restore', 'Restore Purchases')}
              icon="refresh-outline"
              onPress={handleRestore}
              noMarginBottom
            />
          </>
        )}
      </SettingsSectionCard>
    </SectionWrapper>
  );
};
