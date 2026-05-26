import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { authService } from '../services/authService';
import { electionService } from '../services/electionService';
import Header from '../components/common/Header';
import { MaterialIcons } from '@expo/vector-icons';

const DashboardScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ activeElections: 0, totalElections: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);
    
    try {
      const elections = await electionService.getElections();
      const active = elections.filter((e: any) => e.status === 'active').length;
      setStats({
        activeElections: active,
        totalElections: elections.length,
      });
    } catch (error) {
      console.error('Failed to load elections', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Header title="Dashboard" />
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#eef2ff' }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#4f46e5' }]}>
              <MaterialIcons name="how-to-vote" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.activeElections}</Text>
            <Text style={styles.statLabel}>Active Elections</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
            <View style={[styles.iconContainer, { backgroundColor: '#db2777' }]}>
              <MaterialIcons name="poll" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalElections}</Text>
            <Text style={styles.statLabel}>Total Elections</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Your Profile Details</Text>
          <View style={styles.detailsCard}>
            <DetailItem icon="location-on" label="District" value={user?.district || 'Not Assigned'} />
            <DetailItem icon="work" label="Designation" value={user?.designation || 'Member'} />
            <DetailItem icon="email" label="Email" value={user?.email} />
            <DetailItem icon="phone" label="Phone" value={user?.phone || 'Not Provided'} />
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const DetailItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <View style={styles.detailItem}>
    <View style={styles.detailIcon}>
      <MaterialIcons name={icon} size={20} color="#4f46e5" />
    </View>
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#4f46e515',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  infoSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});

export default DashboardScreen;
