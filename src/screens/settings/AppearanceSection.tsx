import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps } from '../../utils/styledComponents';

import {
  ThemeChooser,
  CurrencySelector,
  LanguageSelector,
  IconContainer,
  Toggle,
  SectionTitle,
} from '../../components';
import { Settings } from '../../types/settings';
import { SettingsSectionCard } from './SettingsSectionCard';

const SectionWrapper = styled(View)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const PermissionRow = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const LeftSection = styled(View)`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const TextContainer = styled(View)`
  flex: 1;
  flex-direction: column;
  margin-left: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const ItemLabel = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const ItemDescription = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.regular};
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
`;

export interface AppearanceSectionProps {
  settings: Settings;
  onThemeChange: (themeId: string) => void;
  onCurrencyChange: (currencyId: string) => void;
  onLanguageChange: (languageId: string) => void;
  onDarkModeChange: (value: boolean) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  settings,
  onThemeChange,
  onCurrencyChange,
  onLanguageChange,
  onDarkModeChange,
}) => {
  const { t } = useTranslation();

  return (
    <SectionWrapper>
      <SectionTitle title={t('settings.appearance')} icon="color-palette-outline" />
      <SettingsSectionCard>
        <ThemeChooser
          selectedThemeId={settings.theme}
          onThemeSelect={onThemeChange}
        />
        <CurrencySelector
          selectedCurrencyId={settings.currency}
          onCurrencySelect={onCurrencyChange}
        />
        <LanguageSelector
          selectedLanguageId={settings.language}
          onLanguageSelect={onLanguageChange}
        />
        <PermissionRow>
          <LeftSection>
            <IconContainer icon="moon-outline" />
            <TextContainer>
              <ItemLabel>{t('settings.darkMode')}</ItemLabel>
              <ItemDescription>{t('settings.darkModeDescription')}</ItemDescription>
            </TextContainer>
          </LeftSection>
          <Toggle
            value={settings.darkMode ?? false}
            onValueChange={onDarkModeChange}
          />
        </PermissionRow>
      </SettingsSectionCard>
    </SectionWrapper>
  );
};
