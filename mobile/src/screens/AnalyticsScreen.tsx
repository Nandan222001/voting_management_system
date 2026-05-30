import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, ActivityIndicator, Platform, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/common/Header';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { reportService } from '../services/reportService';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  background: '#f8f9fb',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  secondary: '#056e00',
  secondaryContainer: '#8dfc75',
  onSecondaryContainer: '#067500',
  surfaceContainerLow: '#f3f4f6',
  surfaceContainerHighest: '#e1e2e4',
  outline: '#737685',
  primaryFixed: '#dae2ff',
};

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({
    total_users: 0,
    total_elections: 0,
    total_votes: 0,
    active_elections: 0,
    pending_users: 0,
    closed_elections: 0,
    draft_elections: 0,
  });

  const loadAnalytics = async () => {
    try {
      const data = await reportService.getDashboardOverview();
      setStats(data);
    } catch (error) {
      console.error('Failed to load analytics', error);
      Alert.alert("Error", "Could not load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Network Insights" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadAnalytics();
          }} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.screenHeader}>
           <Text style={styles.screenTitle}>Registry Operations</Text>
           <Text style={styles.screenSub}>Real-time metrics and participation data across the federal network.</Text>
        </View>

        {/* Main Metrics Row */}
        <View style={styles.metricsRow}>
           <LinearGradient
            colors={[COLORS.primary, COLORS.primaryContainer]}
            style={styles.mainMetric}
           >
              <View style={styles.metricHeader}>
                 <Text style={styles.metricLabel}>TOTAL SESSIONS</Text>
                 <MaterialIcons name="insights" size={20} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.metricValue}>{stats.total_elections}</Text>
              <View style={styles.metricFooter}>
                 <MaterialIcons name="trending-up" size={14} color={COLORS.secondaryContainer} />
                 <Text style={styles.trendText}>Active: {stats.active_elections}</Text>
              </View>
           </LinearGradient>
           
           <View style={styles.sideMetrics}>
              <View style={styles.miniCard}>
                 <Text style={styles.miniLabel}>VOTES</Text>
                 <Text style={[styles.miniValue, { color: COLORS.secondary }]}>{stats.total_votes}</Text>
              </View>
              <View style={styles.miniCard}>
                 <Text style={styles.miniLabel}>MEMBERS</Text>
                 <Text style={[styles.miniValue, { color: COLORS.primary }]}>{stats.total_users}</Text>
              </View>
           </View>
        </View>

        {/* Participation Index Chart */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View>
               <Text style={styles.cardTitle}>Participation Index</Text>
               <Text style={styles.cardSub}>Monthly verified turnout (Anonymized)</Text>
            </View>
            <TouchableOpacity style={styles.filterBtn}>
               <Text style={styles.filterText}>6M</Text>
               <MaterialIcons name="keyboard-arrow-down" size={16} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartVisualization}>
             <View style={styles.yAxis}>
                <Text style={styles.axisText}>100%</Text>
                <Text style={styles.axisText}>50%</Text>
                <Text style={styles.axisText}>0%</Text>
             </View>
             <View style={styles.chartArea}>
                <Bar height={45} />
                <Bar height={75} active />
                <Bar height={55} />
                <Bar height={95} active />
                <Bar height={65} />
                <Bar height={120} active />
             </View>
          </View>
          <View style={styles.xAxis}>
             <Text style={styles.axisText}>JAN</Text>
             <Text style={styles.axisText}>FEB</Text>
             <Text style={styles.axisText}>MAR</Text>
             <Text style={styles.axisText}>APR</Text>
             <Text style={styles.axisText}>MAY</Text>
             <Text style={styles.axisText}>JUN</Text>
          </View>
        </View>

        {/* Jurisdiction Health Bento */}
        <View style={styles.bentoHeader}>
           <Text style={styles.bentoTitle}>Jurisdiction Health</Text>
           <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
        </View>
        
        <View style={styles.bentoGrid}>
           <View style={styles.bentoItem}>
              <MaterialIcons name="speed" size={24} color={COLORS.primary} />
              <Text style={styles.bentoLabel}>Response Time</Text>
              <Text style={styles.bentoValue}>240ms</Text>
              <Text style={styles.bentoStatus}>Optimal</Text>
           </View>
           <View style={styles.bentoItem}>
              <MaterialIcons name="security" size={24} color={COLORS.secondary} />
              <Text style={styles.bentoLabel}>Integrity Rate</Text>
              <Text style={styles.bentoValue}>99.9%</Text>
              <Text style={styles.bentoStatus}>Verified</Text>
           </View>
           <View style={styles.bentoItem}>
              <MaterialIcons name="people-outline" size={24} color={COLORS.primary} />
              <Text style={styles.bentoLabel}>Voter Turnout</Text>
              <Text style={styles.bentoValue}>68.4%</Text>
              <Text style={styles.bentoStatus}>Above Avg</Text>
           </View>
           <View style={styles.bentoItem}>
              <MaterialIcons name="cloud-done" size={24} color={COLORS.primary} />
              <Text style={styles.bentoLabel}>Sync Status</Text>
              <Text style={styles.bentoValue}>100%</Text>
              <Text style={styles.bentoStatus}>Encrypted</Text>
           </View>
        </View>

        <View style={styles.securitySeal}>
           <View style={styles.sealIconBg}>
              <FontAwesome5 name="fingerprint" size={20} color={COLORS.primary} />
           </View>
           <View style={styles.sealContent}>
              <Text style={styles.sealTitle}>Authenticated Registry</Text>
              <Text style={styles.sealText}>All analytics are derived from anonymized, cryptographically signed votes stored on the precinct ledger.</Text>
           </View>
        </View>
      </ScrollView>
    </View>
  );
};

const Bar = ({ height, active }: any) => (
  <View style={styles.barWrapper}>
    <View style={[styles.barBody, { height: height, backgroundColor: active ? COLORS.primary : COLORS.outlineVariant }]} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 16 },
  
  screenHeader: { marginTop: 24, marginBottom: 24 },
  screenTitle: { fontSize: 32, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  screenSub: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 8, lineHeight: 22 },
  
  metricsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  mainMetric: { 
    flex: 1.5, 
    borderRadius: 20, 
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  metricValue: { color: '#fff', fontSize: 42, fontWeight: '800', marginVertical: 8 },
  metricFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { color: COLORS.secondaryContainer, fontSize: 10, fontWeight: '800' },
  
  sideMetrics: { flex: 1, gap: 12 },
  miniCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.outlineVariant, justifyContent: 'center' },
  miniLabel: { fontSize: 10, fontWeight: '800', color: COLORS.outline, letterSpacing: 0.5 },
  miniValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },

  sectionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.outlineVariant, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  cardSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  filterText: { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant },

  chartVisualization: { flexDirection: 'row', height: 180 },
  yAxis: { width: 40, justifyContent: 'space-between', paddingBottom: 10 },
  axisText: { fontSize: 10, fontWeight: '700', color: COLORS.outlineVariant, textAlign: 'right', paddingRight: 12 },
  chartArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: COLORS.surfaceContainerLow, paddingHorizontal: 12 },
  barWrapper: { flex: 1, alignItems: 'center' },
  barBody: { width: 16, borderRadius: 4 },
  xAxis: { flexDirection: 'row', marginLeft: 40, marginTop: 12, justifyContent: 'space-between', paddingHorizontal: 12 },

  bentoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  bentoTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  viewAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32 },
  bentoItem: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.outlineVariant, gap: 8, marginBottom: 16 },
  bentoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  bentoValue: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  bentoStatus: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase' },

  securitySeal: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surfaceContainerLow, 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    gap: 16
  },
  sealIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  sealContent: { flex: 1 },
  sealTitle: { fontSize: 14, fontWeight: '800', color: COLORS.onSurface },
  sealText: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4, lineHeight: 18, fontWeight: '500' }
});

export default AnalyticsScreen;
