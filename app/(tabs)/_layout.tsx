import { NativeTabs } from 'expo-router/unstable-native-tabs';

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
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>
          {t('navigation.search')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes">
        <NativeTabs.Trigger.Label>
          {t('navigation.notes')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.and.pencil" md="edit_note" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>
          {t('navigation.settings')}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
