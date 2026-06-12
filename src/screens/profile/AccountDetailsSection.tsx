import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import type { StyledProps } from '../../utils/styledComponents';
import { SectionTitle, HorizontalSplitter } from '../../components';
import { formatDate } from '../../utils/formatters';
import type { User } from '../../types/user';
import { SettingsSectionCard, SectionWrapper } from './styles';

const InfoRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const InfoLabel = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

const InfoValue = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

interface AccountDetailsSectionProps {
  user: User;
}

export const AccountDetailsSection: React.FC<AccountDetailsSectionProps> = ({ user }) => {
  const { t } = useTranslation();

  const getLocale = useCallback(() => {
    return i18n.language === 'zh' || i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  }, []);

  return (
    <SectionWrapper>
      <SectionTitle title={t('profile.accountInfo', 'Account Information')} icon="information-circle-outline" />
      <SettingsSectionCard>
        {user.nickname && (
          <>
            <InfoRow>
              <InfoLabel>{t('profile.nickname')}</InfoLabel>
              <InfoValue>{user.nickname}</InfoValue>
            </InfoRow>
            <HorizontalSplitter />
          </>
        )}
        <InfoRow>
          <InfoLabel>{t('profile.email')}</InfoLabel>
          <InfoValue>{user.email}</InfoValue>
        </InfoRow>
        {user.createdAt && (
          <>
            <HorizontalSplitter />
            <InfoRow>
              <InfoLabel>{t('profile.memberSince')}</InfoLabel>
              <InfoValue>{formatDate(user.createdAt, getLocale(), t)}</InfoValue>
            </InfoRow>
          </>
        )}
        {user.updatedAt && (
          <>
            <HorizontalSplitter />
            <InfoRow>
              <InfoLabel>{t('profile.lastUpdated')}</InfoLabel>
              <InfoValue>{formatDate(user.updatedAt, getLocale(), t)}</InfoValue>
            </InfoRow>
          </>
        )}
      </SettingsSectionCard>
    </SectionWrapper>
  );
};
