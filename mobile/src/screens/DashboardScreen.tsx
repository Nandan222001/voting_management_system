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
import { hs, vs, ms } from '../utils/responsive';

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
      console.log('No current tenant info available');
    });

    try {
      let response;
      try {
        response = await electionService.getElections(false, 1, 100);
      } catch (err: any) {
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
        contentContainerStyle={{ paddingBottom: vs(40) }}
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
                      <MaterialIcons name="star" size={ms(12)} color={COLORS.primary} />
                      <Text style={styles.announcementFeaturedText}>Featured</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.announcementTitle} numberOfLines={2}>{latestAnnouncement.title}</Text>
                <Text style={styles.announcementDescription} numberOfLines={2}>{latestAnnouncement.short_description}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewAnnouncementsBtn} onPress={() => navigation.navigate('AnnouncementsList')}>
              <MaterialIcons name="campaign" size={ms(18)} color={COLORS.primary} />
              <Text style={styles.viewAnnouncementsText}>View All Announcements</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyAnnouncementCard}>
             <MaterialIcons name="campaign" size={ms(26)} color={COLORS.outline} />
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
                          <MaterialIcons name="how-to-vote" size={ms(14)} color={COLORS.secondary} />
                          <Text style={[styles.minimalInfoText, { color: COLORS.secondary }]}>
                             Eligible to Vote
                          </Text>
                       </View>
                       <View style={[styles.footerCircleBtn, { backgroundColor: COLORS.secondary }]}>
                          <MaterialIcons name="chevron-right" size={ms(14)} color="#fff" />
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
             <MaterialIcons name="event-busy" size={ms(32)} color={COLORS.outline} />
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
                <MaterialIcons name="event-note" size={ms(24)} color={COLORS.outline} />
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
                      </View>
                      
                      <View style={styles.minimalCardBody}>
                         <Text style={styles.minimalEventTitle} numberOfLines={2}>{election.title}</Text>
                      </View>

                      <View style={styles.minimalCardFooter}>
                         <View style={styles.minimalInfoRow}>
                            <MaterialIcons name="schedule" size={ms(14)} color="#6366f1" />
                            <Text style={styles.minimalInfoText}>
                               {new Date(election.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                         </View>
                         <View style={[styles.footerCircleBtn, { backgroundColor: '#6366f1' }]}>
                            <MaterialIcons name="chevron-right" size={ms(14)} color="#fff" />
                         </View>
                      </View>
                    </View>
                 </TouchableOpacity>
               ))}
             </View>
           )}
        </View>
        
        <TouchableOpacity style={styles.viewCalendarBtn} onPress={() => navigation.navigate('Elections')}>
           <MaterialIcons name="event-note" size={ms(18)} color="#fff" />
           <Text style={styles.viewCalendarText}>View All Elections</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: hs(16) },
  
  welcomeSection: { marginTop: vs(24), marginBottom: vs(24) },
  welcomeTitle: { fontSize: ms(32), fontWeight: '700', color: COLORS.primary, letterSpacing: -1 },
  delegateName: { fontSize: ms(32), fontWeight: '700', color: COLORS.primary, letterSpacing: -1, marginTop: vs(-4) },
  welcomeSubtext: { fontSize: ms(16), color: COLORS.onSurfaceVariant, marginTop: vs(8), lineHeight: vs(22) },
  
  membershipCard: {
    borderRadius: ms(8),
    padding: ms(24),
    height: vs(200),
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: vs(32),
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
    bottom: vs(-24),
    left: hs(-24),
    width: ms(128),
    height: ms(128),
    borderRadius: ms(64),
    backgroundColor: 'rgba(141, 252, 117, 0.1)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: ms(12), fontWeight: '700', letterSpacing: 0.5 },
  cardUserName: { color: '#fff', fontSize: ms(18), fontWeight: '600', marginTop: vs(4) },
  cardUserId: { color: 'rgba(255,255,255,0.7)', fontSize: ms(12), marginTop: vs(2) },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tierBadge: { backgroundColor: COLORS.tertiary, paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: ms(4) },
  tierBadgeText: { color: '#fff', fontSize: ms(10), fontWeight: '700' },
  expiresText: { color: COLORS.onPrimaryContainer, fontSize: ms(12), marginTop: vs(8) },
  voteText: { color: '#fff', fontSize: ms(24), fontWeight: '700', fontStyle: 'italic', letterSpacing: -1 },

  announcementBlock: { marginBottom: vs(28) },
  announcementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ms(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  announcementImage: { width: '100%', height: vs(160), backgroundColor: COLORS.surfaceContainerLow },
  announcementFallback: { height: vs(120), alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary + '10' },
  announcementContent: { padding: ms(16) },
  announcementMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(8), marginTop: vs(25) },
  announcementDate: { fontSize: ms(11), fontWeight: '800', color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  announcementFeatured: { flexDirection: 'row', alignItems: 'center', gap: hs(4), backgroundColor: COLORS.primary + '12', paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: ms(8) },
  announcementFeaturedText: { fontSize: ms(9), fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase' },
  announcementTitle: { fontSize: ms(19), fontWeight: '900', color: COLORS.onSurface, lineHeight: vs(24) },
  announcementDescription: { marginTop: vs(6), fontSize: ms(13), fontWeight: '600', color: COLORS.onSurfaceVariant, lineHeight: vs(19) },
  viewAnnouncementsBtn: {
    marginTop: vs(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    paddingVertical: vs(14),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  viewAnnouncementsText: { color: COLORS.primary, fontSize: ms(13), fontWeight: '900' },
  emptyAnnouncementCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: ms(10), padding: ms(28), alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.outlineVariant, marginBottom: vs(28) },

  heroPremiumCard: {
    borderRadius: ms(12),
    backgroundColor: '#fff',
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: vs(16),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  livePulse: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: COLORS.secondary,
  },
  liveIndicatorText: {
    fontSize: ms(8),
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },

  emptyActiveCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: ms(12), padding: ms(40), alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.outlineVariant, marginBottom: vs(32) },
  emptyActiveText: { marginTop: vs(12), fontSize: ms(14), fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.7 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16), marginTop: vs(8) },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: hs(8) },
  titleIndicator: { width: hs(6), height: vs(24), borderRadius: ms(3) },
  sectionTitle: { fontSize: ms(18), fontWeight: '600', color: COLORS.onSurface },

  viewCalendarBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(16), 
    backgroundColor: COLORS.primary,
    borderRadius: ms(8), 
    marginBottom: vs(40),
    gap: hs(10),
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  viewCalendarText: { color: '#fff', fontWeight: '800', fontSize: ms(14), letterSpacing: 0.5 },
  noUpcomingText: { fontSize: ms(14), color: COLORS.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center', marginTop: vs(8) },
  emptyUpcomingCard: { padding: ms(32), alignItems: 'center', justifyContent: 'center' },

  upcomingListContainer: {
    marginBottom: vs(24),
  },
  footerCircleBtn: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(8),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  verticalList: {
    gap: vs(12),
    alignItems: 'center',
  },
  minimalPremiumCard: {
    width: '100%',
    height: vs(130),
    borderRadius: ms(12),
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
    width: hs(80),
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.surfaceContainerLow,
    backgroundColor: '#fcfcfe',
  },
  premiumDateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ms(8),
    borderRadius: ms(8),
  },
  premiumDateMonth: {
    fontSize: ms(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumDateDay: {
    fontSize: ms(22),
    fontWeight: '900',
    marginTop: vs(-2),
  },
  premiumStatusBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    marginTop: vs(8),
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: hs(6),
    paddingVertical: vs(2),
    borderRadius: ms(4),
  },
  statusDot: {
    width: ms(4),
    height: ms(4),
    borderRadius: ms(2),
  },
  statusTextMini: {
    fontSize: ms(7),
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  minimalCardContent: {
    flex: 1,
    padding: ms(12),
    justifyContent: 'space-between',
  },
  minimalCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimalTypeBadge: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: hs(8), paddingVertical: vs(3), borderRadius: ms(4),
  },
  minimalTypeBadgeText: {
    color: COLORS.onSurfaceVariant, fontSize: ms(9), fontWeight: '800', letterSpacing: 0.3,
  },
  minimalCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  minimalEventTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: COLORS.onSurface,
    lineHeight: vs(22),
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
    gap: hs(4),
  },
  minimalInfoText: {
    fontSize: ms(12),
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    opacity: 0.8,
  },
});

export default DashboardScreen;
