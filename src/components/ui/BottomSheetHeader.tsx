import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import type { StyledProps } from '../../utils/styledComponents';

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const HeaderLeft = styled.View`
  flex: 1;
`;

const Title = styled.Text`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.xxl}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const Subtitle = styled.Text`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

const CloseButton = styled(TouchableOpacity)`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

export interface BottomSheetHeaderProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  closeIcon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Reusable header component for bottom sheets.
 * Provides a consistent layout with title, subtitle, and close button.
 *
 * @example
 * <BottomSheetHeader
 *   title="Edit Item"
 *   subtitle="Update your item details"
 *   onClose={() => sheetRef.current?.dismiss()}
 * />
 */
export const BottomSheetHeader: React.FC<BottomSheetHeaderProps> = ({
  title,
  subtitle,
  onClose,
  closeIcon = 'close',
}) => {
  const theme = useTheme();

  return (
    <Header>
      <HeaderLeft>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </HeaderLeft>
      <CloseButton onPress={onClose}>
        <Ionicons name={closeIcon} size={20} color={theme.colors.textSecondary} />
      </CloseButton>
    </Header>
  );
};
