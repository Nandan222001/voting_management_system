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
import Header from '../components/common/Header';

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
  
  // Real data passed from navigation
  const candidate = route.params?.candidate || {};

  const fullName = candidate.full_name || 'Unknown Candidate';
  const role = candidate.committee?.name || 'CANDIDATE';
  const constituency = candidate.target?.name || 'General Node';
  const portraitUrl = candidate.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=003d9b&color=fff';
  const bioText = candidate.bio || "Candidate has not provided a specific mission statement.";

  return (
    <View style={styles.container}>
      <Header title="Candidate Profile" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
           <View style={styles.headerTop}>
              <View style={styles.portraitContainer}>
                 <Image source={{ uri: portraitUrl }} style={styles.portraitImg} />
                 <View style={styles.activeCheck}>
                    <MaterialIcons name="verified" size={16} color="#fff" />
                 </View>
              </View>
              <View style={styles.headerInfo}>
                 <Text style={styles.nameText}>{fullName}</Text>
                 <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
                 </View>
                 <View style={styles.locationRow}>
                    <MaterialIcons name="location-on" size={14} color={COLORS.primary} />
                    <Text style={styles.locationText}>{constituency}</Text>
                 </View>
              </View>
           </View>

           <View style={styles.headerStats}>
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>{candidate.vote_count || 0}</Text>
                 <Text style={styles.statLabel}>SECURE VOTES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>#{(candidate.id || 0).toString().padStart(3, '0')}</Text>
                 <Text style={styles.statLabel}>REGISTRY ID</Text>
              </View>
           </View>
        </View>

        <View style={styles.mainContent}>
          {/* Biography Section */}
          <View style={styles.infoSection}>
             <View style={styles.sectionHeader}>
                <MaterialIcons name="description" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Vision & Bio</Text>
             </View>
             <Text style={styles.bioText}>{bioText}</Text>
          </View>

          {/* Identity & Background */}
          <View style={styles.infoSection}>
             <View style={styles.sectionHeader}>
                <MaterialIcons name="badge" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Identity & Background</Text>
             </View>
             <View style={styles.detailsGrid}>
                <DetailRow label="Guardian/Parent" value={candidate.parent_name} />
                <DetailRow label="Date of Birth" value={candidate.date_of_birth} />
                <DetailRow label="Gender" value={candidate.gender} />
                <View style={styles.symbolRow}>
                   <Text style={styles.detailLabel}>Assign Symbol</Text>
                   {candidate.symbol?.startsWith('http') ? (
                     <Image source={{ uri: candidate.symbol }} style={styles.symbolImg} />
                   ) : (
                     <Text style={styles.detailValue}>{candidate.symbol || 'N/A'}</Text>
                   )}
                </View>
             </View>
          </View>

          {/* Contact Information */}
          <View style={styles.infoSection}>
             <View style={styles.sectionHeader}>
                <MaterialIcons name="contact-mail" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Contact Directory</Text>
             </View>
             <View style={styles.detailsGrid}>
                <DetailRow label="Official Email" value={candidate.email} isEmail />
                <DetailRow label="Registry Phone" value={candidate.phone} />
             </View>
          </View>

          {/* Jurisdictional Scope */}
          <View style={styles.infoSection}>
             <View style={styles.sectionHeader}>
                <MaterialIcons name="map" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Jurisdictional Scope</Text>
             </View>
             <View style={styles.detailsGrid}>
                <DetailRow label="State" value={candidate.state} />
                <DetailRow label="District" value={candidate.district} />
                <DetailRow label="Taluka / Block" value={candidate.taluka} />
                <DetailRow label="Village / Area" value={candidate.village} />
                <DetailRow label="Pincode" value={candidate.pincode} />
             </View>
          </View>

          {/* Eligibility Checklist */}
          <View style={styles.infoSection}>
             <View style={styles.sectionHeader}>
                <MaterialIcons name="fact_check" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Eligibility Checklist</Text>
             </View>
             <View style={styles.checklist}>
                <CheckItem label="Willing to Contest" checked={candidate.is_willing} />
                <CheckItem label="Previously Held Post" checked={candidate.held_previously} />
                {candidate.held_previously && (
                   <View style={styles.subDetail}>
                      <Text style={styles.subDetailLabel}>Previous Position: {candidate.prev_position} ({candidate.prev_duration})</Text>
                   </View>
                )}
                <CheckItem label="Organizational Discipline" checked={!candidate.is_disciplined} />
                <CheckItem label="Dispute Free Status" checked={!candidate.has_complaints} />
                <CheckItem label="Constitutional Agreement" checked={candidate.agreed_constitution} />
                <CheckItem label="Results Acceptance" checked={candidate.accepted_results} />
             </View>
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
  
  profileHeaderCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 10 },
      web: { 
        // @ts-ignore
        boxShadow: '0px 10px 20px rgba(0,0,0,0.2)' 
      }
    })
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  portraitContainer: { position: 'relative' },
  portraitImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  activeCheck: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: COLORS.secondary, 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  headerInfo: { flex: 1 },
  nameText: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginVertical: 8 },
  roleBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  headerStats: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 24, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)' 
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  mainContent: { padding: 20, gap: 20 },
  infoSection: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.2 },
  bioText: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22, fontWeight: '500' },

  detailsGrid: { gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerLow },
  symbolRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  symbolImg: { width: 32, height: 32, borderRadius: 16 },
  detailLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.6 },
  detailValue: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface },

  checklist: { gap: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  subDetail: { marginLeft: 30, marginTop: -4 },
  subDetailLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, fontStyle: 'italic' },

  securityBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.secondary + '08', borderRadius: 12, marginTop: 10 },
  securityText: { flex: 1, fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', lineHeight: 16 },
});

export default CandidateDetailScreen;
