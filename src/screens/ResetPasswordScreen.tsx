import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';

import type { StyledProps } from '../utils/styledComponents';
import { AuthTextInput, GlassButton } from '../components';
import { useAuth, useSettings } from '../store/hooks';
import { useTheme } from '../theme/ThemeProvider';

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const ScrollContent = styled(ScrollView).attrs({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  keyboardShouldPersistTaps: 'handled',
})`
  flex: 1;
`;

const Content = styled(View)`
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.xl}px;
  align-items: center;
`;

const LogoContainer = styled(View)`
  align-items: center;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const MascotPlaceholder = styled(View)`
  width: 120px;
  height: 120px;
  border-radius: 28px;
  background-color: ${({ theme }: StyledProps) => theme.colors.primaryLightest};
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const TitleText = styled(Text)`
  font-size: 28px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  text-align: center;
`;

const SubtitleText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  text-align: center;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const FormContainer = styled(View)`
  width: 100%;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const InputSpacing = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const ButtonContainer = styled(View)`
  width: 100%;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const GhostButton = styled(TouchableOpacity)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const GhostButtonText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.primary};
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.medium};
`;

export const ResetPasswordScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { settings } = useSettings();
  const isDark = settings?.darkMode;
  // verifyPasswordReset is no longer available – Firebase handles password
  // reset via email link. This screen is kept for navigation compatibility
  // but is no longer reachable from the ForgotPassword flow.
  const { isLoading, error, clearError } = useAuth();

  // The auth error is shared across auth flows — drop anything left over from
  // a failed login attempt so it doesn't render on this screen.
  useEffect(() => {
    clearError();
  }, [clearError]);

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isSubmitting && !isLoading) {
      setIsSubmitting(false);
      if (!error) {
        // On success, notify user and navigate to login
        Alert.alert(
          t('login.passwordReset.successTitle'),
          t('login.passwordReset.successMessage'),
          [{ text: 'OK', onPress: () => router.dismissTo('/login') }]
        );
      }
    }
  }, [isSubmitting, isLoading, error, router, t]);

  const handleSubmit = useCallback(() => {
    if (!code.trim() || !newPassword.trim() || isLoading) {
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('signup.errors.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);
    // No-op: Firebase password resets are handled via email link, not OTP.
    // This handler is kept to avoid breaking the UI while the screen is
    // removed from the navigation flow.
    setIsSubmitting(false);
  }, [code, newPassword, isLoading, t]);

  return (
    <Container>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollContent
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
        >
          <Content>
            <LogoContainer>
              <MascotPlaceholder>
                <Image
                  source={require('../../assets/logo-transparent.png')}
                  style={{ width: 80, height: 80 }}
                  resizeMode="contain"
                />
              </MascotPlaceholder>
              <TitleText>{t('login.passwordReset.verifyTitle')}</TitleText>
              <SubtitleText>
                {t('login.passwordReset.verifySubtitle', { email })}
              </SubtitleText>
            </LogoContainer>

            <FormContainer>
              <InputSpacing>
                <AuthTextInput
                  icon="key-outline"
                  placeholder={t('login.passwordReset.codePlaceholder')}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </InputSpacing>

              <InputSpacing>
                <AuthTextInput
                  ref={passwordRef}
                  icon="lock-closed-outline"
                  placeholder={t('login.passwordReset.passwordPlaceholder')}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  onSubmitEditing={handleSubmit}
                  error={!!error}
                  errorMessage={error || undefined}
                />
              </InputSpacing>

              <ButtonContainer>
                <GlassButton
                  text={t('login.passwordReset.submitVerify')}
                  onPress={handleSubmit}
                  icon="checkmark-circle-outline"
                  loading={isLoading}
                  disabled={isLoading || !code.trim() || !newPassword.trim()}
                  tintColor={theme.colors.primary}
                  textColor={theme.colors.surface}
                />
              </ButtonContainer>

              <GhostButton onPress={() => router.back()}>
                <GhostButtonText>{t('common.cancel')}</GhostButtonText>
              </GhostButton>
            </FormContainer>
          </Content>
        </ScrollContent>
      </KeyboardAvoidingView>
    </Container>
  );
};
