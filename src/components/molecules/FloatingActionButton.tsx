import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../../theme/ThemeProvider';
import type { StyledProps } from '../../utils/styledComponents';
import { useTranslation } from 'react-i18next';

const FABContainer = styled(View)`
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  top: 0;
  pointer-events: box-none;
`;

const Backdrop = styled(Pressable)<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: ${({ visible }: { visible: boolean }) =>
    visible ? 'auto' : 'none'};
`;

// Simplified content container inside TouchableOpacity
const ActionContent = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-left: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-right: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  height: 56px;
  min-width: 56px;
`;

const ActionLabelText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) =>
    theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  line-height: ${({ theme }: StyledProps) =>
    theme.typography.fontSize.md * 1.4}px;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const ActionIconContainer = styled(View)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${({ theme }: StyledProps) => theme.colors.primaryLightest};
  align-items: center;
  justify-content: center;
`;

const MainFABContent = styled(View)`
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
`;

export interface FloatingActionButtonProps {
  onManualAdd: () => void;
  bottomOffset?: number;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onManualAdd,
  bottomOffset = 0,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const expandAnimation = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const toggleExpanded = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    const easing = Easing.out(Easing.ease);

    if (newExpanded) {
      expandAnimation.value = withTiming(1, { duration: 250, easing });
      backdropOpacity.value = withTiming(1, { duration: 250, easing });
    } else {
      expandAnimation.value = withTiming(0, { duration: 250, easing });
      backdropOpacity.value = withTiming(0, { duration: 250, easing });
    }
  }, [isExpanded, expandAnimation, backdropOpacity]);

  const handleBackdropPress = useCallback(() => {
    if (isExpanded) {
      toggleExpanded();
    }
  }, [isExpanded, toggleExpanded]);

  const handleManualAdd = useCallback(() => {
    toggleExpanded();
    onManualAdd();
  }, [toggleExpanded, onManualAdd]);

  // Icon opacity animation for add/close transition
  const addIconOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      expandAnimation.value,
      [0, 0.5, 1],
      [1, 0, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const closeIconOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      expandAnimation.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Backdrop animated style
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const bottomPosition = insets.bottom + 100 + bottomOffset;

  const iconColor = theme.colors.primary;

  // Styles for the GlassView wrappers
  const mainFabGlassStyle: ViewStyle = {
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '20', // Faint primary for liquid effect
  };

  const actionGlassStyle: ViewStyle = {
    borderRadius: 9999, // full
    backgroundColor: theme.colors.surface + 'CC',
  };

  return (
    <FABContainer>
      <Animated.View
        style={[
          backdropStyle,
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        ]}
      >
        <Backdrop visible={isExpanded} onPress={handleBackdropPress} />
      </Animated.View>

      {/* Statically laid-out column anchored bottom-right: the pill mounts
          above the FAB with enter/exit animations. Animating layout offsets
          (bottom/translate) here breaks Fabric hit-testing on RN 0.85 — the
          visual moves but the touch target does not. */}
      <View
        style={{
          position: 'absolute',
          right: theme.spacing.md,
          bottom: bottomPosition,
          alignItems: 'flex-end',
          gap: theme.spacing.sm,
        }}
        pointerEvents="box-none"
      >
        {/* Manual Add Button */}
        {isExpanded && (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(150)}
          >
            <GlassView
              style={actionGlassStyle}
              glassEffectStyle="regular"
              isInteractive={true}
            >
              <TouchableOpacity onPress={handleManualAdd} activeOpacity={0.7}>
                <ActionContent>
                  <ActionLabelText>
                    {t('fab.manuallyAdd', 'Manually Add')}
                  </ActionLabelText>
                  <ActionIconContainer>
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </ActionIconContainer>
                </ActionContent>
              </TouchableOpacity>
            </GlassView>
          </Animated.View>
        )}

        {/* Main FAB */}
        <View pointerEvents="auto">
          <GlassView
            style={mainFabGlassStyle}
            glassEffectStyle="regular"
            isInteractive={true}
          >
            <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.8}>
              <MainFABContent>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Animated.View
                    style={[{ position: 'absolute' }, addIconOpacity]}
                  >
                    <Ionicons name="add" size={32} color={iconColor} />
                  </Animated.View>
                  <Animated.View
                    style={[{ position: 'absolute' }, closeIconOpacity]}
                  >
                    <Ionicons name="close" size={32} color={iconColor} />
                  </Animated.View>
                </View>
              </MainFABContent>
            </TouchableOpacity>
          </GlassView>
        </View>
      </View>
    </FABContainer>
  );
};
