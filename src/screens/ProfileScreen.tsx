import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView, ActivityIndicator, View, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { StyledProps } from '../utils/styledComponents';
import {
  PageHeader,
  LoginBottomSheet,
  SignupBottomSheet,
  EditNicknameBottomSheet,
  type EditNicknameBottomSheetRef,
  SectionTitle,
  SettingsTextButton,
} from '../components';
import { useAuth } from '../store/hooks';
import { calculateBottomPadding } from '../utils/layout';
import { AvatarSection } from './profile/AvatarSection';
import { AccountDetailsSection } from './profile/AccountDetailsSection';
import { AuthPromptSection } from './profile/AuthPromptSection';
import { SettingsSectionCard, SectionWrapper } from './profile/styles';

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const ProfileScreen: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, logout } = useAuth();

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const loginBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const signupBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const editNicknameBottomSheetModalRef = useRef<BottomSheetModal | null>(null);
  const editNicknameBottomSheetRef = useRef<EditNicknameBottomSheetRef | null>(null);

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout.title'),
      t('settings.logout.message'),
      [
        {
          text: t('settings.logout.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout.confirm'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleLoginPress = useCallback(() => {
    signupBottomSheetRef.current?.dismiss();
    loginBottomSheetRef.current?.present();
  }, []);

  const handleSignupPress = useCallback(() => {
    loginBottomSheetRef.current?.dismiss();
    signupBottomSheetRef.current?.present();
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // User will be automatically updated via auth state
  }, []);

  const handleSignupSuccess = useCallback(() => {
    // User will be automatically updated via auth state
  }, []);

  const handleEditNickname = useCallback((currentNickname: string) => {
    editNicknameBottomSheetRef.current?.present(currentNickname);
  }, []);

  // Handle auth errors from Google login
  useEffect(() => {
    if (error && !isLoading) {
      // Check if error is related to Google login (409 conflict or other auth errors)
      let errorMessage = error;
      let errorTitle = t('login.errors.googleLoginFailed.title') || 'Google Login Failed';

      if (error.includes('Email already registered with email/password')) {
        errorMessage = t('login.errors.emailAlreadyRegistered.message') || 'Email already registered with email/password. Please login with email and password.';
        errorTitle = t('login.errors.emailAlreadyRegistered.title') || 'Account Already Exists';
      } else if (error.includes('Invalid Google account')) {
        errorMessage = t('login.errors.invalidGoogleAccount.message') || 'Invalid Google account. Please try again.';
      }

      Alert.alert(errorTitle, errorMessage);
    }
  }, [error, isLoading, t]);

  // Calculate bottom padding for scrollable content
  const bottomPadding = calculateBottomPadding(insets.bottom);

  if (isLoading) {
    return (
      <Container>
        <PageHeader
          icon="person"
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
          showBackButton={false}
          showRightButtons={false}
        />
        <LoadingContainer>
          <ActivityIndicator size="large" />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        icon="person"
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        showBackButton={true}
        showRightButtons={false}
      />
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {isAuthenticated && user ? (
          <>
            <AvatarSection user={user} onEditNickname={handleEditNickname} />

            <AccountDetailsSection user={user} />

            <SectionWrapper>
              <SectionTitle title={t('settings.actions', 'Actions')} icon="options-outline" />
              <SettingsSectionCard>
                <SettingsTextButton
                  label={t('settings.logout.title')}
                  icon="log-out-outline"
                  onPress={handleLogout}
                  variant="destructive"
                  noMarginBottom
                />
              </SettingsSectionCard>
            </SectionWrapper>
          </>
        ) : (
          <AuthPromptSection
            onLoginPress={handleLoginPress}
            onSignupPress={handleSignupPress}
          />
        )}
      </Content>
      <LoginBottomSheet
        bottomSheetRef={loginBottomSheetRef}
        onSignupPress={handleSignupPress}
        onLoginSuccess={handleLoginSuccess}
      />
      <SignupBottomSheet
        bottomSheetRef={signupBottomSheetRef}
        onLoginPress={handleLoginPress}
        onSignupSuccess={handleSignupSuccess}
      />
      <EditNicknameBottomSheet
        ref={editNicknameBottomSheetRef}
        bottomSheetRef={editNicknameBottomSheetModalRef}
        onNicknameUpdated={() => {
          // The sheet already persisted the nickname and updated Redux
        }}
      />
    </Container>
  );
};
