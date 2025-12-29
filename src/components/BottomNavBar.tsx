import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../theme/ThemeProvider';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NavBarContainer = styled.View<{ bottomInset: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.background};
  padding-bottom: ${({ bottomInset }) => bottomInset}px;
  align-items: center;
  justify-content: center;
`;

const NavBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.xl}px;
  margin: ${({ theme }) => theme.spacing.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 5;
  min-height: 60px;
`;

const TabButtonsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const TabButton = styled(TouchableOpacity)<{ isActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  min-width: 50px;
`;

const TabIcon = styled.Text<{ isActive: boolean }>`
  font-size: 24px;
  color: ${({ theme, isActive }) =>
    isActive ? theme.colors.text : theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const TabLabel = styled.Text<{ isActive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs}px;
  color: ${({ theme, isActive }) =>
    isActive ? theme.colors.text : theme.colors.textSecondary};
  font-weight: ${({ theme, isActive }) =>
    isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular};
`;

const Separator = styled.View`
  width: 1px;
  height: 30px;
  background-color: ${({ theme }) => theme.colors.borderLight};
  margin: 0 ${({ theme }) => theme.spacing.sm}px;
`;

const ActionButtonsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const ActionButton = styled(TouchableOpacity)`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
  align-items: center;
  justify-content: center;
`;

const AddButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.primary};
`;

const AIButton = styled(ActionButton)`
  background-color: ${({ theme }) => theme.colors.secondary};
  position: relative;
`;

const ActionIcon = styled.Text`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.surface};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const NotificationBadge = styled.View`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.borderRadius.full}px;
  background-color: ${({ theme }) => theme.colors.notification};
  border: 2px solid ${({ theme }) => theme.colors.surface};
`;

export const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const currentRoute = state.routeNames[state.index] as keyof TabParamList;

  const handleTabPress = (routeName: keyof TabParamList, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const handleAddPress = () => {
    // TODO: Implement add functionality
    console.log('Add button pressed');
  };

  const handleAIPress = () => {
    // TODO: Implement AI functionality
    console.log('AI button pressed');
  };

  return (
    <NavBarContainer bottomInset={insets.bottom}>
      <NavBar>
        <TabButtonsContainer>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const routeName = route.name as keyof TabParamList;

            let icon = '🏠';
            let label = 'Home';
            if (routeName === 'InventoryTab') {
              icon = '📋';
              label = 'Inventory';
            } else if (routeName === 'NotesTab') {
              icon = '📓';
              label = 'Notes';
            }

            return (
              <TabButton
                key={route.key}
                isActive={isFocused}
                onPress={() => handleTabPress(routeName, isFocused)}
              >
                <TabIcon isActive={isFocused}>{icon}</TabIcon>
                <TabLabel isActive={isFocused}>{label}</TabLabel>
              </TabButton>
            );
          })}
        </TabButtonsContainer>

        <Separator />

        <ActionButtonsContainer>
          <AddButton onPress={handleAddPress}>
            <ActionIcon>+</ActionIcon>
          </AddButton>

          <AIButton onPress={handleAIPress}>
            <ActionIcon>✨</ActionIcon>
            <NotificationBadge />
          </AIButton>
        </ActionButtonsContainer>
      </NavBar>
    </NavBarContainer>
  );
};

