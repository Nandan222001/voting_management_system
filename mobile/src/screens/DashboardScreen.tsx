import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Platform, Alert, useWindowDimensions, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { electionService } from '../services/electionService';
import { tenantService } from '../services/tenantService';
import { Announcement, announcementService } from '../services/announcementService';
import { mediaService } from '../services/mediaService';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { width } = useWindowDimensions();
  const [activeElections, setActiveElections] = useState<any[]>([]);
  const [upcomingElections, setUpcomingElections] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeElections: 0, totalElections: 0, completedElections: 0 });
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState(user?.membership_plan?.name || 'Standard Member');
  const [tenantName, setTenantName] = useState<string>('VOTE2026');

  const loadData = async () => {
    const latestPromise = announcementService.getLatest().catch((announcementError) => {
      console.error('Failed to load latest announcement', announcementError);
      return null;
    });

    const tenantPromise = tenantService.getCurrentTenant().then(data => {
      if (data?.name) {
        setTenantName(data.name.toUpperCase());
      }
    }).catch(err => {
      console.error('Failed to load tenant info', err);
    });

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
      }).sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

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
      showToast.error('Load Error', 'Could not refresh dashboard data.');
    } finally {
      await Promise.all([latestPromise.then(setLatestAnnouncement), tenantPromise]);
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
                <Text style={styles.tierBadgeText}>{planName.toUpperCase()} TIER</Text>
              </View>
              <Text style={styles.expiresText}>Expires: 12/2026</Text>
            </View>
            <Text style={styles.voteText}>{tenantName}</Text>
          </View>
        </LinearGradient>

        {/* Latest Announcement */}
        <View style={styles.sectionHeader}>
           <View style={styles.sectionTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.sectionTitle}>Latest Announcement</Text>
           </View>
        </View>

        {latestAnnouncement ? (
          <View style={styles.announcementBlock}>
            <TouchableOpacity
              style={styles.announcementCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AnnouncementDetail', { id: latestAnnouncement.id, announcement: latestAnnouncement })}
            >
              {latestAnnouncement.image_urls?.[0] ? (
                <Image source={{ uri: mediaService.getFileUrl(latestAnnouncement.image_urls[0]) }} style={styles.announcementImage} />
              ) : (
                <View style={styles.announcementFallback}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=800' }} 
                    style={styles.announcementImage} 
                  />
                </View>
              )}
              <View style={styles.announcementContent}>
                <View style={styles.announcementMetaRow}>
                  <Text style={styles.announcementDate}>
                    {new Date(latestAnnouncement.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  {latestAnnouncement.is_featured && (
                    <View style={styles.announcementFeatured}>
                      <MaterialIcons name="star" size={12} color={COLORS.primary} />
                      <Text style={styles.announcementFeaturedText}>Featured</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.announcementTitle} numberOfLines={2}>{latestAnnouncement.title}</Text>
                <Text style={styles.announcementDescription} numberOfLines={2}>{latestAnnouncement.short_description}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewAnnouncementsBtn} onPress={() => navigation.navigate('AnnouncementsList')}>
              <MaterialIcons name="campaign" size={18} color={COLORS.primary} />
              <Text style={styles.viewAnnouncementsText}>View All Announcements</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyAnnouncementCard}>
             <MaterialIcons name="campaign" size={26} color={COLORS.outline} />
             <Text style={styles.emptyActiveText}>No published announcements.</Text>
          </View>
        )}

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
                  style={styles.heroPremiumCard}
                  onPress={() => navigation.navigate('Elections', { screen: 'Voting', params: { election } })}
                  activeOpacity={0.9}
                >
                  <View style={[styles.premiumCardDateCol, { backgroundColor: COLORS.secondary + '05', borderRightColor: COLORS.secondary + '10' }]}>
                     <View style={[styles.premiumDateBlock, { backgroundColor: COLORS.secondary + '15' }]}>
                        <Text style={[styles.premiumDateMonth, { color: COLORS.secondary }]}>
                           {new Date(election.start_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                        </Text>
                        <Text style={[styles.premiumDateDay, { color: COLORS.onSurface }]}>
                           {new Date(election.start_date).getDate()}
                        </Text>
                     </View>
                     <View style={[styles.premiumStatusBadgeMini, { backgroundColor: COLORS.secondary + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: COLORS.secondary }]} />
                        <Text style={[styles.statusTextMini, { color: COLORS.secondary }]}>LIVE NOW</Text>
                     </View>
                  </View>

                  <View style={styles.minimalCardContent}>
                    <View style={styles.minimalCardTopRow}>
                       <View style={[styles.minimalTypeBadge, { backgroundColor: COLORS.secondary + '10' }]}>
                          <Text style={[styles.minimalTypeBadgeText, { color: COLORS.secondary }]}>{election.election_type || 'GENERAL'}</Text>
                       </View>
                       <View style={styles.liveIndicator}>
                          <View style={styles.livePulse} />
                          <Text style={styles.liveIndicatorText}>ACTIVE</Text>
                       </View>
                    </View>
                    
                    <View style={styles.minimalCardBody}>
                       <Text style={styles.minimalEventTitle} numberOfLines={2}>{election.title}</Text>
                    </View>

                    <View style={styles.minimalCardFooter}>
                       <View style={styles.minimalInfoRow}>
                          <MaterialIcons name="how-to-vote" size={14} color={COLORS.secondary} />
                          <Text style={[styles.minimalInfoText, { color: COLORS.secondary }]}>
                             Eligible to Vote
                          </Text>
                       </View>
                       <View style={[styles.footerCircleBtn, { backgroundColor: COLORS.secondary }]}>
                          <MaterialIcons name="chevron-right" size={14} color="#fff" />
                       </View>
                    </View>
                  </View>
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

        <View style={styles.upcomingListContainer}>
           {upcomingElections.length === 0 ? (
             <View style={styles.emptyUpcomingCard}>
                <MaterialIcons name="event-note" size={24} color={COLORS.outline} />
                <Text style={styles.noUpcomingText}>No upcoming elections scheduled.</Text>
             </View>
           ) : (
             <View style={styles.verticalList}>
               {upcomingElections.slice(0, 3).map((election, index) => (
                 <TouchableOpacity 
                   key={election.id || index} 
                   style={styles.minimalPremiumCard}
                   activeOpacity={0.9}
                   onPress={() => navigation.navigate('Elections')}
                 >
                    <View style={styles.premiumCardDateCol}>
                       <View style={[styles.premiumDateBlock, { backgroundColor: '#6366f115' }]}>
                          <Text style={[styles.premiumDateMonth, { color: '#4f46e5' }]}>
                             {new Date(election.start_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                          </Text>
                          <Text style={[styles.premiumDateDay, { color: COLORS.onSurface }]}>
                             {new Date(election.start_date).getDate()}
                          </Text>
                       </View>
                       <View style={styles.premiumStatusBadgeMini}>
                          <View style={[styles.statusDot, { backgroundColor: '#6366f1' }]} />
                          <Text style={styles.statusTextMini}>UPCOMING</Text>
                       </View>
                    </View>

                    <View style={styles.minimalCardContent}>
                      <View style={styles.minimalCardTopRow}>
                         <View style={styles.minimalTypeBadge}>
                            <Text style={styles.minimalTypeBadgeText}>{election.election_type || 'GENERAL'}</Text>
                         </View>
                         <TouchableOpacity style={styles.infoBtnMini}>
                            <MaterialIcons name="info-outline" size={14} color={COLORS.primary} />
                         </TouchableOpacity>
                      </View>
                      
                      <View style={styles.minimalCardBody}>
                         <Text style={styles.minimalEventTitle} numberOfLines={2}>{election.title}</Text>
                      </View>

                      <View style={styles.minimalCardFooter}>
                         <View style={styles.minimalInfoRow}>
                            <MaterialIcons name="schedule" size={14} color="#6366f1" />
                            <Text style={styles.minimalInfoText}>
                               {new Date(election.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                         </View>
                         <View style={[styles.footerCircleBtn, { backgroundColor: '#6366f1' }]}>
                            <MaterialIcons name="chevron-right" size={14} color="#fff" />
                         </View>
                      </View>
                    </View>
                 </TouchableOpacity>
               ))}
             </View>
           )}
        </View>
        
        <TouchableOpacity style={styles.viewCalendarBtn} onPress={() => navigation.navigate('Elections')}>
           <MaterialIcons name="event-note" size={18} color="#fff" />
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

  announcementBlock: { marginBottom: 28 },
  announcementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  announcementImage: { width: '100%', height: 160, backgroundColor: COLORS.surfaceContainerLow },
  announcementFallback: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },
  announcementContent: { padding: 16 },
  announcementMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 25 },
  announcementDate: { fontSize: 11, fontWeight: '800', color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  announcementFeatured: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '12', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  announcementFeaturedText: { fontSize: 9, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase' },
  announcementTitle: { fontSize: 19, fontWeight: '900', color: COLORS.onSurface, lineHeight: 24 },
  announcementDescription: { marginTop: 6, fontSize: 13, fontWeight: '600', color: COLORS.onSurfaceVariant, lineHeight: 19 },
  viewAnnouncementsBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  viewAnnouncementsText: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  emptyAnnouncementCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 20, padding: 28, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.outlineVariant, marginBottom: 28 },

  heroPremiumCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  liveIndicatorText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },

  emptyActiveCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.outlineVariant, marginBottom: 32 },
  emptyActiveText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.7 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIndicator: { width: 6, height: 24, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.onSurface },

  viewCalendarBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, 
    backgroundColor: COLORS.primary,
    borderRadius: 16, 
    marginBottom: 40,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  viewCalendarText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  noUpcomingText: { fontSize: 14, color: COLORS.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  emptyUpcomingCard: { padding: 32, alignItems: 'center', justifyContent: 'center' },

  upcomingListContainer: {
    marginBottom: 24,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8, // For shadow visibility
  },
  footerCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  verticalList: {
    gap: 12,
    alignItems: 'center',
  },
  minimalPremiumCard: {
    width: '100%',
    height: 130,
    borderRadius: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  premiumCardDateCol: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.surfaceContainerLow,
    backgroundColor: '#fcfcfe',
  },
  premiumDateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 14,
  },
  premiumDateMonth: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumDateDay: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },
  premiumStatusBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusTextMini: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  minimalCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  minimalCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBtnMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalTypeBadge: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  minimalTypeBadgeText: {
    color: COLORS.onSurfaceVariant, fontSize: 9, fontWeight: '800', letterSpacing: 0.3,
  },
  minimalCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  minimalEventTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  minimalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minimalInfoText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    opacity: 0.8,
  },
});

export default DashboardScreen;
