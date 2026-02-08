import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type {
    StyledProps,
    StyledPropsWith,
} from '../../utils/styledComponents';
import { locations } from '../../data/locations';
import type { Theme } from '../../theme/types';

const SelectorContainer = styled(View)`
  flex-direction: column;
`;

const LocationScrollView = styled(ScrollView).attrs(() => ({
    horizontal: true,
    showsHorizontalScrollIndicator: false,
}))`
  flex-grow: 0;
`;

// Square/Rounded item container - Matches LocationFilter style
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
`;

// Wrapper for the button + text below it
const LocationWrapper = styled(View)`
  justify-content: flex-start;
  align-items: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  width: 64px;
`;

const LocationLabel = styled(Text) <{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  text-align: center;
  line-height: 16px;
`;

export interface LocationSelectorProps {
    selectedLocationId: string | null;
    onSelect: (locationId: string | null) => void;
    showAllOption?: boolean;
    showCounts?: boolean;
    counts?: Record<string, number>;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
    selectedLocationId,
    onSelect,
    showAllOption = false,
    showCounts = false,
    counts = {},
}) => {
    const { t } = useTranslation();
    const theme = useTheme() as Theme;
    const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

    // Scroll content padding uses theme spacing for consistency
    // Left padding is adjusted by -7px to compensate for LocationWrapper centering
    // (64px wrapper width - 50px button width = 14px total, 7px per side)
    const wrapperCenteringOffset = 7;
    const scrollContentStyle = {
        paddingLeft: theme.spacing.md - wrapperCenteringOffset,
        paddingRight: theme.spacing.md,
    };

    return (
        <SelectorContainer>
            <LocationScrollView
                contentContainerStyle={scrollContentStyle}
            >
                {/* All Locations Option - Only if showAllOption is true */}
                {showAllOption && (
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
                        <LocationLabel isSelected={selectedLocationId === null} numberOfLines={2}>
                            {t('categories.all')} {showCounts && <Text style={{ fontSize: 10, opacity: 0.7 }}>({totalCount})</Text>}
                        </LocationLabel>
                    </LocationWrapper>
                )}

                {locations.map((location) => {
                    const isSelected = selectedLocationId === location.id;
                    return (
                        <LocationWrapper key={location.id}>
                            <LocationButton
                                isSelected={isSelected}
                                // If showAllOption is false, this is a required field, so we just select the ID.
                                // If onSelect expects "string | null", it's compatible.
                                onPress={() => onSelect(location.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={(location.icon || 'location-outline') as keyof typeof Ionicons.glyphMap}
                                    size={20}
                                    color={isSelected ? '#FFFFFF' : '#666666'}
                                />
                            </LocationButton>
                            <LocationLabel isSelected={isSelected} numberOfLines={2}>
                                {t(`locations.${location.id}`)}
                                {showCounts && (
                                    <Text style={{ fontSize: 10, opacity: 0.7 }}> ({counts[location.id] || 0})</Text>
                                )}
                            </LocationLabel>
                        </LocationWrapper>
                    );
                })}
            </LocationScrollView>
        </SelectorContainer>
    );
};
