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

/**
 * Container with negative horizontal margins to enable edge-to-edge scrolling.
 * The ScrollView's contentContainerStyle adds horizontal padding to restore
 * proper spacing while allowing content to scroll to the screen edges.
 */
const SelectorContainer = styled(View) <{ horizontalPadding: number }>`
  flex-direction: column;
  margin-horizontal: -${({ horizontalPadding }: { horizontalPadding: number }) => horizontalPadding}px;
`;

const LocationScrollView = styled(ScrollView).attrs(() => ({
    horizontal: true,
    showsHorizontalScrollIndicator: false,
}))`
  flex-grow: 0;
`;

// Square/Rounded item container - Matches LocationSelector style
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

export interface LocationFormSelectorProps {
    selectedLocationId: string;
    onSelect: (locationId: string) => void;
}

/**
 * Location selector for item forms with edge-to-edge scrolling.
 * Displays locations as icon buttons with labels below.
 * 
 * Unlike LocationSelector (for filtering), this component:
 * - Requires a selection (no "All" option)
 * - Uses negative margins for edge-to-edge scroll content
 */
export const LocationFormSelector: React.FC<LocationFormSelectorProps> = ({
    selectedLocationId,
    onSelect,
}) => {
    const { t } = useTranslation();
    const theme = useTheme() as Theme;

    // Calculate wrapper centering offset
    // (64px wrapper width - 50px button width = 14px total, 7px per side)
    const wrapperCenteringOffset = 7;
    const horizontalPadding = theme.spacing.md;

    const scrollContentStyle = {
        paddingLeft: horizontalPadding - wrapperCenteringOffset,
        paddingRight: horizontalPadding,
    };

    return (
        <SelectorContainer horizontalPadding={horizontalPadding}>
            <LocationScrollView contentContainerStyle={scrollContentStyle}>
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
                            <LocationLabel isSelected={isSelected} numberOfLines={2}>
                                {t(`locations.${location.id}`)}
                            </LocationLabel>
                        </LocationWrapper>
                    );
                })}
            </LocationScrollView>
        </SelectorContainer>
    );
};
