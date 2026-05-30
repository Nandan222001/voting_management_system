import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { electionService } from '../services/electionService';
import Header from '../components/common/Header';

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  onPrimary: '#ffffff',
  secondary: '#056e00',
  secondaryContainer: '#8dfc75',
  onSecondaryContainer: '#067500',
  tertiary: '#683700',
  tertiaryContainer: '#8a4b00',
  tertiaryFixed: '#ffdcc2',
  onTertiaryFixed: '#2e1500',
  background: '#f8f9fb',
  surface: '#ffffff',
  surfaceContainerLow: '#f3f4f6',
  surfaceContainerHigh: '#e7e8ea',
  surfaceContainerHighest: '#e1e2e4',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outline: '#737685',
  outlineVariant: '#c3c6d6',
  error: '#ba1a1a',
  onPrimaryContainer: '#c4d2ff',
};

const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const [activeElections, setActiveElections] = useState<any[]>([]);
  const [upcomingElections, setUpcomingElections] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeElections: 0, totalElections: 0, completedElections: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const elections = await electionService.getElections();
      const now = new Date();
      
      const active = elections.filter((e: any) => {
        const start = new Date(e.start_date).getTime();
        const end = new Date(e.end_date).getTime();
        return e.status === 'active' && start <= now.getTime() && end >= now.getTime();
      });

      const upcoming = elections.filter((e: any) => {
        const start = new Date(e.start_date).getTime();
        return start > now.getTime();
      });

      const completed = elections.filter((e: any) => e.status === 'completed');

      setActiveElections(active);
      setUpcomingElections(upcoming);
      setStats({
        activeElections: active.length,
        totalElections: elections.length,
        completedElections: completed.length,
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back,</Text>
          <Text style={styles.delegateName}>Delegate {user?.full_name?.split(' ')[0] || "Sarah"}.</Text>
          <Text style={styles.welcomeSubtext}>Your commitment to the future of our democracy drives our collective progress.</Text>
        </View>

        {/* Membership Card */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.membershipCard}
        >
          <View style={styles.abstractCircle2} />
          
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>OFFICIAL MEMBER CARD</Text>
              <Text style={styles.cardUserName}>{user?.full_name || "Sarah Jenkins"}</Text>
              <Text style={styles.cardUserId}>ID: #FED-992-{(user?.id || 4).toString().padStart(3, '0')}</Text>
            </View>
          </View>
          
          <View style={styles.cardBottom}>
            <View>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>PLATINUM TIER</Text>
              </View>
              <Text style={styles.expiresText}>Expires: 12/2026</Text>
            </View>
            <Text style={styles.voteText}>VOTE2026</Text>
          </View>
        </LinearGradient>

        {/* Active Elections Hero */}
        {activeElections.length > 0 && (
          <View style={styles.activeHeroContainer}>
            <View style={styles.heroHeader}>
               <View style={styles.heroTitleRow}>
                  <View style={[styles.liveIndicator, { backgroundColor: COLORS.secondary }]}>
                    <View style={[styles.livePulse, { backgroundColor: '#fff' }]} />
                    <Text style={[styles.liveLabel, { color: '#fff' }]}>LIVE VOTING</Text>
                  </View>
                  <Text style={styles.heroCurrentDate}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
               </View>
            </View>

            {activeElections.slice(0, 1).map((election, index) => (
              <TouchableOpacity 
                key={election.id || index}
                style={styles.heroCard}
                onPress={() => navigation.navigate('Elections', { screen: 'Voting', params: { election } })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#ffffff', '#f0f4ff']}
                  style={styles.heroCardGradient}
                >
                  <View style={styles.heroCardContent}>
                    <View style={styles.heroInfoSection}>
                      <Text style={styles.heroElectionTitle}>{election.title}</Text>
                      <View style={styles.heroBadgeRow}>
                        <View style={styles.heroTypeBadge}>
                          <Text style={styles.heroTypeBadgeText}>{election.election_type || 'GENERAL'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.heroDivider} />

                    <View style={styles.heroStatusRow}>
                      <View style={styles.heroStatusIcon}>
                        <MaterialIcons name="verified" size={20} color={COLORS.secondary} />
                      </View>
                      <View>
                        <Text style={styles.heroStatusTitle}>Status: Eligible to Vote</Text>
                        <Text style={styles.heroStatusSub}>Your vote is pending</Text>
                      </View>
                      <View style={styles.heroArrow}>
                        <MaterialIcons name="chevron-right" size={24} color={COLORS.primary} />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeElections.length === 0 && (
          <View style={styles.emptyActiveCard}>
             <MaterialIcons name="event-busy" size={32} color={COLORS.outline} />
             <Text style={styles.emptyActiveText}>No active elections for today.</Text>
          </View>
        )}

        {/* Upcoming Elections */}
        <View style={styles.sectionHeader}>
           <View style={styles.sectionTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: COLORS.tertiary }]} />
              <Text style={styles.sectionTitle}>Upcoming Elections</Text>
           </View>
        </View>

        <View style={styles.eventsList}>
           {upcomingElections.length === 0 ? (
             <Text style={styles.noUpcomingText}>No upcoming elections scheduled.</Text>
           ) : (
             upcomingElections.map((election, index) => (
               <View key={election.id || index} style={styles.eventCard}>
                  <View style={[styles.dateBlock, { backgroundColor: COLORS.tertiaryFixed }]}>
                     <Text style={[styles.dateMonth, { color: COLORS.onTertiaryFixed }]}>
                        {new Date(election.start_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                     </Text>
                     <Text style={styles.dateDay}>{new Date(election.start_date).getDate()}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                     <Text style={styles.eventTitle} numberOfLines={1}>{election.title}</Text>
                     <View style={styles.locationRow}>
                        <MaterialIcons name="event" size={12} color={COLORS.onSurfaceVariant} />
                        <Text style={styles.eventLocation}>Starts: {new Date(election.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                     </View>
                     <View style={styles.eventFooter}>
                        <View style={[styles.typeBadge, { backgroundColor: COLORS.error }]}>
                           <Text style={[styles.typeBadgeText, { color: '#fff' }]}>{election.election_type || 'UPCOMING'}</Text>
                        </View>
                     </View>
                  </View>
               </View>
             ))
           )}
        </View>
        
        <TouchableOpacity style={styles.viewCalendarBtn} onPress={() => navigation.navigate('Elections')}>
           <Text style={styles.viewCalendarText}>View All Elections</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 16 },
  
  welcomeSection: { marginTop: 24, marginBottom: 24 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', color: COLORS.primary, letterSpacing: -1 },
  delegateName: { fontSize: 32, fontWeight: '700', color: COLORS.primary, letterSpacing: -1, marginTop: -4 },
  welcomeSubtext: { fontSize: 16, color: COLORS.onSurfaceVariant, marginTop: 8, lineHeight: 22 },
  
  membershipCard: {
    borderRadius: 16,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 32,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
      android: { elevation: 10 },
      web: { boxShadow: `0px 10px 15px ${COLORS.primary}4D` }
    })
  },
  abstractCircle2: {
    position: 'absolute',
    bottom: -24,
    left: -24,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(141, 252, 117, 0.1)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardUserName: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 4 },
  cardUserId: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tierBadge: { backgroundColor: COLORS.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tierBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  expiresText: { color: COLORS.onPrimaryContainer, fontSize: 12, marginTop: 8 },
  voteText: { color: '#fff', fontSize: 24, fontWeight: '700', fontStyle: 'italic', letterSpacing: -1 },

  // Active Hero Styles
  activeHeroContainer: { marginBottom: 32 },
  heroHeader: { marginBottom: 16 },
  heroTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.error + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  liveLabel: { fontSize: 10, fontWeight: '800', color: COLORS.error, letterSpacing: 1 },
  heroCurrentDate: { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', opacity: 0.8 },
  
  heroCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.outlineVariant },
  heroCardGradient: { padding: 2 },
  heroCardContent: { backgroundColor: '#fff', borderRadius: 22, padding: 20 },
  heroInfoSection: { marginBottom: 16 },
  heroElectionTitle: { fontSize: 22, fontWeight: '600', color: COLORS.onSurface, letterSpacing: -0.5, marginBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', gap: 10 },
  heroTypeBadge: { backgroundColor: COLORS.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  heroTypeBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  heroTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  heroTimeText: { fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant },
  
  heroDivider: { height: 1, backgroundColor: COLORS.outlineVariant, opacity: 0.5, marginBottom: 16 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroStatusIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondaryContainer + '40', justifyContent: 'center', alignItems: 'center' },
  heroStatusTitle: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  heroStatusSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  heroArrow: { marginLeft: 'auto' },
  
  heroViewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  heroViewAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  emptyActiveCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.outlineVariant, marginBottom: 32 },
  emptyActiveText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.7 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIndicator: { width: 6, height: 24, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.onSurface },
  currentDateText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },

  electionCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.outlineVariant, overflow: 'hidden', marginBottom: 32 },
  electionHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, backgroundColor: 'rgba(243, 244, 246, 0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  electionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.primary },
  electionSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  liveText: { color: COLORS.onSecondaryContainer, fontSize: 12, fontWeight: '700' },
  electionContent: { padding: 20 },
  voterStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  voterIconContainer: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.primaryContainer + '20', justifyContent: 'center', alignItems: 'center' },
  voterStatusTitle: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  voterStatusSub: { fontSize: 14, color: COLORS.onSurfaceVariant },
  progressBarBg: { height: 8, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  turnoutText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontStyle: 'italic', marginBottom: 24 },
  viewProfilesBtn: { alignItems: 'center', paddingVertical: 8 },
  viewProfilesText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },

  eventsList: { gap: 12, marginBottom: 16 },
  eventCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.outlineVariant, padding: 16, gap: 16 },
  dateBlock: { width: 48, height: 56, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  dateMonth: { fontSize: 12, fontWeight: '700' },
  dateDay: { fontSize: 18, fontWeight: '900', color: COLORS.onSurface },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventLocation: { fontSize: 12, color: COLORS.onSurfaceVariant },
  eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  eventTime: { fontSize: 10, color: COLORS.onSurfaceVariant },
  viewCalendarBtn: { paddingVertical: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.outlineVariant, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  viewCalendarText: { color: COLORS.onSurfaceVariant, fontWeight: '700', fontSize: 12 },
  noUpcomingText: { fontSize: 14, color: COLORS.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});

export default DashboardScreen;
