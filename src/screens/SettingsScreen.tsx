import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, View, Text, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import type { StyledProps } from '../utils/styledComponents';
import { uiLogger } from '../utils/Logger';

import {
  PageHeader,
  EditHomeBottomSheet,
  HomeSwitcher,
  InviteMenuBottomSheet,
} from '../components';
import { useSettings, useAuth } from '../store/hooks';
import { useHome } from '../hooks/useHome';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useToast } from '../hooks/useToast';
import { calculateBottomPadding } from '../utils/layout';
import { Member } from '../types/user';
import { userService } from '../services/UserService';
import { homeService } from '../services/HomeService';
import { invitationService } from '../services/InvitationService';
import { HomeSettingsSection } from './settings/HomeSettingsSection';
import { AppearanceSection } from './settings/AppearanceSection';
import { SubscriptionSection } from './settings/SubscriptionSection';

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const VersionText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.regular};
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
  text-align: center;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const { currentHome, deleteHome, updateHomeSettings } = useHome();
  const { gateInvite } = usePlanLimits();
  const editHomeSheetRef = useRef<BottomSheetModal>(null);
  const inviteMenuBottomSheetRef = useRef<BottomSheetModal | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const invitationCode = currentHome?.invitationCode;
  const canShareInventory = currentHome?.settings?.canShareInventory ?? true;
  const canShareTodos = currentHome?.settings?.canShareTodos ?? true;

  const loadMembers = useCallback(async () => {
    if (!currentHome) return;

    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const memberList = await userService.listMembers(
        currentHome.members,
        currentHome.ownerId
      );
      setMembers(memberList);
    } catch (error) {
      uiLogger.error('Error loading members', error);
      setMembersError('Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
    // Reload whenever the membership map changes (live via the homes snapshot)
  }, [currentHome]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMembers();
    }
  }, [isAuthenticated, loadMembers]);

  const handleRemoveMember = useCallback(
    async (memberUserId: string) => {
      if (!currentHome?.id) return;

      const success = await homeService.removeMember(
        currentHome.id,
        memberUserId
      );
      if (success) {
        toast.showToast(
          t('share.members.removeSuccess', 'Member removed successfully'),
          'success'
        );
      } else {
        toast.showToast(
          t('share.members.removeError', 'Failed to remove member'),
          'error'
        );
      }
    },
    [currentHome?.id, toast, t]
  );

  const handleInvitePress = useCallback(async () => {
    if (!(await gateInvite())) return;
    // Lazily create the invitation code on first share
    if (currentHome?.role === 'owner' && user) {
      try {
        await invitationService.ensureInvitation(currentHome, user);
      } catch (error) {
        uiLogger.error('Error ensuring invitation code', error);
      }
    }
    inviteMenuBottomSheetRef.current?.present();
  }, [currentHome, user, gateInvite]);

  const getInvitationLink = useCallback(() => {
    const scheme = 'com.cluttrapp.cluttr';
    return `${scheme}://?inviteCode=${invitationCode}`;
  }, [invitationCode]);

  const handleToggleInventory = useCallback(async () => {
    if (!currentHome?.id) return;

    const success = await updateHomeSettings(currentHome.id, {
      canShareInventory: !canShareInventory,
    });
    if (success) {
      toast.showToast(
        t('share.settings.updateSuccess', 'Settings updated'),
        'success'
      );
    } else {
      toast.showToast(
        t('share.settings.updateError', 'Failed to update settings'),
        'error'
      );
    }
  }, [canShareInventory, currentHome?.id, updateHomeSettings, toast, t]);

  const handleToggleTodos = useCallback(async () => {
    if (!currentHome?.id) return;

    const success = await updateHomeSettings(currentHome.id, {
      canShareTodos: !canShareTodos,
    });
    if (success) {
      toast.showToast(
        t('share.settings.updateSuccess', 'Settings updated'),
        'success'
      );
    } else {
      toast.showToast(
        t('share.settings.updateError', 'Failed to update settings'),
        'error'
      );
    }
  }, [canShareTodos, currentHome?.id, updateHomeSettings, toast, t]);

  const handleLeaveHome = useCallback(() => {
    if (!currentHome || !user?.id) return;

    Alert.alert(
      t('share.members.leaveConfirm.title', 'Leave Home'),
      t(
        'share.members.leaveConfirm.message',
        'Are you sure you want to leave this home?'
      ),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('share.members.leaveConfirm.confirm', 'Leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteHome(currentHome.id);
              if (success) {
                toast.showToast(
                  t('share.members.leaveSuccess', 'Left home successfully'),
                  'success'
                );
              } else {
                toast.showToast(
                  t('share.members.leaveError', 'Failed to leave home'),
                  'error'
                );
              }
            } catch (error) {
              uiLogger.error('Error leaving home', error);
              toast.showToast(
                t('share.members.leaveError', 'Failed to leave home'),
                'error'
              );
            }
          },
        },
      ]
    );
  }, [currentHome, user, deleteHome, toast, t]);

  const handleLoginPress = useCallback(() => {
    router.push('/Profile');
  }, [router]);

  const handleEditHomePress = useCallback(() => {
    editHomeSheetRef.current?.present();
  }, []);

  const handleDeleteHomePress = useCallback(() => {
    if (!currentHome) return;

    Alert.alert(
      t('settings.deleteHome.title'),
      t('settings.deleteHome.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteHome(currentHome.id);
            if (success) {
              toast.showToast(t('settings.deleteHome.success'));
            } else {
              Alert.alert(t('common.error'), t('settings.deleteHome.error'));
            }
          },
        },
      ]
    );
  }, [currentHome, deleteHome, toast, t]);

  const handleAvatarPress = () => {
    router.push('/Profile');
  };

  const handleThemeChange = async (themeId: string) => {
    const success = await updateSettings({ theme: themeId });
    if (!success) {
      uiLogger.error('Failed to update theme setting');
    }
  };

  const handleCurrencyChange = async (currencyId: string) => {
    const success = await updateSettings({ currency: currencyId });
    if (!success) {
      uiLogger.error('Failed to update currency setting');
    }
  };

  const handleLanguageChange = async (languageId: string) => {
    const success = await updateSettings({ language: languageId });
    if (!success) {
      uiLogger.error('Failed to update language setting');
    }
  };

  const handleDarkModeChange = async (value: boolean) => {
    const success = await updateSettings({ darkMode: value });
    if (!success) {
      uiLogger.error('Failed to update dark mode setting');
    }
  };

  // Calculate bottom padding for scrollable content
  const bottomPadding = calculateBottomPadding(insets.bottom);

  // Get version from app.json
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  if (isLoading || !settings) {
    return (
      <Container>
        <PageHeader
          titleComponent={<HomeSwitcher />}
          showBackButton={false}
          showRightButtons={true}
          avatarUrl={user?.avatarUrl}
          onAvatarPress={handleAvatarPress}
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
        titleComponent={<HomeSwitcher />}
        showBackButton={false}
        showRightButtons={true}
        avatarUrl={user?.avatarUrl}
        onAvatarPress={handleAvatarPress}
      />
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {/* Home Settings Section */}
        <HomeSettingsSection
          isAuthenticated={isAuthenticated}
          currentHome={currentHome}
          members={members}
          isLoadingMembers={isLoadingMembers}
          membersError={membersError}
          canShareInventory={canShareInventory}
          canShareTodos={canShareTodos}
          onLoginPress={handleLoginPress}
          onRemoveMember={handleRemoveMember}
          onInvitePress={handleInvitePress}
          onToggleInventory={handleToggleInventory}
          onToggleTodos={handleToggleTodos}
          onEditHomePress={handleEditHomePress}
          onDeleteHomePress={handleDeleteHomePress}
          onLeaveHome={handleLeaveHome}
        />

        {/* Cluttr Pro Subscription Section */}
        {isAuthenticated && <SubscriptionSection />}

        {/* Appearance Section */}
        <AppearanceSection
          settings={settings}
          onThemeChange={handleThemeChange}
          onCurrencyChange={handleCurrencyChange}
          onLanguageChange={handleLanguageChange}
          onDarkModeChange={handleDarkModeChange}
        />

        {/* Version Info */}
        <VersionText>
          {t('settings.versionPrefix')} v{appVersion}
        </VersionText>
      </Content>
      <EditHomeBottomSheet
        bottomSheetRef={editHomeSheetRef}
        home={currentHome || null}
      />
      <InviteMenuBottomSheet
        bottomSheetRef={inviteMenuBottomSheetRef}
        invitationCode={invitationCode || ''}
        invitationLink={invitationCode ? getInvitationLink() : ''}
      />
    </Container>
  );
};
