import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useSettings } from '../contexts/SettingsContext';
import { useInventory } from '../contexts/InventoryContext';
import { InventoryStackParamList } from '../navigation/types';
import { InventoryItem } from '../types/inventory';
import { getItemById, deleteItem } from '../services/InventoryService';
import { getCategoryById } from '../services/CategoryService';
import { locations } from '../data/locations';
import { getCurrencySymbol } from '../components/CurrencySelector';
import { EditItemBottomSheet } from '../components/EditItemBottomSheet';

type NavigationProp = NativeStackNavigationProp<InventoryStackParamList>;
type RouteProp = {
  key: string;
  name: 'ItemDetails';
  params: { itemId: string };
};

const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.spacing.lg}px;
  padding-top: ${({ theme }) => theme.spacing.xl}px;
`;

const CloseButton = styled(TouchableOpacity)`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg}px;
`;

const IconContainer = styled.View<{ backgroundColor: string }>`
  width: 120px;
  height: 120px;
  border-radius: ${({ theme }) => theme.borderRadius.lg}px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  align-items: center;
  justify-content: center;
  align-self: center;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const ItemName = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.xxl}px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const LocationText = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.md}px;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const InfoCardsContainer = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const InfoCard = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
`;

const InfoCardLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const InfoCardValue = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.lg}px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const TagsContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const Tag = styled.View`
  background-color: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
  padding-horizontal: ${({ theme }) => theme.spacing.md}px;
  padding-vertical: ${({ theme }) => theme.spacing.xs}px;
`;

const TagText = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ActionsContainer = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.md}px;
  margin-bottom: ${({ theme }) => theme.spacing.xl}px;
`;

const ActionButton = styled(TouchableOpacity)<{ variant: 'outlined' | 'filled' }>`
  flex: 1;
  border-radius: ${({ theme }) => theme.borderRadius.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  background-color: ${({ theme, variant }) =>
    variant === 'filled' ? theme.colors.textSecondary : theme.colors.surface};
  border-width: ${({ variant }) => (variant === 'outlined' ? 1 : 0)}px;
  border-color: ${({ theme }) => theme.colors.border};
`;

const ActionButtonText = styled.Text<{ variant: 'outlined' | 'filled' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, variant }) =>
    variant === 'filled' ? theme.colors.surface : theme.colors.text};
  margin-left: ${({ variant, theme }) => (variant === 'filled' ? theme.spacing.sm : 0)}px;
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
`;

const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.fontSize.md}px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const formatDate = (dateString?: string): string => {
  if (!dateString) return '未设置';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '未设置';
  }
};

const getLightColor = (color: string) => {
  if (color.startsWith('#')) {
    return color + '15';
  }
  return color;
};

export const ItemDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const { settings } = useSettings();
  const { refreshItems } = useInventory();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { itemId } = route.params;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');
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

  const formatPrice = (price: number) => {
    return `${currencySymbol} ${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Container>
        <Header>
          <CloseButton onPress={handleClose}>
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </CloseButton>
        </Header>
        <LoadingContainer>
          <ActivityIndicator size="large" />
        </LoadingContainer>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container>
        <Header>
          <CloseButton onPress={handleClose}>
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </CloseButton>
        </Header>
        <ErrorContainer>
          <ErrorText>物品不存在</ErrorText>
          <ActionButton variant="outlined" onPress={handleClose}>
            <ActionButtonText variant="outlined">返回</ActionButtonText>
          </ActionButton>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <CloseButton onPress={handleClose}>
          <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
        </CloseButton>
      </Header>

      <Content>
        <IconContainer backgroundColor={getLightColor(item.iconColor)}>
          <Ionicons name={item.icon} size={56} color={item.iconColor} />
        </IconContainer>

        <ItemName>{item.name}</ItemName>
        <LocationText>
          {locationName} • {item.detailedLocation || '未设置'}
        </LocationText>

        <InfoCardsContainer>
          <InfoCard>
            <InfoCardLabel>估值</InfoCardLabel>
            <InfoCardValue>{formatPrice(item.price)}</InfoCardValue>
          </InfoCard>
          <InfoCard>
            <InfoCardLabel>购买时间</InfoCardLabel>
            <InfoCardValue>{formatDate(item.purchaseDate)}</InfoCardValue>
          </InfoCard>
        </InfoCardsContainer>

        {item.tags && item.tags.length > 0 && (
          <TagsContainer>
            {item.tags.map((tag, index) => (
              <Tag key={index}>
                <TagText>#{tag}</TagText>
              </Tag>
            ))}
          </TagsContainer>
        )}

        <ActionsContainer>
          <ActionButton variant="outlined" onPress={handleDelete}>
            <ActionButtonText variant="outlined">删除</ActionButtonText>
          </ActionButton>
          <ActionButton variant="filled" onPress={handleModify}>
            <Ionicons name="create-outline" size={20} color={theme.colors.surface} />
            <ActionButtonText variant="filled">修改</ActionButtonText>
          </ActionButton>
        </ActionsContainer>
      </Content>

      <EditItemBottomSheet
        bottomSheetRef={editBottomSheetRef}
        itemId={itemId}
        onItemUpdated={handleItemUpdated}
      />
    </Container>
  );
};

