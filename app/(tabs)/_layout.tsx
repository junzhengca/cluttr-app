import { Tabs } from 'expo-router';
import { NativeTabs, Label, Icon, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabLayout() {
    const theme = useTheme();

    return (
        <NativeTabs
            minimizeBehavior="onScrollDown"
            tintColor={theme.colors.primary}
        >
            <NativeTabs.Trigger name="index">
                <Label>Home</Label>
                <Icon src={<VectorIcon family={Ionicons} name="home" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="notes">
                <Label>Notes</Label>
                <Icon src={<VectorIcon family={MaterialCommunityIcons} name="notebook-edit" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="share">
                <Label>Share</Label>
                <Icon src={<VectorIcon family={Ionicons} name="share" />} />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="settings">
                <Label>Settings</Label>
                <Icon src={<VectorIcon family={Ionicons} name="settings" />} />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
