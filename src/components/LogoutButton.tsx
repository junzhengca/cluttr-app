import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import type { StyledProps } from '../utils/styledComponents';

interface LogoutButtonProps {
  onPress?: () => void;
}

const Button = styled(TouchableOpacity)`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
  elevation: 1;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
`;

const IconContainer = styled(View)`
  width: 24px;
  height: 24px;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
`;

const Icon = styled(Ionicons)`
  color: ${({ theme }: StyledProps) => theme.colors.error};
`;

const ButtonText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.error};
  flex: 1;
`;

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onPress }) => {
  return (
    <Button onPress={onPress}>
      <IconContainer>
        <Icon name="log-out-outline" size={20} />
      </IconContainer>
      <ButtonText>Log out</ButtonText>
    </Button>
  );
};

