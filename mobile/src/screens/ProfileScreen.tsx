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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Header from '../components/common/Header';

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
  surfaceContainerHighest: '#e1e2e4',
  outline: '#737685',
  error: '#ba1a1a',
  primaryFixed: '#dae2ff',
};

const ProfileScreen = () => {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to sign out of your account?')) {
        performLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
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
    <View style={styles.container}>
      <Header title="Member Profile" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryFixed]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: user?.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.full_name || 'User') + '&background=0D8ABC&color=fff' }} 
                style={styles.avatar} 
              />
              <View style={styles.verifiedIconBadge}>
                <MaterialIcons name="verified" size={16} color={COLORS.onSecondaryContainer} />
              </View>
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.userName}>{user?.full_name || "Member"}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.memberBadge}>
                   <MaterialIcons name="shield" size={14} color={COLORS.primary} />
                   <Text style={styles.memberBadgeText}>{user?.is_verified ? 'VERIFIED MEMBER' : 'UNVERIFIED'}</Text>
                </View>
                <View style={styles.idBadge}>
                   <Text style={styles.idBadgeText}>ID: {user?.voter_id || `FED-${(user?.id || 0).toString().padStart(4, '0')}-X`}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn}>
               <MaterialIcons name="edit" size={18} color="#fff" />
               <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Grid */}
        <View style={styles.settingsGrid}>
          {/* Personal Info */}
          <View style={styles.settingCard}>
            <TouchableOpacity style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <View style={styles.iconBox}>
                    <MaterialIcons name="person" size={20} color={COLORS.primary} />
                 </View>
                 <View>
                    <Text style={styles.cardTitle}>Personal Information</Text>
                    <Text style={styles.cardSub}>Manage your public and private data</Text>
                 </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
            <View style={styles.cardBody}>
               <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                     <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                     <Text style={styles.infoValue} numberOfLines={1}>{user?.email || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                     <Text style={styles.infoLabel}>PHONE NUMBER</Text>
                     <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
                  </View>
               </View>
            </View>
          </View>

          {/* Security */}
          <TouchableOpacity style={styles.settingCard}>
             <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                   <View style={styles.iconBox}>
                      <MaterialIcons name="lock" size={20} color={COLORS.primary} />
                   </View>
                   <View>
                      <Text style={styles.cardTitle}>Security & Login</Text>
                      <Text style={styles.cardSub}>Passwords, 2FA, and session control</Text>
                   </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
             </View>
             <View style={styles.securityStatus}>
                <View style={styles.tfaBadge}>
                   <MaterialIcons name="check-circle" size={12} color={COLORS.secondary} />
                   <Text style={styles.tfaText}>2FA ENABLED</Text>
                </View>
                <Text style={styles.passChangeText}>Last password change: 14 days ago</Text>
             </View>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.settingCard}>
             <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                   <View style={styles.iconBox}>
                      <MaterialIcons name="notifications-active" size={20} color={COLORS.primary} />
                   </View>
                   <View>
                      <Text style={styles.cardTitle}>Notification Preferences</Text>
                      <Text style={styles.cardSub}>Alert thresholds and channel routing</Text>
                   </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
             </View>
          </TouchableOpacity>

          {/* Volunteer History */}
          <View style={[styles.settingCard, { backgroundColor: COLORS.primary }]}>
             <View style={styles.volunteerHeader}>
                <Text style={styles.volunteerTitle}>Volunteer History</Text>
                <MaterialIcons name="history" size={20} color="#fff" />
             </View>
             <View style={styles.volunteerStats}>
                <View style={styles.volStatItem}>
                   <Text style={styles.volStatLabel}>Total Hours</Text>
                   <Text style={styles.volStatValue}>412</Text>
                </View>
                <View style={styles.volStatDivider} />
                <View style={styles.volStatItem}>
                   <Text style={styles.volStatLabel}>Events Managed</Text>
                   <Text style={styles.volStatValue}>18</Text>
                </View>
             </View>
             <TouchableOpacity style={styles.volTranscriptBtn}>
                <Text style={styles.volTranscriptText}>View Full Transcript</Text>
             </TouchableOpacity>
          </View>

          {/* Support */}
          <View style={styles.settingCard}>
             <Text style={styles.cardTitle}>Support</Text>
             <View style={styles.supportList}>
                <TouchableOpacity style={styles.supportItem}>
                   <MaterialIcons name="help-center" size={20} color={COLORS.onSurfaceVariant} />
                   <Text style={styles.supportText}>Help Center</Text>
                   <MaterialIcons name="open-in-new" size={14} color={COLORS.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportItem}>
                   <MaterialIcons name="forum" size={20} color={COLORS.onSurfaceVariant} />
                   <Text style={styles.supportText}>Contact Admin Support</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
             <MaterialIcons name="logout" size={20} color={COLORS.error} />
             <Text style={styles.logoutText}>Logout Account</Text>
          </TouchableOpacity>

          {/* Footer Meta */}
          <Text style={styles.footerMeta}>
            Session ID: AWS-NODE-PRM-99201-B | System Version 4.8.2-GA
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1 },
  
  headerCard: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, overflow: 'hidden' },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, opacity: 0.05 },
  headerContent: { padding: 24, paddingTop: 32, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 110, height: 110, borderRadius: 16, borderWidth: 4, borderColor: '#fff', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 } }) },
  verifiedIconBadge: { position: 'absolute', bottom: -6, right: -6, backgroundColor: COLORS.secondaryContainer, padding: 4, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  headerTextWrapper: { alignItems: 'center', gap: 8 },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.onSurface },
  badgeRow: { flexDirection: 'row', gap: 8 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 61, 155, 0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  memberBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  idBadge: { backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  idBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 24 },
  editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  settingsGrid: { padding: 16, gap: 16 },
  settingCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.outlineVariant, padding: 20, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  cardSub: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  cardBody: { marginTop: 20 },
  infoRow: { flexDirection: 'row', gap: 16 },
  infoItem: { flex: 1, gap: 4 },
  infoLabel: { fontSize: 8, fontWeight: '800', color: COLORS.outline, letterSpacing: 1 },
  infoValue: { fontSize: 14, color: COLORS.onSurface },
  
  securityStatus: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  tfaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5, 110, 0, 0.05)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tfaText: { fontSize: 10, fontWeight: '800', color: COLORS.secondary },
  passChangeText: { fontSize: 12, color: COLORS.onSurfaceVariant },

  volunteerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  volunteerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  volunteerStats: { flexDirection: 'row', alignItems: 'center', gap: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 16 },
  volStatItem: { flex: 1, gap: 4 },
  volStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  volStatValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  volStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  volTranscriptBtn: { marginTop: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  volTranscriptText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  supportList: { gap: 8, marginTop: 16 },
  supportItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow },
  supportText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.error, marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
  footerMeta: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant, opacity: 0.6, marginTop: 16, letterSpacing: 0.5 },
});

export default ProfileScreen;
