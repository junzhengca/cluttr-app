import { View } from 'react-native';
import styled from 'styled-components/native';
import type { StyledProps } from '../../utils/styledComponents';

export const SettingsSectionCard = styled(View)`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;
