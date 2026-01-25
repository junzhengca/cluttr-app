import React from 'react';
import { View, Text, TouchableOpacity, GestureResponderEvent } from 'react-native';
import styled from 'styled-components/native';
import type { StyledProps } from '../../utils/styledComponents';
import { Toggle } from '../atoms';

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const LabelContainer = styled(View)`
  flex: 1;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const Label = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

const Description = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.regular};
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

export interface SettingsToggleItemProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}

/**
 * SettingsToggleItem - A labeled toggle component for settings
 * Displays a label with optional description and a toggle switch
 */
export const SettingsToggleItem: React.FC<SettingsToggleItemProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  onPress,
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled) {
      if (onPress) {
        onPress(event);
      } else {
        onValueChange(!value);
      }
    }
  };

  return (
    <Container onPress={handlePress} disabled={disabled} activeOpacity={0.7}>
      <LabelContainer>
        <Label>{label}</Label>
        {description && <Description>{description}</Description>}
      </LabelContainer>
      <Toggle value={value} onValueChange={onValueChange} disabled={disabled} />
    </Container>
  );
};
