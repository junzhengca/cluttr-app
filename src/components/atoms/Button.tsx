import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import type { StyledProps, StyledPropsWith } from '../../utils/styledComponents';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
    onPress: () => void;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
    variant?: ButtonVariant;
    disabled?: boolean;
    iconColor?: string; // Optional custom icon color when using icon name
    fullWidth?: boolean; // If true, button takes full width; if false, uses flex: 1 in containers
}

const StyledButton = styled(TouchableOpacity).attrs({ activeOpacity: 0.7 }) <{ variant: ButtonVariant; disabled?: boolean }>`
  background-color: ${({ theme, variant, disabled }: StyledPropsWith<{ variant: ButtonVariant; disabled?: boolean }>) =>
        disabled
          ? theme.colors.borderLight
          : variant === 'primary'
            ? theme.colors.primary
            : 'transparent'};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-vertical: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-width: ${({ variant, disabled }: { variant: ButtonVariant; disabled?: boolean }) =>
    (variant !== 'primary' && !disabled) ? 1.5 : 0}px;
  border-color: ${({ theme, variant }: StyledPropsWith<{ variant: ButtonVariant }>) =>
    variant === 'danger' ? theme.colors.error : theme.colors.border};
  elevation: ${({ disabled }: { disabled?: boolean }) => disabled ? 0 : 1};
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: ${({ disabled }: { disabled?: boolean }) => disabled ? 0 : 0.05};
  shadow-radius: 2px;
`;

const FullWidthButton = styled(StyledButton)`
  width: 100%;
`;

const FlexibleButton = styled(StyledButton)`
  flex: 1;
`;

const IconContainer = styled(View)`
  width: 24px;
  height: 24px;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
`;

const StyledIcon = styled(Ionicons) <{ variant: ButtonVariant; disabled?: boolean; color?: string }>`
  color: ${({ theme, variant, disabled, color }: StyledPropsWith<{ variant: ButtonVariant; disabled?: boolean; color?: string }>) =>
        color
          ? color
          : disabled
            ? theme.colors.textSecondary
            : variant === 'primary'
              ? theme.colors.surface
              : variant === 'danger'
                ? theme.colors.error
                : theme.colors.primary};
`;

const ButtonText = styled(Text) <{ variant: ButtonVariant; disabled?: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme, variant, disabled }: StyledPropsWith<{ variant: ButtonVariant; disabled?: boolean }>) =>
        disabled
          ? theme.colors.textSecondary
          : variant === 'primary'
            ? theme.colors.surface
            : variant === 'danger'
              ? theme.colors.error
              : theme.colors.text};
`;

export const Button: React.FC<ButtonProps> = ({
    onPress,
    label,
    icon,
    variant = 'secondary',
    disabled = false,
    iconColor,
    fullWidth = true,
}) => {
    const renderIcon = () => {
        if (!icon) return null;

        // If icon is a React element (custom icon), render it directly
        if (React.isValidElement(icon)) {
            return <IconContainer>{icon}</IconContainer>;
        }

        // Otherwise, it's an icon name string - render Ionicons
        return (
            <IconContainer>
                <StyledIcon
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    variant={variant}
                    disabled={disabled}
                    color={iconColor}
                />
            </IconContainer>
        );
    };

    const ButtonComponent = fullWidth ? FullWidthButton : FlexibleButton;

    return (
        <ButtonComponent
            onPress={onPress}
            variant={variant}
            disabled={disabled}
        >
            {renderIcon()}
            <ButtonText variant={variant} disabled={disabled}>{label}</ButtonText>
        </ButtonComponent>
    );
};
