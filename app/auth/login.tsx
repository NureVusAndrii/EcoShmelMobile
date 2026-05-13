import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { authService, userService } from '../../api/authService';
import apiClient from '../../api/client';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../constants/translations';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const router = useRouter();
    const { language } = useLanguage();
    const { refreshLanguage } = useLanguage();
    const t = translations[language];

    const handleAuth = async () => {
        try {
            let response;
            if (isLogin) {
                response = await authService.login({ email, password });
            } else {
                response = await authService.register({ email, name, password });
            }

            if (response.token) {
                await SecureStore.setItemAsync('userToken', response.token);
                await refreshLanguage();
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                await apiClient.patch('/users/me', {
                    location: {
                        type: 'Point',
                        coordinates: [location.coords.longitude, location.coords.latitude]
                    }
                });
            }

            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert("Помилка", error.response?.data?.message || "Щось пішло не так");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {isLogin ? t.login : t.register}
            </Text>

            {!isLogin && (
                <TextInput
                    style={styles.input}
                    placeholder={t.name}
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder={t.email}
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder={t.password}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button
                title={isLogin ? t.signIn : t.createAccount}
                onPress={handleAuth}
            />

            <Text
                style={styles.switchText}
                onPress={() => setIsLogin(!isLogin)}
            >
                {isLogin ? t.noAccount : t.alreadyHave}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5, color: '#333' },
    switchText: { marginTop: 20, color: 'blue', textAlign: 'center' }
});