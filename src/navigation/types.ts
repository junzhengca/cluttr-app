import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
};

export type InventoryStackParamList = {
  Inventory: undefined;
};

export type NotesStackParamList = {
  Notes: undefined;
};

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  InventoryTab: NavigatorScreenParams<InventoryStackParamList>;
  NotesTab: NavigatorScreenParams<NotesStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends TabParamList {}
  }
}

