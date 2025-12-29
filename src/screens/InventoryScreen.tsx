import React, { useState, useEffect, useMemo } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { CategorySelector } from '../components/CategorySelector';
import { ItemCard } from '../components/ItemCard';
import { InventoryItem } from '../types/inventory';
import { InventoryStackParamList } from '../navigation/types';
import { getAllItems } from '../services/InventoryService';
import { useInventory } from '../contexts/InventoryContext';

type NavigationProp = NativeStackNavigationProp<InventoryStackParamList>;

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.View`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const ListContainer = styled.View`
  flex: 1;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const InventoryScreen: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { setRefreshCallback } = useInventory();

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const allItems = await getAllItems();
      setItems(allItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    setRefreshCallback(loadItems);
  }, [setRefreshCallback]);

  // Filter items based on selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return items;
    }
    return items.filter(
      (item) => item.category === selectedCategory
    );
  }, [selectedCategory, items]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemPress = (item: InventoryItem) => {
    navigation.navigate('ItemDetails', { itemId: item.id });
  };

  const handleSettingsPress = () => {
    // Navigate to Settings - need to use parent navigator
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate('Settings');
    }
  };

  // Calculate bottom padding: nav bar height (60) + margin (16*2) + safe area + extra spacing
  const bottomPadding = 60 + 32 + insets.bottom + 24;

  if (isLoading) {
    return (
      <Container>
        <PageHeader
          icon="list"
          title="所有物品"
          subtitle="加载中..."
          onSettingsPress={handleSettingsPress}
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
        icon="list"
        title="所有物品"
        subtitle={`${filteredItems.length}个宝贝`}
        onSettingsPress={handleSettingsPress}
      />
      <Content>
        <SearchInput />
        <CategorySelector 
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange} 
        />
        <ListContainer>
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ItemCard item={item} onPress={handleItemPress} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomPadding }}
          />
        </ListContainer>
      </Content>
    </Container>
  );
};

