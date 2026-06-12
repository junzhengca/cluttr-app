import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import type { StyledProps } from '../../utils/styledComponents';
import { Button } from '../../components';
import {
  SettingsSectionCard,
  SectionWrapper,
  ProfileCardContent,
  AvatarContainer,
  AvatarPlaceholder,
} from './styles';

const AuthButtonContainer = styled(View)`
  width: 100%;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  align-items: center;
`;

const ButtonWrapper = styled(View)`
  width: 100%;
  max-width: 300px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const AuthTitle = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.xl}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
  text-align: center;
`;

const AuthSubtitle = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
  text-align: center;
`;

interface AuthPromptSectionProps {
  onLoginPress: () => void;
  onSignupPress: () => void;
}

export const AuthPromptSection: React.FC<AuthPromptSectionProps> = ({
  onLoginPress,
  onSignupPress,
}) => {
  const { t } = useTranslation();

  return (
    <SectionWrapper>
      <SettingsSectionCard>
        <ProfileCardContent>
          <AvatarContainer disabled={true}>
            <AvatarPlaceholder>
              <Ionicons name="person" size={50} color="white" />
            </AvatarPlaceholder>
          </AvatarContainer>
          <AuthTitle>{t('profile.auth.title')}</AuthTitle>
          <AuthSubtitle>{t('profile.auth.subtitle')}</AuthSubtitle>
          <AuthButtonContainer>
            <ButtonWrapper>
              <Button
                label={t('login.submit')}
                onPress={onLoginPress}
                variant="primary"
              />
            </ButtonWrapper>
            <ButtonWrapper>
              <Button
                label={t('signup.submit')}
                onPress={onSignupPress}
                variant="secondary"
              />
            </ButtonWrapper>
          </AuthButtonContainer>
        </ProfileCardContent>
      </SettingsSectionCard>
    </SectionWrapper>
  );
};
