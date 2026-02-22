import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { categoryColors } from '../../data/categoryColors';
import type { StyledProps, StyledPropsWith } from '../../utils/styledComponents';
import type { Theme } from '../../theme/types';

const Container = styled(View) <{ edgeToEdge?: boolean }>`
  /* No margin-bottom - parent FormSection handles spacing */
  ${({ edgeToEdge, theme }: StyledProps & { edgeToEdge?: boolean }) =>
    edgeToEdge ? `margin-horizontal: -${theme.spacing.md}px;` : ''}
`;

const Label = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const ColorScroll = styled(ScrollView).attrs(() => ({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
}))``;

const ColorContainer = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const ColorButton = styled(TouchableOpacity) <{ isSelected: boolean; color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${({ color }: { color: string }) => color};
  border-width: 3px;
  border-color: ${({ theme, isSelected, color }: StyledPropsWith<{ isSelected: boolean; color: string }>) =>
    isSelected ? color : theme.colors.borderLight};
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

export interface ColorPaletteProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  showLabel?: boolean;
  edgeToEdge?: boolean;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onColorSelect,
  showLabel = true,
  edgeToEdge = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Need to track if we've done the initial scroll
  const [hasScrolled, setHasScrolled] = React.useState(false);

  React.useEffect(() => {
    // Only scroll once on mount when selectedColor is provided
    if (!hasScrolled && selectedColor && scrollViewRef.current) {
      const index = categoryColors.indexOf(selectedColor);
      if (index >= 0) {
        // Approximate width of color button (44) + margin (theme spacing sm approx 8) = 52
        // We scroll a bit less to keep it in center roughly
        const offset = Math.max(0, index * 52 - 100);
        // Small timeout ensures layout is computed
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: offset, animated: true });
          setHasScrolled(true);
        }, 100);
      }
    }
  }, [selectedColor, hasScrolled]);

  return (
    <Container edgeToEdge={edgeToEdge}>
      {showLabel && <Label style={edgeToEdge ? { paddingHorizontal: theme.spacing?.md || 16 } : {}}>{t('colorPalette.label')}</Label>}
      <ColorScroll
        ref={scrollViewRef}
        contentContainerStyle={edgeToEdge ? { paddingHorizontal: theme.spacing?.md || 16 } : { paddingRight: 16 }}
      >
        <ColorContainer>
          {categoryColors.map((color) => {
            const isSelected = selectedColor === color;
            // Determine if we should show a white or black checkmark based on color brightness
            const showCheckmark = isSelected;

            return (
              <ColorButton
                key={color}
                isSelected={isSelected}
                color={color}
                onPress={() => onColorSelect(color)}
                activeOpacity={0.7}
              >
                {showCheckmark && (
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                )}
              </ColorButton>
            );
          })}
        </ColorContainer>
      </ColorScroll>
    </Container>
  );
};

