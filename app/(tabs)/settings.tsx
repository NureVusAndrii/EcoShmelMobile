import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../constants/translations';

export default function SettingsScreen() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingUser, setFetchingUser] = useState(true);

    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await SecureStore.getItemAsync('userToken');
                if (!token) return;

                const decoded: any = jwtDecode(token);
                const userId = decoded.id || decoded.userId || decoded.sub;

                const response = await apiClient.get(`/users/${userId}`);
                if (response.data) {
                    setName(response.data.name);
                }
            } catch (e) {
                console.error("Failed to load user:", e);
            } finally {
                setFetchingUser(false);
            }
        };
        fetchUserData();
    }, []);

    const handleUpdateName = async () => {
        if (!name.trim()) return Alert.alert(t.error || 'Error', t.name);
        setLoading(true);
        try {
            // PATCH на /me працює коректно
            await apiClient.patch('/users/me', { name });
            Alert.alert(language === 'uk' ? 'Успіх' : 'Success', language === 'uk' ? "Ім'я оновлено" : "Name updated");
        } catch (e) {
            Alert.alert(language === 'uk' ? 'Помилка' : 'Error', t.error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Permission denied');
            const location = await Location.getCurrentPositionAsync({});
            await apiClient.patch('/users/me', {
                location: {
                    type: 'Point',
                    coordinates: [location.coords.longitude, location.coords.latitude]
                }
            });
            Alert.alert(language === 'uk' ? 'Успіх' : 'Success', language === 'uk' ? 'Локацію оновлено' : 'Location updated');
        } catch (e) {
            Alert.alert(language === 'uk' ? 'Помилка' : 'Error', t.error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLanguage = () => {
        const nextLang = language === 'uk' ? 'en' : 'uk';
        setLanguage(nextLang);
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        router.replace('/auth/login');
    };

    if (fetchingUser) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.sectionTitle}>{language === 'uk' ? 'Профіль' : 'Profile'}</Text>
            <View style={styles.card}>
                <TextInput
                    style={styles.input}
                    placeholder={t.name}
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                />
                <TouchableOpacity style={styles.button} onPress={handleUpdateName} disabled={loading}>
                    <Text style={styles.buttonText}>{language === 'uk' ? "Змінити ім'я" : 'Change name'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{language === 'uk' ? 'Геолокація' : 'Geolocation'}</Text>
            <View style={styles.card}>
                <Text style={styles.description}>
                    {language === 'uk' ? 'Оновіть місцезнаходження для моніторингу.' : 'Update location for monitoring.'}
                </Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3' }]} onPress={handleUpdateLocation} disabled={loading}>
                    <Text style={styles.buttonText}>{language === 'uk' ? 'Оновити локацію' : 'Update location'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t.language}</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
                    <Text style={styles.langText}>
                        {language === 'uk' ? '🇺🇦 ' + t.ukrainian : '🇺🇸 ' + t.english}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>{language === 'uk' ? 'Вийти з акаунту' : 'Logout'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f8f9fa', flexGrow: 1 },
    sectionTitle: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
    input: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 8, marginBottom: 15, fontSize: 16, color: '#333' },
    button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    description: { fontSize: 14, color: '#777', marginBottom: 15 },
    langButton: { paddingVertical: 5 },
    langText: { fontSize: 16, color: '#333' },
    logoutButton: { marginTop: 40, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#d32f2f', alignItems: 'center' },
    logoutText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },
});