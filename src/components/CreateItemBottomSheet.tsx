import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TouchableOpacity, Alert, View, ScrollView, Text } from 'react-native';
import styled from 'styled-components/native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import type { StyledProps } from '../utils/styledComponents';
import { Category } from '../types/inventory';
import { locations } from '../data/locations';
import { getAllCategories } from '../services/CategoryService';
import { createItem } from '../services/InventoryService';
import { filterItemCategories } from '../utils/categoryUtils';
import { CategoryManagerBottomSheet } from './CategoryManagerBottomSheet';

const Backdrop = styled(BottomSheetBackdrop)`
  background-color: rgba(0, 0, 0, 0.5);
`;

const Header = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const HeaderLeft = styled(View)`
  flex: 1;
`;

const Title = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.xxl}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const Subtitle = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

const CloseButton = styled(TouchableOpacity)`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

const FormSection = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const Label = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const Input = styled(BottomSheetTextInput)`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
`;

const CategorySection = styled(View)``;

const CategoryHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const ManageCategoriesButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
`;

const ManageCategoriesText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.primary};
  margin-left: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const CategoryGrid = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  margin: -${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const CategoryButton = styled(TouchableOpacity)<{ isSelected: boolean }>`
  width: 30%;
  aspect-ratio: 1;
  margin: 1.5%;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.primaryLightest : theme.colors.surface};
  border-width: 1.5px;
  border-color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const CategoryIcon = styled(View)<{ color?: string }>`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const CategoryLabel = styled(Text)<{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.primary : theme.colors.text};
  text-align: center;
`;

const AddCategoryButton = styled(CategoryButton)`
  border-style: dashed;
  border-color: ${({ theme }: StyledProps) => theme.colors.border};
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const LocationScrollView = styled(ScrollView)`
  flex-direction: row;
`;

const LocationButton = styled(TouchableOpacity)<{ isSelected: boolean }>`
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.full}px;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.primary : theme.colors.surface};
  border-width: 1px;
  border-color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.primary : theme.colors.border};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const LocationText = styled(Text)<{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.colors.surface : theme.colors.text};
`;

const Row = styled(View)`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const HalfInput = styled(Input)`
  flex: 1;
`;

const SubmitButton = styled(TouchableOpacity)`
  background-color: ${({ theme }: StyledProps) => theme.colors.primary};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const SubmitButtonText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.lg}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.surface};
  margin-left: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

interface CreateItemBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  onItemCreated?: () => void;
}

export const CreateItemBottomSheet: React.FC<CreateItemBottomSheetProps> = ({
  bottomSheetRef,
  onItemCreated,
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [price, setPrice] = useState('0');
  const [detailedLocation, setDetailedLocation] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const categoryManagerRef = React.useRef<BottomSheetModal>(null);

  // Filter to get only item-type categories (exclude location categories)
  const itemTypeCategories = useMemo(() => {
    return filterItemCategories(categories);
  }, [categories]);

  const loadCategories = useCallback(async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Categories will remain empty array if loading fails
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCategoriesChanged = useCallback(() => {
    loadCategories();
  }, [loadCategories]);

  const snapPoints = useMemo(() => ['90%'], []);

  // Handle keyboard behavior - use 'interactive' for better keyboard handling
  const keyboardBehavior = useMemo(() => 'interactive', []);
  const keyboardBlurBehavior = useMemo(() => 'restore', []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    // Reset form
    setName('');
    setSelectedCategory('');
    setSelectedLocation('');
    setPrice('0');
    setDetailedLocation('');
  }, [bottomSheetRef]);

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('错误', '请输入物品名称');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('错误', '请选择分类');
      return;
    }
    if (!selectedLocation) {
      Alert.alert('错误', '请选择位置');
      return;
    }

    setIsLoading(true);
    try {
      const category = categories.find((cat) => cat.id === selectedCategory);
      const priceNum = parseFloat(price) || 0;

      const newItem = await createItem({
        name: name.trim(),
        category: selectedCategory,
        location: selectedLocation,
        detailedLocation: detailedLocation.trim(),
        price: priceNum,
        icon: category?.icon || 'cube-outline',
        iconColor: category?.iconColor || theme.colors.textSecondary,
        tags: [],
      });

      if (newItem) {
        handleClose();
        if (onItemCreated) {
          onItemCreated();
        }
      } else {
        Alert.alert('错误', '创建物品失败，请重试');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      Alert.alert('错误', '创建物品失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [name, selectedCategory, selectedLocation, price, detailedLocation, categories, theme, handleClose, onItemCreated]);

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => <Backdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableContentPanningGesture
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      android_keyboardInputMode="adjustResize"
      enableHandlePanningGesture={false}
      index={0}
    >
      <BottomSheetScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnPanDownToDismiss={false}
      >
          <Header>
            <HeaderLeft>
              <Title>入库新物品</Title>
              <Subtitle>记下来就不会忘啦</Subtitle>
            </HeaderLeft>
            <CloseButton onPress={handleClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </CloseButton>
          </Header>

          <FormSection>
            <Label>名字</Label>
            <Input
              placeholder="例如:可爱的小杯子"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textLight}
            />
          </FormSection>

          <FormSection>
            <CategorySection>
              <CategoryHeader>
                <Label>分类</Label>
                <ManageCategoriesButton onPress={() => categoryManagerRef.current?.present()} activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                  <ManageCategoriesText>管理分类</ManageCategoriesText>
                </ManageCategoriesButton>
              </CategoryHeader>
              <CategoryGrid>
                {itemTypeCategories.map((category) => (
                  <CategoryButton
                    key={category.id}
                    isSelected={selectedCategory === category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    {category.icon && (
                      <CategoryIcon color={category.iconColor}>
                        <Ionicons
                          name={category.icon}
                          size={24}
                          color={category.iconColor || theme.colors.primary}
                        />
                      </CategoryIcon>
                    )}
                    <CategoryLabel isSelected={selectedCategory === category.id}>
                      {category.label}
                    </CategoryLabel>
                  </CategoryButton>
                ))}
                <AddCategoryButton onPress={() => categoryManagerRef.current?.present()} activeOpacity={0.7}>
                  <Ionicons name="add" size={32} color={theme.colors.textLight} />
                  <CategoryLabel isSelected={false}>添加</CategoryLabel>
                </AddCategoryButton>
              </CategoryGrid>
            </CategorySection>
          </FormSection>

          <FormSection>
            <Label>位置</Label>
            <LocationScrollView horizontal showsHorizontalScrollIndicator={false}>
              {locations.map((location) => (
                <LocationButton
                  key={location.id}
                  isSelected={selectedLocation === location.id}
                  onPress={() => setSelectedLocation(location.id)}
                  activeOpacity={0.7}
                >
                  <LocationText isSelected={selectedLocation === location.id}>
                    {location.name}
                  </LocationText>
                </LocationButton>
              ))}
            </LocationScrollView>
          </FormSection>

          <FormSection>
            <Row>
              <FormSection style={{ flex: 1, marginBottom: 0 }}>
                <Label>价格</Label>
                <HalfInput
                  placeholder="0"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textLight}
                />
              </FormSection>
              <FormSection style={{ flex: 1, marginBottom: 0 }}>
                <Label>具体位置</Label>
                <HalfInput
                  placeholder="比如:门口鞋柜"
                  value={detailedLocation}
                  onChangeText={setDetailedLocation}
                  placeholderTextColor={theme.colors.textLight}
                />
              </FormSection>
            </Row>
          </FormSection>

          <SubmitButton onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color={theme.colors.surface} />
            <SubmitButtonText>放入小家</SubmitButtonText>
          </SubmitButton>
      </BottomSheetScrollView>
      <CategoryManagerBottomSheet
        bottomSheetRef={categoryManagerRef}
        onCategoriesChanged={handleCategoriesChanged}
      />
    </BottomSheetModal>
  );
};

