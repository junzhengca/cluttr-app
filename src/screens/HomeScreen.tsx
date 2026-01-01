import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ScrollView, ActivityIndicator, View } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StyledProps } from '../utils/styledComponents';

import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { CategorySelector } from '../components/CategorySelector';
import { SummaryCards } from '../components/SummaryCards';
import { RecentlyAdded } from '../components/RecentlyAdded';
import { EmptyState } from '../components/EmptyState';
import { LoginBottomSheet } from '../components/LoginBottomSheet';
import { SignupBottomSheet } from '../components/SignupBottomSheet';
import { EnableSyncBottomSheet } from '../components/EnableSyncBottomSheet';
import { InventoryItem } from '../types/inventory';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { useInventory, useSelectedCategory, useAuth, useSync } from '../store/hooks';
import { calculateBottomPadding } from '../utils/layout';
import * as SecureStore from 'expo-secure-store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { items, loading: isLoading, loadItems } = useInventory();
  const { setHomeCategory, setInventoryCategory } = useSelectedCategory();
  const { user, isAuthenticated } = useAuth();
  const { isSyncEnabled } = useSync();
  const loginBottomSheetRef = useRef<BottomSheetModal>(null);
  const signupBottomSheetRef = useRef<BottomSheetModal>(null);
  const enableSyncBottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleLoginSuccess = async () => {
    // Always show the enable sync prompt after login
    enableSyncBottomSheetRef.current?.present();
  };

  const handleSignupSuccess = async () => {
    // Check if we should show the enable sync prompt
    if (isSyncEnabled) {
      return;
    }

    // Check if we've already shown the prompt
    const hasShownPrompt = await SecureStore.getItemAsync('has_shown_sync_prompt');
    if (hasShownPrompt === 'true') {
      return;
    }

    // Show the enable sync prompt
    enableSyncBottomSheetRef.current?.present();
  };

  const handleSyncPromptSkip = async () => {
    // Mark that we've shown the prompt
    await SecureStore.setItemAsync('has_shown_sync_prompt', 'true');
  };

  const handleSyncPromptEnable = async () => {
    // Mark that we've shown the prompt
    await SecureStore.setItemAsync('has_shown_sync_prompt', 'true');
  };

  // Filter items based on selected category and search query
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (item) => item.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.location.toLowerCase().includes(lowerQuery) ||
          item.detailedLocation.toLowerCase().includes(lowerQuery) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, items]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setHomeCategory(categoryId);
  };

  // Sync context when component mounts or selectedCategory changes
  useEffect(() => {
    setHomeCategory(selectedCategory);
  }, [selectedCategory, setHomeCategory]);

  const handleItemPress = (item: InventoryItem) => {
    // Navigate to ItemDetails in RootStack
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate('ItemDetails', { itemId: item.id });
    }
  };

  const handleViewAll = () => {
    // Set the inventory category to the currently selected category
    setInventoryCategory(selectedCategory);
    // Navigate to InventoryTab - get the tab navigator (parent of HomeStack)
    const tabNavigation = navigation.getParent<BottomTabNavigationProp<TabParamList>>();
    if (tabNavigation) {
      tabNavigation.navigate('InventoryTab', { screen: 'Inventory' });
    }
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleAvatarPress = () => {
    console.log('Avatar pressed, isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      // Navigate to Profile - need to use parent navigator (RootStack)
      const rootNavigation = navigation.getParent();
      if (rootNavigation) {
        rootNavigation.navigate('Profile');
      }
    } else {
      console.log('Presenting login bottom sheet, ref:', loginBottomSheetRef.current);
      loginBottomSheetRef.current?.present();
    }
  };

  const handleSignupPress = () => {
    loginBottomSheetRef.current?.dismiss();
    signupBottomSheetRef.current?.present();
  };

  const handleLoginPress = () => {
    signupBottomSheetRef.current?.dismiss();
    loginBottomSheetRef.current?.present();
  };

  // Calculate bottom padding for scrollable content
  const bottomPadding = calculateBottomPadding(insets.bottom);

  if (isLoading) {
    return (
      <Container>
        <PageHeader
          icon="home"
          title={t('home.title')}
          subtitle={t('home.subtitle')}
          avatarUrl={user?.avatarUrl}
          onSettingsPress={handleSettingsPress}
          onAvatarPress={handleAvatarPress}
        />
        <LoadingContainer>
          <ActivityIndicator size="large" />
        </LoadingContainer>
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
        <EnableSyncBottomSheet
          bottomSheetRef={enableSyncBottomSheetRef}
          onSkip={handleSyncPromptSkip}
          onEnableSync={handleSyncPromptEnable}
        />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        icon="home"
        title={t('home.title')}
        subtitle={t('home.subtitle')}
        avatarUrl={user?.avatarUrl}
        onSettingsPress={handleSettingsPress}
        onAvatarPress={handleAvatarPress}
      />
      <Content
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
      >
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        {filteredItems.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title={t('home.empty.title')}
            description={t('home.empty.description')}
          />
        ) : (
          <>
            <SummaryCards items={filteredItems} />
            <RecentlyAdded
              items={filteredItems}
              maxItems={3}
              onItemPress={handleItemPress}
              onViewAll={handleViewAll}
            />
          </>
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
      <EnableSyncBottomSheet
        bottomSheetRef={enableSyncBottomSheetRef}
        onSkip={handleSyncPromptSkip}
        onEnableSync={handleSyncPromptEnable}
      />
    </Container>
  );
};

