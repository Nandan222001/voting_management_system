import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { authService } from '../services/authService';
import { electionService } from '../services/electionService';
import Header from '../components/common/Header';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const DashboardScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ activeElections: 0, totalElections: 0, completedElections: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      const elections = await electionService.getElections();
      const active = elections.filter((e: any) => e.status === 'active').length;
      const completed = elections.filter((e: any) => e.status === 'completed').length;
      setStats({
        activeElections: active,
        totalElections: elections.length,
        completedElections: completed,
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="rgb(16 102 177)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['rgb(16 102 177)']} />
        }
      >
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || "Voter"}</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live Registry</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
           <View style={[styles.mainStatCard, { backgroundColor: 'rgb(16 102 177)' }]}>
              <View style={styles.mainStatHeader}>
                 <Text style={styles.mainStatLabel}>Active Ballots</Text>
                 <MaterialIcons name="how-to-vote" size={24} color="rgba(255,255,255,0.8)" />
              </View>
              <Text style={styles.mainStatValue}>{stats.activeElections}</Text>
              <Text style={styles.mainStatSub}>Participate in open sessions</Text>
           </View>

           <View style={styles.secondaryStatsRow}>
              <View style={styles.smallStatCard}>
                 <Text style={styles.smallStatValue}>{stats.completedElections}</Text>
                 <Text style={styles.smallStatLabel}>Completed</Text>
              </View>
              <View style={styles.smallStatCard}>
                 <Text style={styles.smallStatValue}>{stats.totalElections}</Text>
                 <Text style={styles.smallStatLabel}>Total Archive</Text>
              </View>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Identity Verification</Text>
           <TouchableOpacity onPress={() => Alert.alert('Information', 'Your data is secured using end-to-end encryption.')}>
              <MaterialIcons name="help-outline" size={18} color="#94a3b8" />
           </TouchableOpacity>
        </View>

        <View style={styles.infoListCard}>
           <DetailRow 
              icon="fingerprint" 
              label="Secure ID" 
              value={`CV-${(user?.id || 0).toString().padStart(5, '0')}`} 
              color="rgb(16 102 177)"
           />
           <DetailRow 
              icon="location-city" 
              label="Registry District" 
              value={user?.district || 'Universal'} 
              color="rgb(16 102 177)"           />
           <DetailRow 
              icon="verified" 
              label="Voter Status" 
              value={(user?.status || 'Pending').toUpperCase()} 
              color={user?.status === 'active' ? '#10b981' : '#f59e0b'}
              isLast
           />
        </View>

        <TouchableOpacity style={styles.ctaBanner} activeOpacity={0.9}>
           <View style={styles.ctaIcon}>
              <FontAwesome5 name="shield-alt" size={20} color="rgb(16 102 177)" />
           </View>
           <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Privacy Protection Active</Text>
              <Text style={styles.ctaSub}>Your biometric and personal data are siloed.</Text>
           </View>
           <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const DetailRow = ({ icon, label, value, color, isLast }: any) => (
  <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
    <View style={[styles.detailIconContainer, { backgroundColor: color + '15' }]}>
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    <View style={styles.detailTextContainer}>
       <Text style={styles.detailLabel}>{label}</Text>
       <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  welcomeSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  welcomeText: { fontSize: 14, color: "#64748b", fontWeight: '600' },
  userName: { fontSize: 32, fontWeight: "800", color: "#0f172a", marginTop: 2, letterSpacing: -1 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0ea5e9', marginRight: 8 },
  statusText: { color: "#0369a1", fontSize: 11, fontWeight: "700", textTransform: 'uppercase' },
  
  summaryGrid: { marginBottom: 32 },
  mainStatCard: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: 'rgb(16 102 177)', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  mainStatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  mainStatValue: { color: '#fff', fontSize: 48, fontWeight: '800', marginVertical: 8 },
  mainStatSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  
  secondaryStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallStatCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  smallStatValue: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  smallStatLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 },
  
  infoListCard: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 8, 
    borderWidth: 1, 
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  detailRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 11, color: "#94a3b8", textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginTop: 2 },

  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: 'rgb(16 102 177)',
  },
  ctaIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  ctaContent: { flex: 1 },
  ctaTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  ctaSub: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' }
});

export default DashboardScreen;
