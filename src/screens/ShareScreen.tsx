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
import { Member, AccessibleAccount } from '../types/api';
import { setActiveHomeId } from '../store/slices/authSlice';

// Mock data for development
const MOCK_MEMBERS: Member[] = [
  {
    id: 'member1',
    email: 'alice@example.com',
    nickname: 'Alice',
    avatarUrl: undefined,
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
  },
  {
    id: 'member2',
    email: 'bob@example.com',
    nickname: 'Bob',
    avatarUrl: undefined,
    joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
  },
];

const MOCK_INVITATION_CODE = 'ABC123XYZ789';
const MOCK_CAN_SHARE_INVENTORY = true;
const MOCK_CAN_SHARE_TODOS = true;

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
  const { user, isAuthenticated } = useAuth();
  const activeHomeId = useAppSelector((state) => state.auth.activeHomeId);
  const { showToast } = useToast();
  const inviteMenuBottomSheetRef = useRef<BottomSheetModal | null>(null);

  // Using mock data instead of API calls
  const [canShareInventory, setCanShareInventory] = useState(MOCK_CAN_SHARE_INVENTORY);
  const [canShareTodos, setCanShareTodos] = useState(MOCK_CAN_SHARE_TODOS);
  const members = MOCK_MEMBERS;
  const invitationCode = MOCK_INVITATION_CODE;
  const accounts = useAppSelector((state) => state.auth.accessibleAccounts);
  const [isSwitchingHome, setIsSwitchingHome] = useState(false);
  const panAnim = useRef(new Animated.Value(0)).current;

  const currentHome = accounts.find(a =>
    activeHomeId ? a.userId === activeHomeId : a.isOwner
  ) || (user ? { userId: user.id, nickname: user.nickname || user.email, email: user.email, avatarUrl: user.avatarUrl, isOwner: true, createdAt: user.createdAt } : null);

  const handleRemoveMember = useCallback(
    (_memberId: string) => {
      showToast('Remove member: Mock mode - not implemented', 'info');
    },
    [showToast]
  );

  const handleInvitePress = useCallback(() => {
    inviteMenuBottomSheetRef.current?.present();
  }, []);

  const getInvitationLink = useCallback(() => {
    const scheme = 'com.cluttrapp.cluttr'; // Matches app.json scheme
    return `${scheme}://?inviteCode=${invitationCode}`;
  }, [invitationCode]);

  const handleToggleInventory = useCallback(() => {
    const newValue = !canShareInventory;
    setCanShareInventory(newValue);
    showToast(`Inventory sharing ${newValue ? 'enabled' : 'disabled'} (mock mode)`, 'success');
  }, [canShareInventory, showToast]);

  const handleToggleTodos = useCallback(() => {
    const newValue = !canShareTodos;
    setCanShareTodos(newValue);
    showToast(`Todos sharing ${newValue ? 'enabled' : 'disabled'} (mock mode)`, 'success');
  }, [canShareTodos, showToast]);

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

  const handleAccountSelect = (accountId: string) => {
    // If selecting own account, set to null (default)
    const newActiveId = accountId === user?.id ? null : accountId;
    dispatch(setActiveHomeId(newActiveId));
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
        ownerAvatarUrl={!isSwitchingHome && activeHomeId ? accounts.find(a => a.userId === activeHomeId)?.avatarUrl : undefined}
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
              name={currentHome?.nickname || currentHome?.email || t('share.home.currentHome')}
              isActive={true}
              showSwitchButton={true}
              onSwitchPress={handleSwitchHomePress}
              canShareInventory={canShareInventory}
              canShareTodos={canShareTodos}
            />

            <MemberList
              owner={currentHome ? {
                id: currentHome.userId,
                email: currentHome.email,
                nickname: currentHome.nickname,
                avatarUrl: currentHome.avatarUrl,
                createdAt: (currentHome as AccessibleAccount).joinedAt || (currentHome as { createdAt?: string }).createdAt,
              } : null}
              members={members}
              isLoading={false}
              error={null}
              onRemoveMember={currentHome?.isOwner ? handleRemoveMember : undefined}
              onInvitePress={handleInvitePress}
              showInviteButton={currentHome?.isOwner}
            />

            {!currentHome?.isOwner && (
              <LeaveHomeButton
                onPress={handleLeaveHome}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error || '#ff4444'} />
                <LeaveHomeText>{t('share.members.leaveHome', 'Leave Home')}</LeaveHomeText>
              </LeaveHomeButton>
            )}
            {currentHome?.isOwner && (
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
            {accounts.map((account, _index) => (
              <HomeCard
                key={account.userId}
                name={account.nickname || account.email}
                isActive={activeHomeId ? account.userId === activeHomeId : account.isOwner}
                onPress={() => handleAccountSelect(account.userId)}
                canShareInventory={account.permissions?.canShareInventory}
                canShareTodos={account.permissions?.canShareTodos}
              />
            ))}

            {accounts.length === 0 && (
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
