import React, { useState, useEffect, useRef } from 'react';
import { Alert, ActivityIndicator, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useSettings } from '../contexts/SettingsContext';
import { useInventory } from '../contexts/InventoryContext';
import { RootStackParamList } from '../navigation/types';
import { InventoryItem } from '../types/inventory';
import { getItemById, deleteItem } from '../services/InventoryService';
import { getCategoryById } from '../services/CategoryService';
import { locations } from '../data/locations';
import { getCurrencySymbol } from '../components/CurrencySelector';
import { EditItemBottomSheet } from '../components/EditItemBottomSheet';
import { PageHeader } from '../components/PageHeader';
import { BottomActionBar } from '../components/BottomActionBar';
import { formatDate, formatPrice } from '../utils/formatters';
import { getLightColor } from '../utils/colors';
import { calculateBottomActionBarPadding } from '../utils/layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = {
  key: string;
  name: 'ItemDetails';
  params: { itemId: string };
};

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const ScrollContainer = styled.View`
  flex: 1;
  overflow: hidden;
`;

const Content = styled(ScrollView)`
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const IconContainer = styled.View<{ backgroundColor: string }>`
  width: 100px;
  height: 100px;
  border-radius: ${({ theme }) => theme.borderRadius.xl}px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 4;
`;

const HeaderSection = styled.View`
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const CategoryText = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.md}px;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const Section = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  padding: ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

const SectionTitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const PropertyRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${({ theme }) => theme.spacing.sm}px;
  border-bottom-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderLight};
`;

const PropertyRowLast = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${({ theme }) => theme.spacing.sm}px;
`;

const PropertyIcon = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.md}px;
`;

const PropertyContent = styled.View`
  flex: 1;
`;

const PropertyLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 2px;
`;

const PropertyValue = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.md}px;
  color: ${({ theme }) => theme.colors.text};
`;

const TagsContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Tag = styled.View`
  background-color: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.sm}px;
`;

const TagText = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl}px;
  padding-bottom: 120px;
`;

const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.md}px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;


export const ItemDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { refreshItems } = useInventory();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { itemId } = route.params;
  const insets = useSafeAreaInsets();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const editBottomSheetRef = useRef<BottomSheetModal>(null);

  const currencySymbol = getCurrencySymbol(settings.currency);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    setIsLoading(true);
    try {
      const itemData = await getItemById(itemId);
      if (itemData) {
        setItem(itemData);
        const location = locations.find((loc) => loc.id === itemData.location);
        setLocationName(location?.name || itemData.location);
        
        // Load category name
        const category = await getCategoryById(itemData.category);
        setCategoryName(category?.name || '未分类');
      } else {
        Alert.alert('错误', '物品不存在');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert('错误', '加载物品信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('确认删除', '确定要删除这个物品吗？此操作无法撤销。', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const success = await deleteItem(itemId);
            if (success) {
              refreshItems();
              navigation.goBack();
            } else {
              Alert.alert('错误', '删除失败，请重试');
            }
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('错误', '删除失败，请重试');
          }
        },
      },
    ]);
  };

  const handleModify = () => {
    editBottomSheetRef.current?.present();
  };

  const handleItemUpdated = () => {
    loadItem();
    refreshItems();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Calculate bottom padding for action bar
  const bottomPadding = calculateBottomActionBarPadding(insets.bottom);

  if (isLoading) {
    return (
      <Container>
        <PageHeader
          icon="cube"
          title="物品详情"
          subtitle="加载中..."
          showBackButton={true}
          onBackPress={handleClose}
          showRightButtons={false}
        />
        <LoadingContainer>
          <ActivityIndicator size="large" />
        </LoadingContainer>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container>
        <PageHeader
          icon="cube"
          title="物品详情"
          subtitle="物品不存在"
          showBackButton={true}
          onBackPress={handleClose}
          showRightButtons={false}
        />
        <ErrorContainer>
          <ErrorText>物品不存在</ErrorText>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        icon={item.icon}
        title={item.name}
        subtitle={locationName}
        showBackButton={true}
        onBackPress={handleClose}
        showRightButtons={false}
      />

      <ScrollContainer>
        <Content contentContainerStyle={{ paddingBottom: bottomPadding }}>
        <HeaderSection>
          <IconContainer backgroundColor={getLightColor(item.iconColor)}>
            <Ionicons name={item.icon} size={48} color={item.iconColor} />
          </IconContainer>
          <CategoryText>{categoryName}</CategoryText>
        </HeaderSection>

        {/* Value Information Section */}
        <Section>
          <SectionTitle>价值信息</SectionTitle>
          <PropertyRow>
            <PropertyIcon>
              <Ionicons name="pricetag" size={18} color={theme.colors.textSecondary} />
            </PropertyIcon>
            <PropertyContent>
              <PropertyLabel>估值</PropertyLabel>
              <PropertyValue>{formatPrice(item.price, currencySymbol)}</PropertyValue>
            </PropertyContent>
          </PropertyRow>
          <PropertyRowLast>
            <PropertyIcon>
              <Ionicons name="calendar" size={18} color={theme.colors.textSecondary} />
            </PropertyIcon>
            <PropertyContent>
              <PropertyLabel>购买时间</PropertyLabel>
              <PropertyValue>{formatDate(item.purchaseDate)}</PropertyValue>
            </PropertyContent>
          </PropertyRowLast>
        </Section>

        {/* Location Information Section */}
        <Section>
          <SectionTitle>位置信息</SectionTitle>
          <PropertyRow>
            <PropertyIcon>
              <Ionicons name="home" size={18} color={theme.colors.textSecondary} />
            </PropertyIcon>
            <PropertyContent>
              <PropertyLabel>所在位置</PropertyLabel>
              <PropertyValue>{locationName}</PropertyValue>
            </PropertyContent>
          </PropertyRow>
          <PropertyRowLast>
            <PropertyIcon>
              <Ionicons name="location" size={18} color={theme.colors.textSecondary} />
            </PropertyIcon>
            <PropertyContent>
              <PropertyLabel>详细位置</PropertyLabel>
              <PropertyValue>{item.detailedLocation || '未设置'}</PropertyValue>
            </PropertyContent>
          </PropertyRowLast>
        </Section>

        {/* Quantity Information Section */}
        <Section>
          <SectionTitle>数量信息</SectionTitle>
          <PropertyRowLast>
            <PropertyIcon>
              <Ionicons name="cube" size={18} color={theme.colors.textSecondary} />
            </PropertyIcon>
            <PropertyContent>
              <PropertyLabel>数量</PropertyLabel>
              <PropertyValue>{item.amount || 1}</PropertyValue>
            </PropertyContent>
          </PropertyRowLast>
        </Section>

        {/* Expiry Date Section */}
        {item.expiryDate && (
          <Section>
            <SectionTitle>过期信息</SectionTitle>
            <PropertyRowLast>
              <PropertyIcon>
                <Ionicons name="hourglass" size={18} color={theme.colors.textSecondary} />
              </PropertyIcon>
              <PropertyContent>
                <PropertyLabel>过期日期</PropertyLabel>
                <PropertyValue>{formatDate(item.expiryDate)}</PropertyValue>
              </PropertyContent>
            </PropertyRowLast>
          </Section>
        )}

        {/* Tags Section */}
        {item.tags && item.tags.length > 0 && (
          <Section>
            <SectionTitle>标签</SectionTitle>
            <TagsContainer>
              {item.tags.map((tag, index) => (
                <Tag key={index}>
                  <TagText>#{tag}</TagText>
                </Tag>
              ))}
            </TagsContainer>
          </Section>
        )}
      </Content>
      </ScrollContainer>

      {/* Fixed Bottom Bar */}
      <BottomActionBar
        actions={[
          {
            label: '删除',
            onPress: handleDelete,
            variant: 'danger',
            icon: <Ionicons name="trash-outline" size={18} color={theme.colors.error} />,
          },
          {
            label: '修改',
            onPress: handleModify,
            variant: 'filled',
            icon: <Ionicons name="create-outline" size={18} color={theme.colors.surface} />,
          },
        ]}
      />

      <EditItemBottomSheet
        bottomSheetRef={editBottomSheetRef}
        itemId={itemId}
        onItemUpdated={handleItemUpdated}
      />
    </Container>
  );
};

