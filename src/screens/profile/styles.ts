import { View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import styled from 'styled-components/native';
import type { StyledProps } from '../../utils/styledComponents';

export const SettingsSectionCard = styled(View)`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

export const SectionWrapper = styled(View)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

export const ProfileCardContent = styled(View)`
  align-items: center;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

export const AvatarContainer = styled(TouchableOpacity)`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  overflow: hidden;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
  border-width: 4px;
  border-color: ${({ theme }: StyledProps) => theme.colors.primary};
`;

export const AvatarImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

export const AvatarPlaceholder = styled(View)`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }: StyledProps) => theme.colors.primaryLight};
  align-items: center;
  justify-content: center;
`;
