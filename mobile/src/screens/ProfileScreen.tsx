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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';
import { mediaService } from '../services/mediaService';

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
        <MaterialIcons name={icon} size={20} color={COLORS.primary} />
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
      <MaterialIcons name={icon} size={18} color={color || COLORS.onSurfaceVariant} />
    </View>
    <View style={styles.detailTextContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, isLoading } = useAuth();
  const [planName, setPlanName] = useState(user?.membership_plan?.name || 'No Member Plan');
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

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

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Member Profile" />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ... Cinematic Header ... */}
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
                    <Ionicons name="person" size={60} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={20} color="#fff" />
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
                  <MaterialIcons name="edit" size={16} color="#fff" />
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bodyWrapper}>
          {/* ... Premium Membership Card ... */}
          <View style={styles.membershipCard}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.membershipGradient}
            >
              <View style={styles.membershipHeader}>
                <View style={styles.membershipIconBg}>
                  <FontAwesome5 name="crown" size={20} color={COLORS.accent} />
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

          {/* Support Actions */}
          <View style={styles.supportContainer}>
            <TouchableOpacity style={styles.supportAction}>
              <MaterialIcons name="help-center" size={22} color={COLORS.primary} />
              <Text style={styles.supportActionText}>Help & Documentation</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.outlineVariant} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.supportAction}>
              <MaterialIcons name="security" size={22} color={COLORS.primary} />
              <Text style={styles.supportActionText}>Security & Privacy</Text>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.outlineVariant} />
            </TouchableOpacity>
          </View>

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
              <MaterialIcons name="logout" size={20} color={COLORS.error} />
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
          <View style={styles.modalPopup}>
            <View style={styles.modalIconBg}>
              <MaterialIcons name="logout" size={28} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out of your account?</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={confirmLogout}
              >
                <Text style={styles.confirmBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1 },

  // Hero Header Styles
  heroContainer: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
      android: { elevation: 12 },
    })
  },
  heroGradient: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  heroDecorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroDecorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 35,
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
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.success,
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  userName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  metaBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  editProfileBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Body Layout
  bodyWrapper: {
    paddingHorizontal: 20,
    marginTop: -25,
    zIndex: 2,
  },
  
  // Membership Card Styles
  membershipCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 6 },
    })
  },
  membershipGradient: {
    padding: 24,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  membershipIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1,
  },
  membershipName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  membershipDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 20,
    opacity: 0.5,
  },
  membershipMetaGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  membershipMetaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  // Section Styles
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
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
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  // Support Styles
  supportContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  supportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
  },
  supportActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  // Logout Button Styles
  logoutButton: {
    borderRadius: 24,
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
    gap: 12,
    paddingVertical: 18,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.error,
    letterSpacing: 0.2,
  },

  // System Footer
  systemFooter: {
    marginTop: 32,
    alignItems: 'center',
    gap: 4,
  },
  systemFooterText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.3,
    letterSpacing: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalPopup: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 24 },
    })
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.error,
  },
});

export default ProfileScreen;
