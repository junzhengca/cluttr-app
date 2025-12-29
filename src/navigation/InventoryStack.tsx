import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InventoryStackParamList } from './types';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ItemDetailsScreen } from '../screens/ItemDetailsScreen';

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export const InventoryStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
    </Stack.Navigator>
  );
};

