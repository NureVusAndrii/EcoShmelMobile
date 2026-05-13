import * as SecureStore from 'expo-secure-store';
import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from '../api/client';
import { LanguageProvider } from '../contexts/LanguageContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const segments = useSegments();
    const router = useRouter();
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    const checkToken = async () => {
        const token = await SecureStore.getItemAsync('userToken');
        setHasToken(!!token);
        setIsReady(true);
    };

    useEffect(() => {
        checkToken();
    }, []);

    useEffect(() => {
        if (hasToken && isReady) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    apiClient.patch('/users/me', { pushTokens: [token] })
                        .catch(err => console.log("Помилка оновлення токена на бекенді:", err));
                }
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                if (data.municipalityId) {
                    router.push(`/municipality/${data.municipalityId}`);
                }
            });

            return () => {
                responseListener.current?.remove();
            };
        }
    }, [hasToken, isReady]);

    useEffect(() => {
        if (!isReady) return;
        const inAuthGroup = segments[0] === 'auth';

        if (!hasToken && !inAuthGroup) {
            router.replace('/auth/login');
        } else if (hasToken && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [hasToken, isReady, segments]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const token = await SecureStore.getItemAsync('userToken');
            if (!!token !== hasToken) {
                setHasToken(!!token);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [hasToken]);

    return (
        <LanguageProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </LanguageProvider>
    );
}

async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        token = (await Notifications.getExpoPushTokenAsync({
            projectId: "69f36fbd-3051-4dc1-8a79-77c52834f1a1"
        })).data;
        console.log("EXPO PUSH TOKEN:", token);
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }
    return token;
}