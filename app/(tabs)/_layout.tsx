import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';

import { useTheme } from '../../src/theme/ThemeProvider';
import { useSettings } from '../../src/store/hooks';

import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const theme = useTheme();
  const { settings } = useSettings();
  const isDark = settings?.darkMode;
  const { t } = useTranslation();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={theme.colors.primary}
      backgroundColor="transparent"
      blurEffect={
        isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'
      }
      shadowColor="transparent"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>
          {t('navigation.home')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>
          {t('navigation.search')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon family={Ionicons} name="search" />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes">
        <NativeTabs.Trigger.Label>
          {t('navigation.notes')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon
              family={MaterialCommunityIcons}
              name="notebook-edit"
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>
          {t('navigation.settings')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={
            <NativeTabs.Trigger.VectorIcon family={Ionicons} name="settings" />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
