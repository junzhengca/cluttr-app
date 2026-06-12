import type { ComponentProps } from 'react';
import type Ionicons from '@react-native-vector-icons/ionicons/static';
import type MaterialDesignIcons from '@react-native-vector-icons/material-design-icons/static';

// The @react-native-vector-icons components expose no `glyphMap` static
// (unlike @expo/vector-icons), so icon-name unions are derived from props.
export type IoniconsName = ComponentProps<typeof Ionicons>['name'];
export type MaterialCommunityIconsName = ComponentProps<
  typeof MaterialDesignIcons
>['name'];
