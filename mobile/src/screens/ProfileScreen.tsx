import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';
import { mediaService } from '../services/mediaService';
import { hs, vs, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#eff6ff',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  outlineVariant: '#e2e8f0',
  secondary: '#056e00',
  accent: '#ff8c00',
  error: '#ef4444',
  success: '#10b981',
};

const ProfileSection = ({ title, icon, children }: any) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        <MaterialIcons name={icon} size={ms(20)} color={COLORS.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>
      {children}
    </View>
  </View>
);

const DetailRow = ({ icon, label, value, isLast = false, color }: any) => (
  <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.detailIconBg}>
      <MaterialIcons name={icon} size={ms(18)} color={color || COLORS.onSurfaceVariant} />
    </View>
    <View style={styles.detailTextContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, isLoading, updateProfile } = useAuth();
  const [planName, setPlanName] = useState(user?.membership_plan?.name || 'No Member Plan');
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isCandidate = user?.is_candidate;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await updateProfile({}); // Calling updateProfile with empty object forces a refresh from token/backend
    } catch (e) {
      console.error("Refresh failed", e);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (user?.membership_plan?.name) {
      setPlanName(user.membership_plan.name);
    }
  }, [user?.membership_plan]);

  const handleLogoutPress = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setIsLogoutModalVisible(false);
    try {
      await logout();
      showToast.success('Signed Out', 'You have been successfully logged out.');
    } catch (error) {
      console.error('Logout error:', error);
      showToast.error('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Member Profile" />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: vs(40) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Cinematic Header */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[COLORS.primary, '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroDecorativeCircle1} />
            <View style={styles.heroDecorativeCircle2} />
            
            <View style={styles.heroContent}>
              <View style={styles.avatarContainer}>
                {user?.image_url ? (
                  <Image 
                    source={{ uri: mediaService.getFileUrl(user.image_url) }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={[styles.avatar, styles.defaultAvatar]}>
                    <Ionicons name="person" size={ms(60)} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={ms(20)} color="#fff" />
                </View>
              </View>
              
              <Text style={styles.userName}>{user?.full_name || "Member Name"}</Text>
              <View style={styles.userMetaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{user?.role?.toUpperCase() || 'VOTER'}</Text>
                </View>
                <View style={styles.dotSeparator} />
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>

              <TouchableOpacity 
                style={styles.editProfileBtn}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.editProfileGradient}
                >
                  <MaterialIcons name="edit" size={ms(16)} color="#fff" />
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bodyWrapper}>
          {/* Premium Membership Card */}
          <View style={styles.membershipCard}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.membershipGradient}
            >
              <View style={styles.membershipHeader}>
                <View style={styles.membershipIconBg}>
                  <FontAwesome5 name="crown" size={ms(20)} color={COLORS.accent} />
                </View>
                <View style={styles.membershipTitleGroup}>
                  <Text style={styles.membershipLabel}>MEMBERSHIP TIER</Text>
                  <Text style={styles.membershipName}>{planName}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: COLORS.success + '15' }]}>
                  <Text style={[styles.statusPillText, { color: COLORS.success }]}>ACTIVE</Text>
                </View>
              </View>
              
              <View style={styles.membershipDivider} />
              
              <View style={styles.membershipMetaGrid}>
                <View style={styles.membershipMetaItem}>
                  <Text style={styles.metaLabel}>VALID UNTIL</Text>
                  <Text style={styles.metaValue}>31 Dec 2026</Text>
                </View>
                <View style={styles.membershipMetaItem}>
                  <Text style={styles.metaLabel}>VOTING RIGHTS</Text>
                  <Text style={styles.metaValue}>Full Access</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Profile Information Sections */}
          <ProfileSection title="Identity & Personal" icon="person">
            <DetailRow icon="badge" label="Full Name" value={user?.full_name} />
            <DetailRow icon="email" label="Official Email" value={user?.email} />
            <DetailRow icon="phone" label="Registry Phone" value={user?.phone} />
            <DetailRow icon="cake" label="Date of Birth" value={user?.date_of_birth} />
            <DetailRow icon="wc" label="Gender" value={user?.gender} isLast={true} />
          </ProfileSection>

          <ProfileSection title="KYC & Verification" icon="verified-user">
            <DetailRow icon="assignment-ind" label="Identity Type" value={user?.kyc_type} />
            <DetailRow icon="fingerprint" label="Verified ID Number" value={user?.voter_id} isLast={true} />
          </ProfileSection>

          <ProfileSection title="Location Ledger" icon="location-on">
            <DetailRow icon="home" label="Primary Residence" value={user?.street_address} />
            <DetailRow icon="map" label="Region / State" value={`${user?.city || ''}, ${user?.state || ''}`} isLast={true} />
          </ProfileSection>

          {/* Event Management Section */}
          <ProfileSection title="Event Management" icon="event">
            {isCandidate && (
              <TouchableOpacity 
                style={styles.supportAction}
                onPress={() => navigation.navigate('CreateEvent')}
              >
                <MaterialIcons name="add-circle-outline" size={ms(22)} color={COLORS.primary} />
                <Text style={styles.supportActionText}>Create New Event</Text>
                <MaterialIcons name="chevron-right" size={ms(20)} color={COLORS.outlineVariant} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.supportAction}
              onPress={() => navigation.navigate('EventList', { mode: 'my' })}
            >
              <MaterialIcons name="event-note" size={ms(22)} color={COLORS.primary} />
              <Text style={styles.supportActionText}>My Scheduled Events</Text>
              <MaterialIcons name="chevron-right" size={ms(20)} color={COLORS.outlineVariant} />
            </TouchableOpacity>
          </ProfileSection>

          {/* Logout Action */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogoutPress}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#fff', '#fff']}
              style={styles.logoutGradient}
            >
              <MaterialIcons name="logout" size={ms(20)} color={COLORS.error} />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* System Footer */}
          <View style={styles.systemFooter}>
            <Text style={styles.systemFooterText}>POLLING STATION NODE: {user?.tenant_id || 'LOCAL-01'}</Text>
            <Text style={styles.systemFooterText}>SECURE VERSION 4.9.0-GOLD</Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom Logout Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setIsLogoutModalVisible(false)} 
          />
          <View style={styles.modalPopup}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconBg}>
              <MaterialIcons name="logout" size={ms(32)} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to exit your secure voting session?</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Keep Session</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={confirmLogout}
              >
                <LinearGradient
                  colors={[COLORS.error, '#dc2626']}
                  style={styles.confirmBtnGradient}
                >
                  <Text style={styles.confirmBtnText}>Sign Out</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1 },

  heroContainer: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: ms(40),
    borderBottomRightRadius: ms(40),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
      android: { elevation: 12 },
    })
  },
  heroGradient: {
    paddingTop: vs(40),
    paddingBottom: vs(50),
    paddingHorizontal: hs(24),
    alignItems: 'center',
    position: 'relative',
  },
  heroDecorativeCircle1: {
    position: 'absolute',
    top: vs(-50),
    right: hs(-50),
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroDecorativeCircle2: {
    position: 'absolute',
    bottom: vs(-30),
    left: hs(-40),
    width: ms(120),
    height: ms(120),
    borderRadius: ms(60),
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: vs(20),
  },
  avatar: {
    width: ms(110),
    height: ms(110),
    borderRadius: ms(35),
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  defaultAvatar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: vs(-5),
    right: hs(-5),
    backgroundColor: COLORS.success,
    width: ms(32),
    height: ms(32),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  userName: {
    fontSize: ms(26),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: vs(8),
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(10),
    marginBottom: vs(24),
  },
  metaBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(4),
  },
  metaBadgeText: {
    color: '#fff',
    fontSize: ms(10),
    fontWeight: '800',
    letterSpacing: 1,
  },
  dotSeparator: {
    width: ms(4),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  userEmail: {
    fontSize: ms(14),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  editProfileBtn: {
    borderRadius: ms(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
    paddingHorizontal: hs(20),
    paddingVertical: vs(12),
  },
  editProfileText: {
    color: '#fff',
    fontSize: ms(14),
    fontWeight: '800',
  },

  bodyWrapper: {
    paddingHorizontal: hs(20),
    marginTop: vs(-25),
    zIndex: 2,
  },
  
  membershipCard: {
    borderRadius: ms(14),
    overflow: 'hidden',
    marginBottom: vs(24),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 6 },
    })
  },
  membershipGradient: {
    padding: hs(24),
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(16),
  },
  membershipIconBg: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(8),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    })
  },
  membershipTitleGroup: {
    flex: 1,
  },
  membershipLabel: {
    fontSize: ms(10),
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1,
  },
  membershipName: {
    fontSize: ms(20),
    fontWeight: '900',
    color: COLORS.onSurface,
    marginTop: vs(2),
  },
  statusPill: {
    paddingHorizontal: hs(12),
    paddingVertical: vs(6),
    borderRadius: ms(5),
  },
  statusPillText: {
    fontSize: ms(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  membershipDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: vs(20),
    opacity: 0.5,
  },
  membershipMetaGrid: {
    flexDirection: 'row',
    gap: hs(24),
  },
  membershipMetaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: ms(9),
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 0.5,
    marginBottom: vs(4),
  },
  metaValue: {
    fontSize: ms(15),
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: hs(20),
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
    marginBottom: vs(20),
  },
  sectionIconBox: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(6),
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.2,
  },
  sectionBody: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(16),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIconBg: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(5),
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailTextContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: ms(10),
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vs(2),
  },
  detailValue: {
    fontSize: ms(15),
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  supportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(16),
    padding: hs(16),
    borderRadius: ms(8),
  },
  supportActionText: {
    flex: 1,
    fontSize: ms(15),
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  logoutButton: {
    borderRadius: ms(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    ...Platform.select({
      ios: { shadowColor: COLORS.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    })
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(12),
    paddingVertical: vs(18),
  },
  logoutButtonText: {
    fontSize: ms(16),
    fontWeight: '800',
    color: COLORS.error,
    letterSpacing: 0.2,
  },

  systemFooter: {
    marginTop: vs(32),
    alignItems: 'center',
    gap: vs(4),
  },
  systemFooterText: {
    fontSize: ms(10),
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.3,
    letterSpacing: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: { flex: 1 },
  modalPopup: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    padding: hs(32),
    paddingTop: vs(8),
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 },
    })
  },
  modalHandle: {
    width: hs(40),
    height: vs(5),
    backgroundColor: '#e2e8f0',
    borderRadius: ms(3),
    alignSelf: 'center',
    marginVertical: vs(12),
    marginBottom: vs(24),
  },
  modalIconBg: {
    width: ms(72),
    height: ms(72),
    borderRadius: ms(8),
    backgroundColor: COLORS.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  modalTitle: {
    fontSize: ms(24),
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: vs(12),
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: ms(16),
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: vs(24),
    marginBottom: vs(32),
    fontWeight: '500',
    paddingHorizontal: hs(10),
  },
  modalActions: {
    flexDirection: 'row',
    gap: hs(12),
    width: '100%',
    marginBottom: vs(10),
  },
  cancelBtn: {
    flex: 1,
    height: vs(56),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: ms(15),
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
  },
  confirmBtn: {
    flex: 1,
    height: vs(56),
    borderRadius: ms(8),
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: ms(15),
    fontWeight: '800',
    color: '#fff',
  },
});

export default ProfileScreen;
