import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
};

export type NotesStackParamList = {
  Notes: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  NotesTab: NavigatorScreenParams<NotesStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  ItemDetails: { itemId: string };
  Profile: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList { }
  }
}

