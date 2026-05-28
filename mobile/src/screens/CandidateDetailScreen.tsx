import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  surfaceContainer: '#edeef0',
  surfaceContainerLow: '#f3f4f6',
  surfaceContainerHigh: '#e7e8ea',
  outline: '#737685',
  primaryFixed: '#dae2ff',
};

const CandidateDetailScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('biography');
  
  // Default data from template, could be overridden by route params
  const candidate = route.params?.candidate || {
    full_name: 'Amitav R. Bharadwaj',
    role: 'Minister of Urban Development & Infrastructure',
    constituency: 'South Delhi Constituency',
    party: "National People's Party",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQdV_knkcvdeI10Dw9S_MuEhlnu-4YXUCDc88ajKtaUq1xSXBnB_ThUUWYn-RI_oynHeKjuh4UEjzRrNuCWnSK8Ve9RnOr8sGIAw_zbZsikGKG9gxKN40_W2PFml-0x3cYdPRLjDzB56fDbmHoztaQ2Vg-FqmCdgfMEOMmSi-jyrGpJ48eLwTPbM_eIp1maaejZffo3EjdqyJWistYkqGSoPIZg9by07U-6SnpCOujAxjFKiNSH03rhurfXeE-ZWPLpA1JE0FwavM',
    cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCQHjDXBuZy3unGDlf-zaQ6qqlAWjEjLYxu2BmRHM-F9UmkMVvAKMZAKKqC0ifzoIf7VQeVX7niwpMExanQzxVuQhK7Uz_6CHu7lSDr3cdSV7r_Fc8wxI8V0QwJaW3dSZoDrOYZB_IHOBfQj9b_SGytcFPio-TbjIWpNjoKGOSiZcOgJdC6qSm0kJIPxADnzX1bMbR8TkYIrsJrvF7JH1jDQUunU6k2EwriHwDKmvrfagL6yezSfj-hz66ITdKgzUM6idWJtkz-Bc'
  };

  const BiographyTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.contentHeader}>
        <MaterialIcons name="article" size={24} color={COLORS.primary} />
        <Text style={styles.contentTitle}>Candidate Vision & Statement</Text>
      </View>
      <Text style={styles.quoteText}>
        "Transforming our cities into global hubs of sustainability and technological excellence requires more than just policy—it requires a shared national commitment to integrity and innovation."
      </Text>
      <Text style={styles.bodyText}>
        Amitav R. Bharadwaj has served as the Minister of Urban Development for the past five years, overseeing the implementation of the 'Smart City Initiative' across 12 major metropolitan areas.
      </Text>
      <View style={styles.eduExpGrid}>
        <View style={styles.eduExpCard}>
          <Text style={styles.eduExpLabel}>EDUCATION</Text>
          <Text style={styles.eduExpValue}>M.P.P. Harvard Kennedy School</Text>
        </View>
        <View style={styles.eduExpCard}>
          <Text style={styles.eduExpLabel}>EXPERIENCE</Text>
          <Text style={styles.eduExpValue}>15+ Years Public Service</Text>
        </View>
      </View>
      <Text style={styles.bodyText}>
        Throughout his tenure, Minister Bharadwaj has focused on high-density utility planning, significantly reducing urban congestion by 22% through the 'Green-Flow' transit protocol.
      </Text>
    </View>
  );

  const ProposalsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.proposalCard}>
        <MaterialIcons name="bolt" size={32} color={COLORS.primary} />
        <Text style={styles.proposalTitle}>Renewable Grid 2030</Text>
        <Text style={styles.proposalDesc}>Transitioning all municipal buildings to 100% solar energy by the end of the next fiscal term.</Text>
      </View>
      <View style={styles.proposalCard}>
        <MaterialIcons name="school" size={32} color={COLORS.primary} />
        <Text style={styles.proposalTitle}>Tech-Ed Literacy</Text>
        <Text style={styles.proposalDesc}>Providing vocational AI and coding training to 1 million youth in urban under-served districts.</Text>
      </View>
    </View>
  );

  const EndorsementsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.bodyText}>Major organizations and leaders supporting this candidate.</Text>
      <View style={styles.endorsementPreview}>
        <View style={styles.endorsementAvatars}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.endorsementRing}>
               <Image 
                source={{ uri: `https://ui-avatars.com/api/?name=Org${i}&background=random` }} 
                style={styles.endorsementAvatar} 
               />
            </View>
          ))}
          <View style={[styles.endorsementRing, styles.moreEndorsements]}>
            <Text style={styles.moreText}>+24</Text>
          </View>
        </View>
        <Text style={styles.endorsementQuote}>
          "Minister Bharadwaj has shown unparalleled commitment to technical rigor." — Federation of Indian Industries
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: candidate.cover }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
          
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.profileInfoContainer}>
             <View style={styles.portraitWrapper}>
                <Image source={{ uri: candidate.image }} style={styles.portrait} />
             </View>
             
             <View style={styles.mainMeta}>
                <View style={styles.badgeRow}>
                   <View style={styles.verifiedBadge}>
                      <Text style={styles.badgeText}>VERIFIED CANDIDATE</Text>
                   </View>
                   <View style={styles.incumbentBadge}>
                      <Text style={styles.badgeText}>INCUMBENT</Text>
                   </View>
                </View>
                <Text style={styles.candidateName}>{candidate.full_name}</Text>
                <Text style={styles.candidateRole}>{candidate.role}</Text>
                
                <View style={styles.locationPartyRow}>
                   <View style={styles.metaItem}>
                      <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.metaText}>{candidate.constituency}</Text>
                   </View>
                   <View style={styles.metaItem}>
                      <MaterialIcons name="groups" size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.metaText}>{candidate.party}</Text>
                   </View>
                </View>
             </View>

             <View style={styles.actionRow}>
                <TouchableOpacity style={styles.followBtn}>
                   <MaterialIcons name="person-add" size={20} color="#fff" />
                   <Text style={styles.followBtnText}>FOLLOW</Text>
                </TouchableOpacity>
                <View style={styles.socialBtns}>
                   <TouchableOpacity style={styles.iconBtn}><MaterialIcons name="share" size={20} color="#fff" /></TouchableOpacity>
                   <TouchableOpacity style={styles.iconBtn}><MaterialIcons name="public" size={20} color="#fff" /></TouchableOpacity>
                </View>
             </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Tabbed Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'biography' && styles.activeTabButton]}
              onPress={() => setActiveTab('biography')}
            >
              <Text style={[styles.tabText, activeTab === 'biography' && styles.activeTabText]}>Biography</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'proposals' && styles.activeTabButton]}
              onPress={() => setActiveTab('proposals')}
            >
              <Text style={[styles.tabText, activeTab === 'proposals' && styles.activeTabText]}>Proposals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'endorsements' && styles.activeTabButton]}
              onPress={() => setActiveTab('endorsements')}
            >
              <Text style={[styles.tabText, activeTab === 'endorsements' && styles.activeTabText]}>Endorsements</Text>
            </TouchableOpacity>
          </View>

          {/* Active Tab Content */}
          <View style={styles.contentCard}>
            {activeTab === 'biography' && <BiographyTab />}
            {activeTab === 'proposals' && <ProposalsTab />}
            {activeTab === 'endorsements' && <EndorsementsTab />}
          </View>

          {/* Campaign Metrics */}
          <View style={styles.metaCard}>
             <Text style={styles.cardLabel}>CAMPAIGN METRICS</Text>
             <MetricRow label="Voter Approval" value="78.4%" color={COLORS.secondary} />
             <MetricRow label="Fundraising Goal" value="85% Reached" />
             <MetricRow label="Volunteers" value="12,400+" isLast />
             <TouchableOpacity style={styles.fullAnalyticsBtn}>
                <Text style={styles.fullAnalyticsText}>VIEW FULL ANALYTICS</Text>
             </TouchableOpacity>
          </View>

          {/* Upcoming Events */}
          <View style={styles.metaCard}>
             <Text style={styles.cardLabel}>UPCOMING EVENTS</Text>
             <EventRow month="OCT" day="12" title="Town Hall: Infrastructure" location="Manekshaw Centre, Delhi" />
             <EventRow month="OCT" day="15" title="Tech-Summit Keynote" location="Pragati Maidan" isLast />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const MetricRow = ({ label, value, color, isLast }: any) => (
  <View style={[styles.metricRow, isLast && { borderBottomWidth: 0 }]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, color && { color }]}>{value}</Text>
  </View>
);

const EventRow = ({ month, day, title, location, isLast }: any) => (
  <View style={[styles.eventRow, isLast && { marginBottom: 0 }]}>
    <View style={styles.eventDateBlock}>
      <Text style={styles.eventMonth}>{month}</Text>
      <Text style={styles.eventDay}>{day}</Text>
    </View>
    <View>
      <Text style={styles.eventTitle}>{title}</Text>
      <Text style={styles.eventLocation}>{location}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroContainer: { height: 500, width: '100%' },
  coverImage: { width: '100%', height: 400 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backButton: { position: 'absolute', left: 20, zIndex: 10 },
  
  profileInfoContainer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  portraitWrapper: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainer,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 8 }
    })
  },
  portrait: { width: '100%', height: '100%' },
  
  mainMeta: { marginBottom: 20 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  verifiedBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  incumbentBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  candidateName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  candidateRole: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  
  locationPartyRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followBtn: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  followBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  socialBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  mainContent: { padding: 16, gap: 16 },
  tabContainer: { 
    backgroundColor: '#fff', 
    padding: 4, 
    borderRadius: 12, 
    flexDirection: 'row', 
    borderWidth: 1, 
    borderColor: COLORS.outlineVariant 
  },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: COLORS.secondaryContainer },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.onSurfaceVariant },
  activeTabText: { color: COLORS.primary },

  contentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.outlineVariant },
  tabContent: { gap: 16 },
  contentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contentTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  quoteText: { fontSize: 16, color: COLORS.onSurface, fontWeight: '600', fontStyle: 'italic', lineHeight: 24 },
  bodyText: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22 },
  eduExpGrid: { gap: 12, paddingVertical: 8 },
  eduExpCard: { backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  eduExpLabel: { fontSize: 8, fontWeight: '800', color: COLORS.outline, letterSpacing: 1 },
  eduExpValue: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, marginTop: 4 },

  proposalCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant, gap: 8 },
  proposalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  proposalDesc: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18 },

  endorsementPreview: { gap: 12 },
  endorsementAvatars: { flexDirection: 'row' },
  endorsementRing: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff', marginLeft: -8, overflow: 'hidden' },
  endorsementAvatar: { width: '100%', height: '100%' },
  moreEndorsements: { backgroundColor: COLORS.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  moreText: { fontSize: 8, fontWeight: '800', color: COLORS.onSurface },
  endorsementQuote: { fontSize: 12, color: COLORS.onSurfaceVariant, fontStyle: 'italic', marginTop: 4 },

  metaCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.outlineVariant },
  cardLabel: { fontSize: 10, fontWeight: '800', color: COLORS.outline, letterSpacing: 1.5, marginBottom: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainer },
  metricLabel: { fontSize: 14, color: COLORS.onSurfaceVariant },
  metricValue: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  fullAnalyticsBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  fullAnalyticsText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  eventRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  eventDateBlock: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.primaryFixed, justifyContent: 'center', alignItems: 'center' },
  eventMonth: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  eventDay: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  eventTitle: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  eventLocation: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
});

export default CandidateDetailScreen;
