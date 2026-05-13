import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import apiClient from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../constants/translations';

interface Alert {
    _id: string;
    message: string;
    triggeredAt: string;
    resolvedAt?: string;
    municipalityId: any;
}

export default function AlertHistoryScreen() {
    const { id, name } = useLocalSearchParams();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await apiClient.get('/alerts');
                const filtered = response.data.filter((a: Alert) =>
                    (a.municipalityId?._id === id || a.municipalityId === id)
                );

                const sorted = filtered.sort((a, b) => {
                    if (!a.resolvedAt && b.resolvedAt) return -1;
                    if (a.resolvedAt && !b.resolvedAt) return 1;
                    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
                });

                setAlerts(sorted);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [id]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);

        return date.toLocaleString(
            language === 'uk' ? 'uk-UA' : 'en-US',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
        );
    };

    const renderAlertItem = ({ item }: { item: Alert }) => {
        const isActive = !item.resolvedAt;

        return (
            <View style={[styles.alertCard, isActive && styles.activeCard]}>
                <Text style={[styles.message, isActive && styles.activeText]}>
                    {isActive ? t.activeAlert : t.resolvedAlert}
                </Text>
                <Text style={styles.alertDescription}>
                    {item.message}
                </Text>

                <View style={styles.timeContainer}>
                    <Text style={styles.timeLabel}>
                        {t.start}: {formatDate(item.triggeredAt)}
                    </Text>

                    <Text style={styles.timeLabel}>
                        {t.end}:{' '}
                        {item.resolvedAt
                            ? formatDate(item.resolvedAt)
                            : t.stillActive}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {}
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: name
                        ? `${t.history}: ${name}`
                        : t.alertHistory,
                    headerBackTitle: t.back
                }}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#d32f2f" style={styles.center} />
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAlertItem}
                    ListEmptyComponent={<Text style={styles.empty}>{t.emptyHistory}</Text>}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center' },
    listContent: { padding: 16 },
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 6,
        borderLeftColor: '#9e9e9e',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    activeCard: {
        backgroundColor: '#fff5f5',
        borderLeftColor: '#d32f2f',
    },
    message: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5, color: '#666' },
    activeText: { color: '#d32f2f' },
    alertDescription: { fontSize: 18, color: '#333', fontWeight: '500', marginBottom: 12 },
    timeContainer: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    timeLabel: { fontSize: 13, color: '#777', marginBottom: 2 },
    empty: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});