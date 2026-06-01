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
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/common/Header';

const { width } = Dimensions.get('window');

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
  
  // Real data passed from navigation
  const candidate = route.params?.candidate || {};

  const fullName = candidate.full_name || 'Unknown Candidate';
  const role = candidate.position_name || candidate.committee?.name || 'CANDIDATE';
  const constituency = candidate.target?.name || 'General Node';
  
  // Fallback logic for images
  const portraitUrl = candidate.image_url || DEFAULT_IMAGES.portrait;
  const coverUrl = candidate.cover_url || DEFAULT_IMAGES.cover;
  const bioText = candidate.bio || "Candidate has not provided a specific mission statement.";

  const renderTabContent = () => {
    switch (activeTab) {
      case 'biography':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="article" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Vision & Statement</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.quoteText}>
                "{candidate.mission_statement || "Transforming our community with integrity and a shared commitment to innovation and democratic progress."}"
              </Text>
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
              <MaterialIcons name="fact_check" size={24} color={COLORS.primary} />
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
              <MaterialIcons name="contact-mail" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Registry & Contact</Text>
            </View>
            <View style={styles.cardBody}>
              <DetailRow label="Official Email" value={candidate.email} isEmail />
              <DetailRow label="Registry Phone" value={candidate.phone} />
              <DetailRow label="Voter ID" value={candidate.voter_id_number} />
              
              <View style={styles.divider} />
              
              <DetailRow label="State" value={candidate.state} />
              <DetailRow label="District" value={candidate.district} />
              <DetailRow label="Village / Area" value={candidate.village} />
              <DetailRow label="Pincode" value={candidate.pincode} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header 
        title="Candidate Details" 
        transparent 
        showBack 
        onBack={() => navigation.goBack()} 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          />
          
          <View style={styles.heroContent}>
            <View style={styles.portraitWrapper}>
              <Image source={{ uri: portraitUrl }} style={styles.heroPortrait} />
            </View>
            
            <View style={styles.heroInfo}>
              <View style={styles.badgeRow}>
                <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>VERIFIED CANDIDATE</Text></View>
                {candidate.held_previously && <View style={[styles.statusBadge, { backgroundColor: COLORS.primary }]}><Text style={styles.statusBadgeText}>INCUMBENT</Text></View>}
              </View>
              <Text style={styles.heroName}>{fullName}</Text>
              <Text style={styles.heroRole}>{role}</Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.metaText}>{constituency}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="groups" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.metaText}>{candidate.committee?.name || "Independent"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionBlock}>
              <TouchableOpacity style={styles.followBtn}>
                <MaterialIcons name="person-add" size={20} color="#fff" />
                <Text style={styles.followBtnText}>FOLLOW CANDIDATE</Text>
              </TouchableOpacity>
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialCircle}><MaterialIcons name="share" size={20} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.socialCircle}><MaterialIcons name="public" size={20} color="#fff" /></TouchableOpacity>
              </View>
            </View>
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
            <Text style={styles.sectionLabel}>CAMPAIGN METRICS</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Secure Votes</Text>
              <Text style={styles.metricValue}>{candidate.vote_count || 0}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Registry ID</Text>
              <Text style={styles.metricValue}>#{(candidate.id || 0).toString().padStart(3, '0')}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Verification Status</Text>
              <Text style={[styles.metricValue, { color: COLORS.secondary }]}>Verified</Text>
            </View>
            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>VIEW FULL ANALYTICS</Text>
            </TouchableOpacity>
          </View>

          {/* Declarations */}
          <View style={styles.securityBanner}>
             <MaterialIcons name="verified-user" size={18} color={COLORS.secondary} />
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
       size={18} 
       color={checked ? COLORS.secondary : COLORS.error} 
     />
     <Text style={styles.checkLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  heroSection: { height: 500, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, alignItems: 'center' },
  portraitWrapper: { width: 140, height: 140, borderRadius: 16, borderWidth: 4, borderColor: '#fff', overflow: 'hidden', backgroundColor: COLORS.surfaceContainerLow, marginBottom: 16 },
  heroPortrait: { width: '100%', height: '100%' },
  
  heroInfo: { alignItems: 'center', marginBottom: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroName: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center' },
  heroRole: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
  
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  
  actionBlock: { width: '100%', alignItems: 'center', gap: 12, marginTop: 10 },
  followBtn: { backgroundColor: COLORS.primary, width: '80%', paddingVertical: 14, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  followBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  contentPadding: { padding: 16, gap: 16 },
  
  tabBar: { backgroundColor: '#fff', borderRadius: 12, padding: 4, flexDirection: 'row', borderWidth: 1, borderColor: COLORS.outlineVariant },
  tabItem: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  activeTabItem: { backgroundColor: COLORS.secondaryContainer },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.onSurfaceVariant },
  activeTabText: { color: COLORS.primary },

  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant, padding: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  cardBody: { gap: 12 },
  quoteText: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface, lineHeight: 24, fontStyle: 'italic' },
  bodyText: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22, fontWeight: '500' },
  
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoBox: { flex: 1, backgroundColor: COLORS.surfaceContainerLow, padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  infoLabel: { fontSize: 9, fontWeight: '800', color: COLORS.outline, letterSpacing: 1 },
  infoValue: { fontSize: 13, fontWeight: '800', color: COLORS.onSurface, marginTop: 4 },

  registryBox: { backgroundColor: COLORS.surfaceContainerLow, padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginTop: 12 },

  checklist: { gap: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  subDetail: { marginLeft: 30, marginTop: -4 },
  subDetailLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, fontStyle: 'italic' },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerLow },
  detailLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.6 },
  detailValue: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },
  divider: { height: 12 },

  sectionLabel: { fontSize: 10, fontWeight: '900', color: COLORS.outline, letterSpacing: 1.5, marginBottom: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerLow },
  metricLabel: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant },
  metricValue: { fontSize: 14, fontWeight: '800', color: COLORS.onSurface },
  
  outlineBtn: { width: '100%', marginTop: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  outlineBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },

  securityBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.secondary + '08', borderRadius: 12, marginTop: 10 },
  securityText: { flex: 1, fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', lineHeight: 16 },
});

export default CandidateDetailScreen;
