import React from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type {
  StyledProps,
  StyledPropsWith,
} from '../../utils/styledComponents';

import { GlassButton } from '../../components';
import { useTheme } from '../../theme/ThemeProvider';

export type TodoMode = 'planning' | 'shopping';

// Banner Components
const BannerContent = styled(View)`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const IconContainer = styled(View)<{ mode: TodoMode }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.lg}px;
  background-color: ${({ theme, mode }: StyledPropsWith<{ mode: TodoMode }>) =>
    mode === 'shopping' ? 'rgba(255, 255, 255, 0.2)' : theme.colors.background};
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const TextContainer = styled(View)`
  flex: 1;
`;

const BannerTitle = styled(Text)<{ mode: TodoMode }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: 600;
  color: ${({ theme, mode }: StyledPropsWith<{ mode: TodoMode }>) =>
    mode === 'shopping' ? '#FFFFFF' : theme.colors.text};
  margin-bottom: 2px;
`;

const BannerSubtitle = styled(Text)<{ mode: TodoMode }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.xs}px;
  color: ${({ theme, mode }: StyledPropsWith<{ mode: TodoMode }>) =>
    mode === 'shopping'
      ? 'rgba(255, 255, 255, 0.8)'
      : theme.colors.textSecondary};
`;

const AnimatedIconContainer = Animated.createAnimatedComponent(IconContainer);
const AnimatedBannerTitle = Animated.createAnimatedComponent(BannerTitle);
const AnimatedBannerSubtitle = Animated.createAnimatedComponent(BannerSubtitle);

interface NotesBannerProps {
  mode: TodoMode;
  bannerProgress: Animated.Value;
  onToggleMode: () => void;
}

export const NotesBanner: React.FC<NotesBannerProps> = ({
  mode,
  bannerProgress,
  onToggleMode,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Animated.View
      style={[
        {
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          overflow: 'hidden',
        },
        {
          backgroundColor: bannerProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.colors.surface, theme.colors.primary],
          }),
          borderColor: bannerProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.colors.borderLight, theme.colors.primary],
          }),
        },
      ]}
    >
      <BannerContent>
        <AnimatedIconContainer
          mode={mode}
          style={{
            backgroundColor: bannerProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [
                theme.colors.background,
                'rgba(255, 255, 255, 0.2)',
              ],
            }),
          }}
        >
          <Ionicons
            name={mode === 'shopping' ? 'cart' : 'grid-outline'}
            size={18}
            color={mode === 'shopping' ? '#FFFFFF' : theme.colors.primary}
          />
        </AnimatedIconContainer>
        <TextContainer>
          <AnimatedBannerTitle
            mode={mode}
            style={{
              color: bannerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.colors.text, '#FFFFFF'],
              }),
            }}
          >
            {t(`notes.banner.${mode}.title`)}
          </AnimatedBannerTitle>
          <AnimatedBannerSubtitle
            mode={mode}
            style={{
              color: bannerProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  theme.colors.textSecondary,
                  'rgba(255, 255, 255, 0.8)',
                ],
              }),
            }}
          >
            {t(`notes.banner.${mode}.subtitle`)}
          </AnimatedBannerSubtitle>
        </TextContainer>
      </BannerContent>
      <GlassButton
        onPress={onToggleMode}
        text={t(`notes.banner.${mode}.button`)}
        tintColor={mode === 'shopping' ? '#FFFFFF' : theme.colors.primary}
        textColor={mode === 'shopping' ? theme.colors.primary : '#FFFFFF'}
      />
    </Animated.View>
  );
};
