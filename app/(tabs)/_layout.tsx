import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../constants/translations';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: true,
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t.home,
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t.settings,
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}