import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type {
  StyledProps,
  StyledPropsWith,
} from '../../utils/styledComponents';
import { locations } from '../../data/locations';

const FilterContainer = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const LocationScrollView = styled(ScrollView).attrs(() => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
}))`
  flex-grow: 0;
`;

// Square/Rounded item container
const LocationButton = styled(TouchableOpacity) <{ isSelected: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  justify-content: center;
  align-items: center;
  background-color: ${({
  theme,
  isSelected,
}: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.filterInactive};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

// Wrapper for the button + text below it
const LocationWrapper = styled(View)`
  align-items: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const LocationLabel = styled(Text) <{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  text-align: center;
`;

export interface LocationFilterProps {
  selectedLocationId: string | null;
  onSelect: (locationId: string | null) => void;
  counts?: Record<string, number>;
}

export const LocationFilter: React.FC<LocationFilterProps> = ({
  selectedLocationId,
  onSelect,
  counts = {},
}) => {
  const { t } = useTranslation();
  // theme is not used

  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <FilterContainer>
      <LocationScrollView
        contentContainerStyle={{ paddingHorizontal: 0 }}
      >
        {/* All Locations Option */}
        <LocationWrapper>
          <LocationButton
            isSelected={selectedLocationId === null}
            onPress={() => onSelect(null)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="home-outline"
              size={20}
              color={selectedLocationId === null ? '#FFFFFF' : '#666666'}
            />
          </LocationButton>
          <LocationLabel isSelected={selectedLocationId === null}>
            {t('categories.all')} <Text style={{ fontSize: 10, opacity: 0.7 }}>({totalCount})</Text>
          </LocationLabel>
        </LocationWrapper>

        {locations.map((location) => {
          const isSelected = selectedLocationId === location.id;
          return (
            <LocationWrapper key={location.id}>
              <LocationButton
                isSelected={isSelected}
                onPress={() => onSelect(location.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(location.icon || 'location-outline') as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={isSelected ? '#FFFFFF' : '#666666'}
                />
              </LocationButton>
              <LocationLabel isSelected={isSelected}>
                {t(`locations.${location.id}`)} <Text style={{ fontSize: 10, opacity: 0.7 }}>({counts[location.id] || 0})</Text>
              </LocationLabel>
            </LocationWrapper>
          );
        })}
      </LocationScrollView>
    </FilterContainer>
  );
};
