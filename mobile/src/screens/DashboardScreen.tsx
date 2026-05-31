import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Platform, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { electionService } from '../services/electionService';
import Header from '../components/common/Header';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  onPrimary: '#ffffff',
  secondary: '#056e00',
  secondaryContainer: '#8dfc75',
  onSecondaryContainer: '#067500',
  accent: '#ff8c00',
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
      let response;
      try {
        response = await electionService.getElections(false, 1, 100);
      } catch (err: any) {
        // If 401, try the public endpoint as a fallback for the dashboard
        if (err.response?.status === 401) {
          response = await electionService.getPublicElections();
        } else {
          throw err;
        }
      }
      
      const elections = Array.isArray(response) ? response : (response.data || []);
      const now = new Date();
      
      const active = elections.filter((e: any) => {
        const start = new Date(e.start_date).getTime();
        const end = new Date(e.end_date).getTime();
        // Backend 'active' status means it's published. 
        // We also check dates for the "Live" hero.
        return e.status === 'active' && start <= now.getTime() && end >= now.getTime();
      });

      const upcoming = elections.filter((e: any) => {
        const start = new Date(e.start_date).getTime();
        return start > now.getTime() && e.status !== 'completed' && e.status !== 'cancelled';
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
          <>
            <View style={styles.sectionHeader}>
               <View style={styles.sectionTitleRow}>
                  <View style={[styles.titleIndicator, { backgroundColor: COLORS.secondary }]} />
                  <Text style={styles.sectionTitle}>Live Voting</Text>
               </View>
            </View>

            <View style={styles.activeHeroContainer}>
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
          </>
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
              <View style={[styles.titleIndicator, { backgroundColor: '#6366f1' }]} />
              <Text style={styles.sectionTitle}>Upcoming Elections</Text>
           </View>
        </View>

        <View style={styles.carouselContainer}>
           {upcomingElections.length === 0 ? (
             <View style={styles.emptyUpcomingCard}>
                <MaterialIcons name="event-note" size={24} color={COLORS.outline} />
                <Text style={styles.noUpcomingText}>No upcoming elections scheduled.</Text>
             </View>
           ) : (
             <ScrollView 
               horizontal 
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.horizontalScrollContent}
               decelerationRate="fast"
               snapToInterval={width * 0.75 + 16}
             >
               {upcomingElections.slice(0, 3).map((election, index) => (
                 <TouchableOpacity 
                   key={election.id || index} 
                   style={styles.minimalPremiumCard}
                   activeOpacity={0.9}
                   onPress={() => navigation.navigate('Elections')}
                 >
                    <View style={styles.cardAccentBar} />
                    <View style={styles.minimalCardContent}>
                      <View style={styles.premiumCardTop}>
                         <View style={styles.minimalDatePill}>
                            <Text style={styles.minimalDateText}>
                               {new Date(election.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                            </Text>
                         </View>
                         <View style={styles.minimalTypeBadge}>
                            <Text style={styles.minimalTypeBadgeText}>{election.election_type || 'GENERAL'}</Text>
                         </View>
                      </View>
                      
                      <View style={styles.minimalCardBody}>
                         <Text style={styles.minimalEventTitle} numberOfLines={2}>{election.title}</Text>
                      </View>

                      <View style={styles.minimalCardFooter}>
                         <View style={styles.minimalInfoRow}>
                            <MaterialIcons name="schedule" size={16} color="#6366f1" />
                            <Text style={styles.minimalInfoText}>
                               {new Date(election.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                         </View>
                         <View style={[styles.footerCircleBtn, { backgroundColor: '#6366f1' }]}>
                            <MaterialIcons name="arrow-forward" size={14} color="#fff" />
                         </View>
                      </View>
                    </View>
                 </TouchableOpacity>
               ))}
             </ScrollView>
           )}
        </View>
        
        <TouchableOpacity style={styles.viewCalendarBtn} onPress={() => navigation.navigate('Elections')}>
           <MaterialIcons name="event-note" size={18} color={COLORS.primary} />
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
      web: { 
        // @ts-ignore
        boxShadow: `0px 10px 15px ${COLORS.primary}4D` 
      }
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
  activeHeroContainer: { marginBottom: 16 },
  
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

  emptyActiveCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.outlineVariant, marginBottom: 32 },
  emptyActiveText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.7 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIndicator: { width: 6, height: 24, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.onSurface },

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
  viewCalendarBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, 
    backgroundColor: '#fff',
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 40,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  viewCalendarText: { color: COLORS.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  noUpcomingText: { fontSize: 14, color: COLORS.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  emptyUpcomingCard: { padding: 32, alignItems: 'center', justifyContent: 'center' },

  // Redesigned Event Cards
  modernEventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  modernDateColumn: {
    width: 56,
    height: 64,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernDateMonth: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modernDateDay: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
  },
  modernEventInfo: {
    flex: 1,
    gap: 6,
  },
  modernEventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernEventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    flex: 1,
    marginRight: 8,
  },
  modernEventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernDetailText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  modernDetailDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
  },
  modernTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTypeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  // Premium Carousel Styles
  carouselContainer: {
    marginHorizontal: -16,
    marginBottom: 24,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8, // For shadow visibility
  },
  premiumEventCard: {
    width: width * 0.75,
    height: 180,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 10 }
    })
  },
  premiumCardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  premiumCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumDatePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  premiumDateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  premiumTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  premiumTypeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumCardBody: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  premiumEventTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
    letterSpacing: -0.8,
  },
  premiumCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumInfoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  footerCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Minimalist Premium Card Styles
  minimalPremiumCard: {
    width: width * 0.75,
    height: 150,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 }
    })
  },
  cardAccentBar: {
    width: 6,
    height: '100%',
    backgroundColor: '#6366f1',
  },
  minimalCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  minimalDatePill: {
    backgroundColor: '#6366f115',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f125',
  },
  minimalDateText: {
    color: '#4f46e5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  minimalTypeBadge: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  minimalTypeBadgeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  minimalCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  minimalEventTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.onSurface,
    lineHeight: 25,
    letterSpacing: -0.5,
  },
  minimalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minimalInfoText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
});

export default DashboardScreen;
