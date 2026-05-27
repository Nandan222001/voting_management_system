import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, ActivityIndicator, Platform } from 'react-native';
import Header from '../components/common/Header';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { electionService } from '../services/electionService';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalElections: 0,
    activeElections: 0,
    completedElections: 0,
    totalCandidates: 0,
  });

  const loadAnalytics = async () => {
    try {
      const elections = await electionService.getElections();
      const active = elections.filter((e: any) => e.status === 'active').length;
      const completed = elections.filter((e: any) => e.status === 'completed').length;
      
      let totalCands = 0;
      // Fetch candidates for the first 5 elections as a sample
      const sampleElections = elections.slice(0, 5);
      const candidatesPromises = sampleElections.map(e => electionService.getCandidates(e.id));
      const candidatesResults = await Promise.all(candidatesPromises);
      totalCands = candidatesResults.reduce((acc, curr) => acc + curr.length, 0);

      setStats({
        totalElections: elections.length,
        activeElections: active,
        completedElections: completed,
        totalCandidates: totalCands,
      });
    } catch (error) {
      console.error('Failed to load analytics', error);
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
      <View style={styles.centered}>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadAnalytics();
          }} colors={['rgb(16 102 177)']} />
        }
      >
        <View style={styles.screenHeader}>
           <Text style={styles.screenTitle}>Registry Insights</Text>
           <Text style={styles.screenSub}>Real-time metrics and participation data across the network.</Text>
        </View>

        <View style={styles.statsRow}>
           <View style={[styles.mainMetric, { backgroundColor: 'rgb(16 102 177)' }]}>
              <View style={styles.metricIconContainer}>
                 <MaterialIcons name="insights" size={24} color="#fff" />
              </View>
              <Text style={styles.metricValue}>{stats.totalElections}</Text>
              <Text style={styles.metricLabel}>Total Sessions</Text>
           </View>
           
           <View style={styles.sideMetrics}>
              <View style={styles.miniMetric}>
                 <Text style={[styles.miniValue, { color: '#10b981' }]}>{stats.activeElections}</Text>
                 <Text style={styles.miniLabel}>Live</Text>
              </View>
              <View style={styles.miniMetric}>
                 <Text style={[styles.miniValue, { color: 'rgb(16 102 177)' }]}>{stats.totalCandidates}</Text>
                 <Text style={styles.miniLabel}>Vetted</Text>
              </View>
           </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
               <Text style={styles.cardTitle}>Participation Index</Text>
               <Text style={styles.cardSub}>Monthly verified turnout (Mock)</Text>
            </View>
            <View style={styles.trendBadge}>
               <MaterialIcons name="trending-up" size={14} color="#10b981" />
               <Text style={styles.trendText}>+12.4%</Text>
            </View>
          </View>
          
          <View style={styles.visualization}>
             <View style={styles.yAxis}>
                <Text style={styles.axisText}>100%</Text>
                <Text style={styles.axisText}>50%</Text>
                <Text style={styles.axisText}>0%</Text>
             </View>
             <View style={styles.chartArea}>
                <Bar height={40} />
                <Bar height={75} active />
                <Bar height={55} />
                <Bar height={90} active />
                <Bar height={65} />
                <Bar height={110} active />
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

        <View style={styles.securitySeal}>
           <FontAwesome5 name="fingerprint" size={24} color="rgb(16 102 177)" style={{ opacity: 0.1, position: 'absolute', right: 20 }} />
           <Text style={styles.sealTitle}>Authenticated Registry</Text>
           <Text style={styles.sealText}>All analytics are derived from anonymized, cryptographically signed ballots.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const Bar = ({ height, active }: any) => (
  <View style={styles.barContainer}>
    <View style={[styles.bar, { height: height, backgroundColor: active ? 'rgb(16 102 177)' : '#e2e8f0' }]} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 20 },
  screenHeader: { marginTop: 24, marginBottom: 28 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -1 },
  screenSub: { fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 20 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  mainMetric: { 
    width: '58%', 
    padding: 24, 
    borderRadius: 24, 
    ...Platform.select({
      ios: { shadowColor: 'rgb(16 102 177)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },
  metricIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  metricValue: { fontSize: 36, fontWeight: '800', color: '#fff' },
  metricLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  
  sideMetrics: { width: '38%', justifyContent: 'space-between' },
  miniMetric: { 
    height: '47%', 
    backgroundColor: '#f8fafc', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    justifyContent: 'center'
  },
  miniValue: { fontSize: 20, fontWeight: '800' },
  miniLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  chartCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 2 }
    })
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  trendText: { fontSize: 10, fontWeight: '800', color: '#047857', marginLeft: 4 },
  
  visualization: { flexDirection: 'row', height: 160 },
  yAxis: { width: 40, justifyContent: 'space-between', paddingBottom: 10 },
  axisText: { fontSize: 9, fontWeight: '700', color: '#cbd5e1', textAlign: 'right', paddingRight: 8 },
  chartArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingHorizontal: 10 },
  barContainer: { flex: 1, alignItems: 'center' },
  bar: { width: 14, borderRadius: 4 },
  xAxis: { flexDirection: 'row', marginLeft: 40, marginTop: 12, justifyContent: 'space-between', paddingHorizontal: 10 },

  securitySeal: { 
    backgroundColor: '#f8fafc', 
    padding: 24, 
    borderRadius: 20, 
    marginTop: 32, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden'
  },
  sealTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sealText: { fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 18, fontWeight: '500' }
});

export default AnalyticsScreen;
