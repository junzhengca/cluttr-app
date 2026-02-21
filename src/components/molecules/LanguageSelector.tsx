import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps, StyledPropsWith } from '../../utils/styledComponents';
import type { Theme } from '../../theme/types';
import { SectionTitle } from '../atoms';

export type LanguageOption = {
  id: string;
  code: string;
  name: string;
  flag?: string;
};

export interface LanguageSelectorProps {
  selectedLanguageId?: string;
  onLanguageSelect?: (languageId: string) => void;
}

const Container = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

/**
 * Container with negative horizontal margins to enable edge-to-edge scrolling.
 * The ScrollView's contentContainerStyle adds horizontal padding to restore
 * proper spacing while allowing content to scroll to the screen edges.
 */
const ScrollContainer = styled(View)<{ horizontalPadding: number }>`
  margin-horizontal: -${({ horizontalPadding }: { horizontalPadding: number }) => horizontalPadding}px;
`;

const LanguageScrollView = styled(ScrollView)`
  flex-direction: row;
`;

const OptionsContainer = styled(View)`
  flex-direction: row;
  justify-content: flex-start;
  gap: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const LanguageButton = styled(TouchableOpacity) <{ isSelected: boolean }>`
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.xl}px;
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: 2px;
  border-color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.borderLight};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const FlagContainer = styled(View)`
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const FlagText = styled(Text)`
  font-size: 18px;
`;

const LanguageButtonText = styled(Text) <{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.textLight};
`;

const defaultLanguages: LanguageOption[] = [
  { id: 'en', code: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'zh-cn', code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { id: 'ja', code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguageId = 'en',
  onLanguageSelect,
}) => {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  const horizontalPadding = theme.spacing.md;

  const scrollContentStyle = {
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
  };

  return (
    <Container>
      <SectionTitle title={t('language.title')} icon="globe" />
      <ScrollContainer horizontalPadding={horizontalPadding}>
        <LanguageScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
          <OptionsContainer>
            {defaultLanguages.map((language) => (
              <LanguageButton
                key={language.id}
                isSelected={selectedLanguageId === language.id}
                onPress={() => onLanguageSelect?.(language.id)}
                activeOpacity={0.7}
              >
                {language.flag && (
                  <FlagContainer>
                    <FlagText>{language.flag}</FlagText>
                  </FlagContainer>
                )}
                <LanguageButtonText isSelected={selectedLanguageId === language.id}>
                  {language.name}
                </LanguageButtonText>
              </LanguageButton>
            ))}
          </OptionsContainer>
        </LanguageScrollView>
      </ScrollContainer>
    </Container>
  );
};

