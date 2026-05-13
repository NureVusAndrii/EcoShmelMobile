import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../../api/client';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../constants/translations';

interface Alert {
  _id: string;
  message: string;
  municipalityId: any;
  resolvedAt?: string;
}

interface Municipality {
  _id: string;
  name: string;
  country: string;
}

export default function HomeScreen() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        return;
      }

      setLoading(true);
      const munRes = await apiClient.get('/municipalities/my');
      setMunicipalities(munRes.data);

      const alertRes = await apiClient.get('/alerts');
      setAlerts(alertRes.data);
    } catch (e: any) {
      if (e.response?.status !== 401) {
        console.error("Деталі помилки API:", e.response?.data || e.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const renderMunicipality = ({ item }: { item: Municipality }) => {
    const activeAlerts = alerts.filter(a =>
        (a.municipalityId?._id === item._id || a.municipalityId === item._id) &&
        !a.resolvedAt
    );

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push({
              pathname: `/municipality/${item._id}`,
              params: { name: item.name }
            })}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.country}>{item.country}</Text>
            </View>
            <View style={styles.content}>
              {activeAlerts.length > 0 ? (
                  activeAlerts.map(alert => (
                      <Text key={alert._id} style={styles.alertText}>
                        ⚠️ {alert.message}
                      </Text>
                  ))
              ) : (
                  <Text style={styles.safeText}>
                    {t.safe}
                  </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={styles.center} />;

  return (

      <FlatList
          data={municipalities}
          keyExtractor={(item) => item._id}
          renderItem={renderMunicipality}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>{t.noMunicipalities}</Text>}
          contentContainerStyle={styles.list}
      />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  header: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  country: { fontSize: 14, color: '#666' },
  content: { marginTop: 4 },
  alertText: { color: '#d32f2f', fontSize: 16, fontWeight: '600', marginVertical: 4 },
  safeText: { color: '#2e7d32', fontSize: 15, fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});