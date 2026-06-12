import React, { useEffect, useRef } from 'react';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import styled from 'styled-components/native';
import { StyledProps } from '../../utils/styledComponents';

const ACTION_WIDTH = 80;
const ACTION_GAP = 4;

// iOS systemGray — readable with white content in both light and dark mode
const EDIT_ACTION_COLOR = '#8E8E93';

// Only one row may stay open at a time (iOS list behavior)
let openRowHandle: { close: () => void } | null = null;

export interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const ActionsContainer = styled(View)`
  flex-direction: row;
  padding-left: ${ACTION_GAP}px;
`;

const ActionPillButton = styled(TouchableOpacity)`
  justify-content: center;
  align-items: center;
  width: ${ACTION_WIDTH}px;
  align-self: stretch;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.xxl}px;
`;

const EditPill = styled(ActionPillButton)`
  background-color: ${EDIT_ACTION_COLOR};
  margin-right: ${ACTION_GAP}px;
`;

const DeletePill = styled(ActionPillButton)`
  background-color: ${({ theme }: StyledProps) => theme.colors.error};
`;

const ActionLabel = styled.Text`
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
`;

interface ActionPillProps {
  translation: SharedValue<number>;
  totalWidth: number;
  distanceFromEdge: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label?: string;
  onPress: () => void;
  Pill: typeof EditPill;
}

// Each pill slides in from the right edge at its own rate (iOS Mail stagger)
const ActionPill: React.FC<ActionPillProps> = ({
  translation,
  totalWidth,
  distanceFromEdge,
  icon,
  label,
  onPress,
  Pill,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translation.value,
          [-totalWidth, 0],
          [0, distanceFromEdge],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pill
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
        {label ? <ActionLabel>{label}</ActionLabel> : null}
      </Pill>
    </Animated.View>
  );
};

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  style,
}) => {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const rowHandle = useRef({
    close: () => swipeableRef.current?.close(),
  }).current;

  const actionCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const totalWidth =
    ACTION_GAP +
    actionCount * ACTION_WIDTH +
    (actionCount > 1 ? ACTION_GAP : 0);

  useEffect(() => {
    return () => {
      if (openRowHandle === rowHandle) {
        openRowHandle = null;
      }
    };
  }, [rowHandle]);

  const handleWillOpen = () => {
    if (openRowHandle && openRowHandle !== rowHandle) {
      openRowHandle.close();
    }
    openRowHandle = rowHandle;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClose = () => {
    if (openRowHandle === rowHandle) {
      openRowHandle = null;
    }
  };

  const handleAction = (action: () => void) => {
    swipeableRef.current?.close();
    action();
  };

  const renderRightActions = (
    _progress: SharedValue<number>,
    translation: SharedValue<number>
  ) => (
    <ActionsContainer>
      {onEdit && (
        <ActionPill
          translation={translation}
          totalWidth={totalWidth}
          distanceFromEdge={totalWidth}
          icon="pencil-outline"
          label={editLabel}
          onPress={() => handleAction(onEdit)}
          Pill={EditPill}
        />
      )}
      {onDelete && (
        <ActionPill
          translation={translation}
          totalWidth={totalWidth}
          distanceFromEdge={ACTION_GAP + ACTION_WIDTH}
          icon="trash-can-outline"
          label={deleteLabel}
          onPress={() => handleAction(onDelete)}
          Pill={DeletePill}
        />
      )}
    </ActionsContainer>
  );

  if (actionCount === 0) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={style}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        friction={2}
        overshootRight={false}
        enableTrackpadTwoFingerGesture
        onSwipeableWillOpen={handleWillOpen}
        onSwipeableClose={handleClose}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
};
