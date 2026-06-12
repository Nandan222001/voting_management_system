import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import { candidateService } from '../services/candidateService';
import { mediaService } from '../services/mediaService';
import { showToast } from '../utils/toast';
import { hs, vs, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

const LOCAL_IMAGES = [
  require('../images/image1.jpg'),
  require('../images/image2.jpg'),
  require('../images/image3.jpg'),
  require('../images/image5.jpg'),
  require('../images/image6.jpg'),
  require('../images/image7.jpg'),
  require('../images/image9.jpg'),
  require('../images/image10.jpg'),
  require('../images/image11.jpg'),
  require('../images/ image11.jpg'),
];

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  onPrimary: '#ffffff',
  secondary: '#056e00',
  secondaryContainer: '#8dfc75',
  onSecondaryContainer: '#067500',
  tertiary: '#683700',
  tertiaryFixed: '#ffdcc2',
  background: '#f8f9fb',
  surface: '#ffffff',
  surfaceContainerLow: '#f3f4f6',
  surfaceContainerHigh: '#e7e8ea',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outline: '#737685',
  outlineVariant: '#c3c6d6',
  error: '#ba1a1a',
  primaryFixed: '#dae2ff',
};

const DEFAULT_IMAGES = {
  portrait: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=800',
  cover: 'https://images.unsplash.com/photo-1540910419892-f0c97a214066?auto=format&fit=crop&q=80&w=1200'
};

const CandidateDetailScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('biography');
  const [refreshing, setRefreshing] = useState(false);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Real data passed from navigation
  const candidate = route.params?.candidate || {};

  const onRefresh = async () => {
    setRefreshing(true);
    await checkFollowStatus();
    // In a real app we might also fetch the latest candidate details by ID
    setRefreshing(false);
  };

  const fullName = candidate.full_name || 'Unknown Representative';
  const role = candidate.position_name || candidate.committee?.name || 'REPRESENTATIVE';
  const constituency = candidate.target?.name || 'General Node';

  // Deterministic random selection based on candidate ID
  const getRandomLocalImage = (id: any, offset = 0) => {
    const numericId = typeof id === 'number' ? id : parseInt(id || '0', 10) || 0;
    const index = (numericId + offset) % LOCAL_IMAGES.length;
    return LOCAL_IMAGES[index];
  };

  // Fallback logic for images
  const portraitSource = candidate.image_url
    ? { uri: mediaService.getFileUrl(candidate.image_url) }
    : (candidate.image ? { uri: mediaService.getFileUrl(candidate.image) } : getRandomLocalImage(candidate.id || 0, 3));

  const coverSource = candidate.cover_url
    ? { uri: mediaService.getFileUrl(candidate.cover_url) }
    : getRandomLocalImage(candidate.id || 0, 7);

  const bioText = candidate.bio || "This representative has not yet provided a detailed biography or mission statement in the current administrative ledger.";

  useEffect(() => {
    if (candidate.id) {
      checkFollowStatus();
    }
  }, [candidate.id]);

  const checkFollowStatus = async () => {
    try {
      const status = await candidateService.getFollowStatus(candidate.id);
      setIsFollowing(status.is_following);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const toggleFollow = async () => {
    const previousState = isFollowing;
    setIsFollowing(!previousState); // Optimistic update

    try {
      const result = await candidateService.followCandidate(candidate.id);
      setIsFollowing(result.is_following);
    } catch (error) {
      setIsFollowing(previousState); // Revert on failure
      showToast.error('Action Failed', 'Could not update follow status.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'biography':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="article" size={ms(22)} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Vision & Statement</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.quoteBox}>
                <MaterialIcons name="format-quote" size={ms(24)} color={COLORS.primary} style={styles.quoteIcon} />
                <Text style={styles.quoteText}>
                  {candidate.mission_statement || "Transforming our community with integrity and a shared commitment to innovation and democratic progress."}
                </Text>
              </View>
              <Text style={styles.bodyText}>{bioText}</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>DOB / AGE</Text>
                  <Text style={styles.infoValue}>{candidate.date_of_birth || "N/A"}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>GENDER</Text>
                  <Text style={styles.infoValue}>{candidate.gender || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.registryBox}>
                <Text style={styles.infoLabel}>GUARDIAN / PARENT</Text>
                <Text style={styles.infoValue}>{candidate.parent_name || "N/A"}</Text>
              </View>
            </View>
          </View>
        );
      case 'eligibility':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="fact_check" size={ms(22)} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Eligibility & Declarations</Text>
            </View>
            <View style={styles.checklist}>
              <CheckItem label="Willing to Contest" checked={candidate.is_willing} />
              <CheckItem label="Previously Held Post" checked={candidate.held_previously} />
              {candidate.held_previously && (
                <View style={styles.subDetail}>
                  <Text style={styles.subDetailLabel}>Position: {candidate.prev_position} ({candidate.prev_duration})</Text>
                </View>
              )}
              <CheckItem label="Organizational Discipline" checked={!candidate.is_disciplined} />
              <CheckItem label="Dispute Free Status" checked={!candidate.has_complaints} />
              <CheckItem label="Constitutional Agreement" checked={candidate.agreed_constitution} />
              <CheckItem label="Results Acceptance" checked={candidate.accepted_results} />
            </View>
          </View>
        );
      case 'registry':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="contact-mail" size={ms(22)} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Registry & Contact</Text>
            </View>
            <View style={styles.cardBody}>
              <DetailRow
                label="Official Email"
                value={candidate.email || "N/A"}
                isEmail={!!candidate.email}
              />
              <DetailRow label="Registry Phone" value={candidate.phone || "N/A"} />
              <DetailRow label="Voter ID" value={candidate.voter_id_number || "N/A"} />

              <View style={styles.divider} />

              <DetailRow label="State" value={candidate.state || "N/A"} />
              <DetailRow label="District" value={candidate.district || "N/A"} />
              <DetailRow label="Village / Area" value={candidate.village || "N/A"} />
              <DetailRow label="Pincode" value={candidate.pincode || "N/A"} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Cover Area */}
      <View style={styles.coverWrapper}>
        <Image source={coverSource} style={styles.coverImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.coverOverlay}
        />
      </View>

      <Header
        title=""
        transparent
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(60) }}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Spacer for cover */}
        <View style={{ height: vs(60) }} />

        {/* 2. Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.portraitWrapper}>
            {candidate.image_url || candidate.image ? (
              <Image
                source={{ uri: mediaService.getFileUrl(candidate.image_url || candidate.image) }}
                style={styles.heroPortrait}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroPortrait, { backgroundColor: COLORS.primaryContainer, justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialIcons name="person" size={ms(64)} color={COLORS.primary} />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <MaterialIcons name="verified" size={ms(12)} color="#fff" />
                <Text style={styles.statusBadgeText}>VERIFIED</Text>
              </View>
              {candidate.held_previously && (
                <View style={[styles.statusBadge, { backgroundColor: COLORS.primary }]}>
                  <MaterialIcons name="stars" size={ms(12)} color="#fff" />
                  <Text style={styles.statusBadgeText}>INCUMBENT</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileName} numberOfLines={2}>{fullName}</Text>
            <Text style={styles.profileRole}>{role}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={ms(14)} color={COLORS.onSurfaceVariant} />
                <Text style={styles.metaText}>{constituency}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="account-balance" size={ms(14)} color={COLORS.onSurfaceVariant} />
                <Text style={styles.metaText}>{candidate.committee?.name || "Independent"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionBlock}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtnActive]}
              onPress={toggleFollow}
            >
              <MaterialIcons
                name={isFollowing ? "person-remove" : "person-add"}
                size={ms(20)}
                color={isFollowing ? COLORS.primary : "#fff"}
              />
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnTextActive]}>
                {isFollowing ? 'UNFOLLOW' : `FOLLOW ${candidate.is_representative ? 'REPRESENTATIVE' : 'CANDIDATE'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentPadding}>
          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            {[
              { id: 'biography', label: 'Biography' },
              { id: 'eligibility', label: 'Eligibility' },
              { id: 'registry', label: 'Registry' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
              >
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Render Active Tab Content */}
          {renderTabContent()}

          {/* Campaign Metrics Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="insights" size={ms(22)} color={COLORS.primary} />
              <Text style={styles.cardTitle}>{candidate.is_representative ? 'Representative Profile' : 'Election Profile'}</Text>
            </View>
            <View style={styles.metricGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Secure Votes</Text>
                <Text style={styles.metricValue}>{candidate.vote_count || 0}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Registry ID</Text>
                <Text style={styles.metricValue}>#{(candidate.id || 0).toString().padStart(3, '0')}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Rank Status</Text>
                <Text style={[styles.metricValue, { color: COLORS.secondary }]}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Declarations */}
          <View style={styles.securityBanner}>
            <MaterialIcons name="verified-user" size={ms(18)} color={COLORS.secondary} />
            <Text style={styles.securityText}>All candidate data is cryptographically signed and stored in the secure organizational vault.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({ label, value, isEmail }: any) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, isEmail && { textTransform: 'lowercase' }]}>{value || 'N/A'}</Text>
  </View>
);

const CheckItem = ({ label, checked }: any) => (
  <View style={styles.checkItem}>
    <MaterialIcons
      name={checked ? "check-circle" : "cancel"}
      size={ms(18)}
      color={checked ? COLORS.secondary : COLORS.error}
    />
    <Text style={styles.checkLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },

  coverWrapper: { height: vs(240), width: '100%', position: 'absolute', top: 0, zIndex: 0 },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject },

  profileHeader: { alignItems: 'center', paddingBottom: vs(10), zIndex: 10 },
  portraitWrapper: {
    width: ms(130),
    height: ms(130),
    borderRadius: ms(12),
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
      android: { elevation: 12 }
    })
  },
  heroPortrait: { width: '100%', height: '100%' },

  profileInfo: { alignItems: 'center', marginTop: vs(16), marginBottom: vs(12), paddingHorizontal: hs(24) },
  badgeRow: { flexDirection: 'row', gap: hs(8), marginBottom: vs(8) },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    backgroundColor: COLORS.secondary,
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    borderRadius: ms(4)
  },
  statusBadgeText: { color: '#fff', fontSize: ms(9), fontWeight: '900', letterSpacing: 0.5 },
  profileName: { fontSize: ms(26), fontWeight: '900', color: COLORS.onSurface, textAlign: 'center', letterSpacing: -0.5 },
  profileRole: { fontSize: ms(15), color: COLORS.primary, fontWeight: '700', textAlign: 'center', marginTop: vs(2) },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: hs(12), marginTop: vs(12) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: hs(4), backgroundColor: COLORS.surface, paddingHorizontal: hs(10), paddingVertical: vs(6), borderRadius: ms(8), borderWidth: 1, borderColor: COLORS.outlineVariant },
  metaText: { color: COLORS.onSurfaceVariant, fontSize: ms(12), fontWeight: '600' },

  actionBlock: { width: '100%', alignItems: 'center', marginTop: vs(8) },
  followBtn: { backgroundColor: COLORS.primary, width: '80%', paddingVertical: vs(14), borderRadius: ms(8), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: hs(10), ...Platform.select({ ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }) },
  followingBtnActive: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary },
  followBtnText: { color: '#fff', fontWeight: '900', fontSize: ms(14) },
  followingBtnTextActive: { color: COLORS.primary },

  contentPadding: { padding: hs(16), gap: vs(16) },

  tabBar: { backgroundColor: '#fff', borderRadius: ms(8), padding: ms(4), flexDirection: 'row', borderWidth: 1, borderColor: COLORS.outlineVariant },
  tabItem: { flex: 1, paddingVertical: vs(10), borderRadius: ms(6), alignItems: 'center' },
  activeTabItem: { backgroundColor: COLORS.primary },
  tabText: { fontSize: ms(13), fontWeight: '700', color: COLORS.onSurfaceVariant },
  activeTabText: { color: '#ffffff' },

  card: { backgroundColor: '#fff', borderRadius: ms(10), borderWidth: 1, borderColor: COLORS.outlineVariant, padding: hs(20), ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: hs(10), marginBottom: vs(16) },
  cardTitle: { fontSize: ms(16), fontWeight: '800', color: COLORS.onSurface },
  cardBody: { gap: vs(12) },
  quoteBox: { backgroundColor: COLORS.primary + '08', padding: hs(16), borderRadius: ms(6), position: 'relative' },
  quoteIcon: { position: 'absolute', top: vs(8), left: hs(8), opacity: 0.2 },
  quoteText: { fontSize: ms(15), fontWeight: '700', color: COLORS.onSurface, lineHeight: vs(22), fontStyle: 'italic', textAlign: 'center', paddingHorizontal: hs(10) },
  bodyText: { fontSize: ms(14), color: COLORS.onSurfaceVariant, lineHeight: vs(22), fontWeight: '500' },

  infoGrid: { flexDirection: 'row', gap: hs(12) },
  infoBox: { flex: 1, backgroundColor: COLORS.surfaceContainerLow, padding: hs(12), borderRadius: ms(6), borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  infoLabel: { fontSize: ms(9), fontWeight: '800', color: COLORS.outline, letterSpacing: 1 },
  infoValue: { fontSize: ms(13), fontWeight: '800', color: COLORS.onSurface, marginTop: vs(4) },

  registryBox: { backgroundColor: COLORS.surfaceContainerLow, padding: hs(12), borderRadius: ms(6), borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginTop: vs(12) },

  checklist: { gap: vs(12) },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: hs(12) },
  checkLabel: { fontSize: ms(14), fontWeight: '600', color: COLORS.onSurface },
  subDetail: { marginLeft: hs(30), marginTop: vs(-4) },
  subDetailLabel: { fontSize: ms(11), color: COLORS.onSurfaceVariant, fontStyle: 'italic' },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(10), borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerLow },
  detailLabel: { fontSize: ms(12), fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.6 },
  detailValue: { fontSize: ms(14), fontWeight: '700', color: COLORS.onSurface },
  divider: { height: vs(12) },

  metricGrid: { flexDirection: 'row', gap: hs(10) },
  metricItem: { flex: 1, backgroundColor: COLORS.background, padding: hs(12), borderRadius: ms(6), alignItems: 'center' },
  metricLabel: { fontSize: ms(10), fontWeight: '700', color: COLORS.outline, marginBottom: vs(4) },
  metricValue: { fontSize: ms(16), fontWeight: '900', color: COLORS.onSurface },

  securityBanner: { flexDirection: 'row', alignItems: 'center', gap: hs(12), padding: hs(16), backgroundColor: COLORS.secondary + '08', borderRadius: ms(6), marginTop: vs(10) },
  securityText: { flex: 1, fontSize: ms(11), color: COLORS.onSurfaceVariant, fontWeight: '600', lineHeight: vs(16) },
});

export default CandidateDetailScreen;
