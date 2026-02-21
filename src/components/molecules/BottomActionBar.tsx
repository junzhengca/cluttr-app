import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import type { StyledProps } from '../../utils/styledComponents';
import { GlassButton } from '../atoms';

export interface ActionButton {
  label: string;
  onPress: () => void;
  variant?: 'outlined' | 'filled' | 'danger';
  icon?: React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export interface BottomActionBarProps {
  actions: ActionButton[];
  safeArea?: boolean;
  inBottomSheet?: boolean;
}

const BottomBarContainer = styled(View)<{ bottomInset: number; showSafeArea: boolean; inBottomSheet: boolean }>`
  ${({ inBottomSheet }: { inBottomSheet: boolean }) => !inBottomSheet ? 'position: absolute;' : ''}
  ${({ inBottomSheet }: { inBottomSheet: boolean }) => !inBottomSheet ? 'bottom: 0;' : ''}
  ${({ inBottomSheet }: { inBottomSheet: boolean }) => !inBottomSheet ? 'left: 0;' : ''}
  ${({ inBottomSheet }: { inBottomSheet: boolean }) => !inBottomSheet ? 'right: 0;' : ''}
  background-color: ${({ theme, inBottomSheet }: StyledProps & { inBottomSheet: boolean }) =>
    inBottomSheet ? theme.colors.background : theme.colors.surface};
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-bottom: ${({ bottomInset, showSafeArea }: { bottomInset: number; showSafeArea: boolean }) => showSafeArea ? bottomInset + 12 : 12}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.05;
  shadow-radius: 12px;
  elevation: 8;
`;

const ActionsContainer = styled(View)`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const getTintAndTextColor = (
  theme: ReturnType<typeof useTheme>,
  variant?: 'outlined' | 'filled' | 'danger'
): { tintColor: string; textColor: string } => {
  if (variant === 'filled') return { tintColor: theme.colors.primary, textColor: theme.colors.surface };
  if (variant === 'danger') return { tintColor: theme.colors.error, textColor: theme.colors.surface };
  return { tintColor: theme.colors.borderLight, textColor: theme.colors.text };
};

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  actions,
  safeArea = true,
  inBottomSheet = false,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <BottomBarContainer bottomInset={insets.bottom} showSafeArea={safeArea} inBottomSheet={inBottomSheet}>
      <ActionsContainer>
        {actions.map((action, index) => {
          const { tintColor, textColor } = getTintAndTextColor(theme, action.variant);
          return (
            <GlassButton
              key={index}
              text={action.label}
              onPress={action.onPress}
              icon={action.iconName}
              tintColor={tintColor}
              textColor={textColor}
              disabled={action.disabled}
              style={{ flex: 1 }}
            />
          );
        })}
      </ActionsContainer>
    </BottomBarContainer>
  );
};
