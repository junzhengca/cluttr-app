import React, { useState, useCallback, useRef } from 'react';
import { View, Alert, ScrollView, Animated, Dimensions, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import type { StyledProps } from '../utils/styledComponents';
import {
  PageHeader,
  PermissionConfigPanel,
  EmptyState,
  Button,
  MemberList,
  InviteMenuBottomSheet,
  HomeCard,
} from '../components';
import { calculateBottomPadding } from '../utils/layout';
import { RootStackParamList } from '../navigation/types';
import { useAuth, useAppDispatch, useAppSelector } from '../store/hooks';
import { useToast } from '../hooks/useToast';

import { Member } from '../types/api';
import { useHome } from '../hooks/useHome';



const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const AnimatedContainer = styled(Animated.View)`
  flex: 1;
  flex-direction: row;
  width: ${SCREEN_WIDTH * 2}px;
`;

const PageView = styled(View)`
  width: ${SCREEN_WIDTH}px;
  flex: 1;
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const LoginPromptContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const ButtonContainer = styled(View)`
  width: 100%;
  max-width: 300px;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const LeaveHomeButton = styled(TouchableOpacity)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xl}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const LeaveHomeText = styled(Text)`
  color: ${({ theme }: StyledProps) => theme.colors.error || '#ff4444'};
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  margin-left: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ShareScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated, getApiClient } = useAuth();

  const { homes, currentHome, switchHome } = useHome();
  const { showToast } = useToast();
  const inviteMenuBottomSheetRef = useRef<BottomSheetModal | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const invitationCode = currentHome?.invitationCode;
  const canShareInventory = currentHome?.settings?.canShareInventory ?? true;
  const canShareTodos = currentHome?.settings?.canShareTodos ?? true;

  const [isSwitchingHome, setIsSwitchingHome] = useState(false);
  const panAnim = useRef(new Animated.Value(0)).current;

  const loadMembers = useCallback(async () => {
    if (!currentHome?.id) return;

    // If home is pending creation, don't fetch from server yet
    if (currentHome.pendingCreate) {
      setMembers([]);
      return;
    }

    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const apiClient = getApiClient();
      if (!apiClient) return;

      const response = await apiClient.listMembers(currentHome.id);
      setMembers(response.members);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembersError('Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentHome?.id, currentHome?.pendingCreate, getApiClient]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadMembers();
    }
  }, [isAuthenticated, loadMembers]);

  const handleRemoveMember = useCallback(
    async (memberUserId: string) => {
      if (!currentHome?.id) return;

      if (currentHome.pendingCreate) {
        showToast(t('common.syncing', 'Syncing in progress...'), 'info');
        return;
      }

      try {
        const apiClient = getApiClient();
        if (!apiClient) return;

        await apiClient.removeMember(currentHome.id, memberUserId);
        showToast(t('share.members.removeSuccess', 'Member removed successfully'), 'success');
        loadMembers();
      } catch (error) {
        console.error('Error removing member:', error);
        showToast(t('share.members.removeError', 'Failed to remove member'), 'error');
      }
    },
    [currentHome?.id, currentHome?.pendingCreate, getApiClient, loadMembers, showToast, t]
  );

  const handleInvitePress = useCallback(() => {
    if (currentHome?.pendingCreate) {
      showToast(t('common.syncing', 'Syncing in progress...'), 'info');
      return;
    }
    inviteMenuBottomSheetRef.current?.present();
  }, [currentHome?.pendingCreate, showToast, t]);

  const getInvitationLink = useCallback(() => {
    const scheme = 'com.cluttrapp.cluttr'; // Matches app.json scheme
    return `${scheme}://?inviteCode=${invitationCode}`;
  }, [invitationCode]);

  const handleToggleInventory = useCallback(async () => {
    if (!currentHome?.id) return;

    if (currentHome.pendingCreate) {
      showToast(t('common.syncing', 'Syncing in progress...'), 'info');
      return;
    }

    const newValue = !canShareInventory;

    try {
      const apiClient = getApiClient();
      if (!apiClient) return;

      await apiClient.updateHomeSettings(currentHome.id, { canShareInventory: newValue });
      showToast(t('share.settings.updateSuccess', 'Settings updated'), 'success');
      // HomeService will sync and update settings automatically? 
      // For now we might need to manually trigger a sync or wait for background sync
    } catch (error) {
      console.error('Error updating inventory settings:', error);
      showToast(t('share.settings.updateError', 'Failed to update settings'), 'error');
    }
  }, [canShareInventory, currentHome?.id, currentHome?.pendingCreate, getApiClient, showToast, t]);

  const handleToggleTodos = useCallback(async () => {
    if (!currentHome?.id) return;

    if (currentHome.pendingCreate) {
      showToast(t('common.syncing', 'Syncing in progress...'), 'info');
      return;
    }

    const newValue = !canShareTodos;

    try {
      const apiClient = getApiClient();
      if (!apiClient) return;

      await apiClient.updateHomeSettings(currentHome.id, { canShareTodos: newValue });
      showToast(t('share.settings.updateSuccess', 'Settings updated'), 'success');
    } catch (error) {
      console.error('Error updating todos settings:', error);
      showToast(t('share.settings.updateError', 'Failed to update settings'), 'error');
    }
  }, [canShareTodos, currentHome?.id, currentHome?.pendingCreate, getApiClient, showToast, t]);

  const handleLeaveHome = useCallback(() => {
    Alert.alert(
      t('share.members.leaveConfirm.title', 'Leave Home'),
      t('share.members.leaveConfirm.message', 'Are you sure you want to leave this home?'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('share.members.leaveConfirm.confirm', 'Leave'),
          style: 'destructive',
          onPress: () => {
            showToast('Leave home: Mock mode - not implemented', 'info');
          },
        },
      ]
    );
  }, [showToast, t]);

  const handleAvatarPress = () => {
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate('Profile');
    }
  };

  const handleLoginPress = () => {
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate('Profile');
    }
  };

  const handleSwitchHomePress = () => {
    setIsSwitchingHome(true);
    Animated.timing(panAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleBackToSharePress = () => {
    Animated.timing(panAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsSwitchingHome(false);
    });
  };

  const handleAccountSelect = (homeId: string) => {
    switchHome(homeId);
    handleBackToSharePress();
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <PageHeader
          icon="share-outline"
          title={t('share.title')}
          subtitle={t('share.subtitle')}
          showBackButton={false}
          showRightButtons={false}
        />
        <Content style={{ paddingBottom: calculateBottomPadding(insets.bottom) }}>
          <LoginPromptContainer>
            <EmptyState
              icon="lock-closed"
              title={t('share.loginRequired.title')}
              description={t('share.loginRequired.description')}
            />
            <ButtonContainer>
              <Button
                onPress={handleLoginPress}
                label={t('login.submit')}
                icon="log-in"
                variant="primary"
              />
            </ButtonContainer>
          </LoginPromptContainer>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        icon={isSwitchingHome ? "chevron-back" : "share-outline"}
        title={isSwitchingHome ? t('share.home.switchTitle') : t('share.title')}
        subtitle={isSwitchingHome ? t('share.home.switchSubtitle') : t('share.subtitle')}
        showBackButton={isSwitchingHome}
        onBackPress={isSwitchingHome ? handleBackToSharePress : undefined}
        showRightButtons={!isSwitchingHome}
        avatarUrl={user?.avatarUrl}
        ownerAvatarUrl={!isSwitchingHome && currentHome?.role === 'owner' ? currentHome.owner?.avatarUrl : undefined}
        onAvatarPress={handleAvatarPress}
      />

      <AnimatedContainer style={{ transform: [{ translateX: panAnim }] }}>
        {/* Main Share View */}
        <PageView>
          <Content
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: calculateBottomPadding(insets.bottom) }}
          >
            <HomeCard
              name={currentHome?.name || t('share.home.currentHome')}
              isActive={true}
              showSwitchButton={true}
              onSwitchPress={handleSwitchHomePress}
              canShareInventory={canShareInventory}
              canShareTodos={canShareTodos}
            />

            <MemberList
              owner={currentHome?.owner ? {
                userId: currentHome.owner.userId,
                email: currentHome.owner.email,
                nickname: currentHome.owner.nickname,
                avatarUrl: currentHome.owner.avatarUrl,
              } : null}
              members={members}
              isLoading={isLoadingMembers}
              error={membersError}
              onRemoveMember={currentHome?.role === 'owner' ? handleRemoveMember : undefined}
              onInvitePress={handleInvitePress}
              showInviteButton={currentHome?.role === 'owner'}
            />

            {currentHome?.role === 'member' && (
              <LeaveHomeButton
                onPress={handleLeaveHome}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error || '#ff4444'} />
                <LeaveHomeText>{t('share.members.leaveHome', 'Leave Home')}</LeaveHomeText>
              </LeaveHomeButton>
            )}
            {currentHome?.role === 'owner' && (
              <PermissionConfigPanel
                canShareInventory={canShareInventory}
                canShareTodos={canShareTodos}
                onToggleInventory={handleToggleInventory}
                onToggleTodos={handleToggleTodos}
                isLoading={false}
              />
            )}
          </Content>
        </PageView>

        {/* Switch Home View */}
        <PageView>
          <Content
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: calculateBottomPadding(insets.bottom) }}
          >
            {homes.map((home) => (
              <HomeCard
                key={home.id}
                name={home.name}
                isActive={currentHome?.id === home.id}
                onPress={() => handleAccountSelect(home.id)}
                canShareInventory={home.settings?.canShareInventory}
                canShareTodos={home.settings?.canShareTodos}
              />
            ))}

            {homes.length === 0 && (
              <EmptyState
                icon="home-outline"
                title={t('share.members.empty.title')}
                description={t('share.members.empty.description')}
              />
            )}
          </Content>
        </PageView>
      </AnimatedContainer>

      <InviteMenuBottomSheet
        bottomSheetRef={inviteMenuBottomSheetRef}
        invitationCode={invitationCode || ''}
        invitationLink={invitationCode ? getInvitationLink() : ''}
      />
    </Container>
  );
};
