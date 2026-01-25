import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StyledProps } from '../../utils/styledComponents';
import { Button, type ButtonVariant } from '../atoms';

export interface ActionButton {
  label: string;
  onPress: () => void;
  variant?: 'outlined' | 'filled' | 'danger';
  icon?: React.ReactNode;
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
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
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

const mapVariantToButton = (variant?: 'outlined' | 'filled' | 'danger'): ButtonVariant => {
  if (variant === 'filled') return 'primary';
  if (variant === 'danger') return 'danger';
  return 'secondary';
};

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  actions,
  safeArea = true,
  inBottomSheet = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <BottomBarContainer bottomInset={insets.bottom} showSafeArea={safeArea} inBottomSheet={inBottomSheet}>
      <ActionsContainer>
        {actions.map((action, index) => (
          <Button
            key={index}
            label={action.label}
            onPress={action.onPress}
            variant={mapVariantToButton(action.variant)}
            icon={action.icon}
            disabled={action.disabled}
            fullWidth={false}
          />
        ))}
      </ActionsContainer>
    </BottomBarContainer>
  );
};
