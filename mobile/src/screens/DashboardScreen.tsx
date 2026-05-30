import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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
  const [stats, setStats] = useState({ activeElections: 0, totalElections: 0, completedElections: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const elections = await electionService.getElections();
      const active = elections.filter((e: any) => e.status === 'active');
      const completed = elections.filter((e: any) => e.status === 'completed');
      setActiveElections(active);
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
          <View style={styles.abstractCircle1} />
          <View style={styles.abstractCircle2} />
          
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>OFFICIAL MEMBER CARD</Text>
              <Text style={styles.cardUserName}>{user?.full_name || "Sarah Jenkins"}</Text>
              <Text style={styles.cardUserId}>ID: #FED-992-{(user?.id || 4).toString().padStart(3, '0')}</Text>
            </View>
            <View style={styles.qrContainer}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNx6PUH8puKvsqtPDrQm43SK8dl2b_U22KHvcbcs5ppPRWzxoOF83Sk-xs2xCFFccmwYg7yqBoVFGDbjNvfXxGfNHCxLSrQIP6fOOBx-Tl1DHpBOdGIQBJj3CrAMMCAzAk02md7gv0NeBTZ4oIkc9e8V5hsvRtcrFLRKLNDrgiZ3PAKtZhyNfcBqF-6LX4zSe-9NXVj4-0cKDdJb_qMPYMd-4mZnZQ1dNe4HNQ-JAWXSOzyXjemBeNydOTlB9nJA_RLjOFuDlTrok' }} 
                style={styles.qrCode} 
              />
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

        {/* Party Announcements */}
        <View style={styles.sectionHeader}>
           <View style={styles.sectionTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: COLORS.tertiary }]} />
              <Text style={styles.sectionTitle}>Party Announcements</Text>
           </View>
           <View style={styles.carouselArrows}>
              <TouchableOpacity style={styles.arrowBtn}><MaterialIcons name="chevron-left" size={20} /></TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn}><MaterialIcons name="chevron-right" size={20} /></TouchableOpacity>
           </View>
        </View>

        <View style={styles.announcementCard}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxmPui_aIIZh9Brv6ZSbBCPEKQUJf2QDW7JrV3i9cVGUBoAX4DaBpt-R61Wt55tR8KecfBTJotxVA86puEYsxf39WErSXmyF5cJ3iGoRUov6FaTbBJBoYdnOChuGJKSmKovzFSuAsWD2w9aErs9kalWONVn095BZc0w6Y9nhsbljN0TvesWiMR6y5u8EFPsMA5stDqJ9kQtERYHXnXVtgybtB2g_6XQ4xqhOsBIQMTnizZQRkcp_9hxR55Rox_U0Gvbq7kNooes0A' }} 
            style={styles.announcementImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.announcementOverlay}
          >
            <View style={styles.updateBadge}>
              <Text style={styles.updateBadgeText}>IMPORTANT UPDATE</Text>
            </View>
            <Text style={styles.announcementTitle}>National Platform 2026: Economic Sustainability & Reform</Text>
            <Text style={styles.announcementSub}>Discover the key pillars of our new fiscal agenda designed to empower the middle class and secure democratic infrastructure.</Text>
            <TouchableOpacity style={styles.readMoreBtn}>
              <Text style={styles.readMoreText}>Read More</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Active Elections */}
        <View style={styles.sectionHeader}>
           <View style={styles.sectionTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.sectionTitle}>Active Elections</Text>
           </View>
        </View>

        {activeElections.length === 0 ? (
          <View style={styles.electionCard}>
             <View style={styles.electionContent}>
               <Text style={styles.electionTitle}>No active elections currently.</Text>
             </View>
          </View>
        ) : (
            activeElections.map((election, index) => (
             <View key={election.id || index} style={styles.electionCard}>
                <TouchableOpacity 
                   style={styles.electionHeader}
                   onPress={() => navigation.navigate('Voting', { election })}
                   activeOpacity={0.7}
                >
                  <View>
                     <Text style={styles.electionTitle}>{election.title}</Text>
                     <Text style={styles.electionSub}>Type: {election.election_type}</Text>
                  </View>
                  <View style={styles.liveBadge}>
                     <View style={styles.liveDot} />
                     <Text style={styles.liveText}>LIVE NOW</Text>
                  </View>
               </TouchableOpacity>
               
               <View style={styles.electionContent}>
                  <View style={styles.voterStatusRow}>
                     <View style={styles.voterIconContainer}>
                        <MaterialIcons name="how-to-vote" size={24} color={COLORS.primary} />
                     </View>
                     <View>
                        <Text style={styles.voterStatusTitle}>Your Voting Status</Text>
                        <Text style={styles.voterStatusSub}>Registered & Eligible</Text>
                     </View>
                  </View>
                  
                  <View style={styles.progressBarBg}>
                     <View style={[styles.progressBarFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.turnoutText}>Turnout data pending...</Text>
                  
                  <TouchableOpacity style={styles.voteNowBtn} onPress={() => navigation.navigate('Voting', { election })}>
                     <Text style={styles.voteNowText}>Vote Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.viewProfilesBtn} onPress={() => navigation.navigate('Voting', { election })}>
                     <Text style={styles.viewProfilesText}>View Candidate Profiles</Text>
                  </TouchableOpacity>
               </View>
            </View>
          ))
        )}

        {/* Upcoming Events */}
        <View style={styles.sectionHeader}>
           <View style={styles.sectionTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: COLORS.tertiary }]} />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
           </View>
        </View>

        <View style={styles.eventsList}>
           <EventItem 
              month="MAY" day="12" 
              title="Citizens' Town Hall Rally" 
              location="Civic Plaza Main Hall"
              type="RALLY" time="18:00 - 21:00"
              color={COLORS.tertiaryFixed}
              onColor={COLORS.onTertiaryFixed}
           />
           <EventItem 
              month="MAY" day="15" 
              title="Neighborhood Outreach" 
              location="Community Hub South"
              type="VOLUNTEER" time="10:00 - 14:00"
              color={COLORS.secondaryContainer}
              onColor={COLORS.onSecondaryContainer}
           />
           <EventItem 
              month="MAY" day="20" 
              title="Policy Discussion Panel" 
              location="Virtual (Member Link)"
              type="WEBINAR" time="19:30"
              color={COLORS.surfaceContainerHighest}
              onColor={COLORS.onSurfaceVariant}
           />
        </View>
        
        <TouchableOpacity style={styles.viewCalendarBtn}>
           <Text style={styles.viewCalendarText}>View Calendar</Text>
        </TouchableOpacity>

        {/* Bento Stats */}
        <View style={styles.statsGrid}>
           <StatCard label="Active Members" value="1.2M" sub="+4.2% this mo" subColor={COLORS.secondary} />
           <StatCard label="Proposals Passed" value="84" sub="Since Jan 2026" />
           <StatCard label="Volunteer Hours" value="450k" sub="New Record!" subColor={COLORS.secondary} />
           <StatCard label="Impact Level" value="A+" isRating />
        </View>

      </ScrollView>
    </View>
  );
};

const EventItem = ({ month, day, title, location, type, time, color, onColor }: any) => (
  <TouchableOpacity style={styles.eventCard}>
     <View style={[styles.dateBlock, { backgroundColor: color }]}>
        <Text style={[styles.dateMonth, { color: onColor }]}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
     </View>
     <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.locationRow}>
           <MaterialIcons name="location-on" size={12} color={COLORS.onSurfaceVariant} />
           <Text style={styles.eventLocation}>{location}</Text>
        </View>
        <View style={styles.eventFooter}>
           <View style={[styles.typeBadge, { backgroundColor: color }]}>
              <Text style={[styles.typeBadgeText, { color: onColor }]}>{type}</Text>
           </View>
           <Text style={styles.eventTime}>{time}</Text>
        </View>
     </View>
  </TouchableOpacity>
);

const StatCard = ({ label, value, sub, subColor, isRating }: any) => (
  <View style={styles.statCard}>
     <Text style={styles.statLabel}>{label}</Text>
     <Text style={styles.statValue}>{value}</Text>
     {isRating ? (
        <View style={styles.starsRow}>
           {[1,2,3,4,5].map(i => (
              <MaterialIcons key={i} name="star" size={12} color={COLORS.tertiary} />
           ))}
        </View>
     ) : (
        <Text style={[styles.statSub, subColor && { color: subColor }]}>{sub}</Text>
     )}
  </View>
);

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
      android: { elevation: 10 }
    })
  },
  abstractCircle1: {
    position: 'absolute',
    top: -48,
    right: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  qrContainer: { backgroundColor: '#fff', padding: 4, borderRadius: 8 },
  qrCode: { width: 64, height: 64 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tierBadge: { backgroundColor: COLORS.tertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tierBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  expiresText: { color: COLORS.onPrimaryContainer, fontSize: 12, marginTop: 8 },
  voteText: { color: '#fff', fontSize: 24, fontWeight: '700', fontStyle: 'italic', letterSpacing: -1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIndicator: { width: 6, height: 24, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.onSurface },
  carouselArrows: { flexDirection: 'row', gap: 8 },
  arrowBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORS.outlineVariant, justifyContent: 'center', alignItems: 'center' },

  announcementCard: { height: 320, borderRadius: 16, overflow: 'hidden', marginBottom: 32 },
  announcementImage: { width: '100%', height: '100%' },
  announcementOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, justifyContent: 'flex-end' },
  updateBadge: { backgroundColor: COLORS.tertiary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 12 },
  updateBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  announcementTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8, lineHeight: 30 },
  announcementSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 },
  readMoreBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
  readMoreText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

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
  voteNowBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  voteNowText: { color: '#fff', fontSize: 18, fontWeight: '700' },
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

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  statSub: { fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: '700', marginTop: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 }
});

export default DashboardScreen;
