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
import { MaterialIcons } from '@expo/vector-icons';
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

const DetailItem = ({ icon, label, value, isLast = false }: any) => (
  <View style={[styles.detailItem, isLast && { borderBottomWidth: 0 }]}>
     <View style={styles.detailIconBox}>
        <MaterialIcons name={icon} size={18} color={COLORS.primary} />
     </View>
     <View style={styles.detailTextContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
     </View>
  </View>
);

const ProfileScreen = ({ navigation }: any) => {
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
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
               <MaterialIcons name="edit" size={18} color="#fff" />
               <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Grid */}
        <View style={styles.settingsGrid}>
          {/* Personal Info */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <View style={styles.iconBox}>
                    <MaterialIcons name="badge" size={20} color={COLORS.primary} />
                 </View>
                 <View>
                    <Text style={styles.cardTitle}>Identity & Contact</Text>
                    <Text style={styles.cardSub}>Verified member credentials</Text>
                 </View>
              </View>
            </View>
            
            <View style={styles.cardBody}>
               <DetailItem icon="person" label="Full Name" value={user?.full_name} />
               <DetailItem icon="email" label="Email Address" value={user?.email} isLast={false} />
               <DetailItem icon="phone" label="Phone Number" value={user?.phone} />
               <DetailItem icon="cake" label="Date of Birth" value={user?.date_of_birth} />
               <DetailItem icon="wc" label="Gender" value={user?.gender} />
               <DetailItem icon="family-restroom" label="Guardian/Parent" value={user?.parent_name} />
            </View>
          </View>

          {/* Identity Verification Card */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <View style={[styles.iconBox, { backgroundColor: COLORS.secondaryContainer + '30' }]}>
                    <MaterialIcons name="verified-user" size={20} color={COLORS.secondary} />
                 </View>
                 <View>
                    <Text style={styles.cardTitle}>KYC Verification</Text>
                    <Text style={styles.cardSub}>Official documents on file</Text>
                 </View>
              </View>
            </View>
            <View style={styles.cardBody}>
               <DetailItem icon="assignment-ind" label="Identity Type" value={user?.kyc_type} />
               <DetailItem icon="fingerprint" label="Member ID / Voter ID" value={user?.voter_id} />
            </View>
          </View>

          {/* Address Card */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                 <View style={[styles.iconBox, { backgroundColor: COLORS.primaryFixed + '40' }]}>
                    <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
                 </View>
                 <View>
                    <Text style={styles.cardTitle}>Primary Address</Text>
                    <Text style={styles.cardSub}>Residential mapping data</Text>
                 </View>
              </View>
            </View>
            <View style={styles.cardBody}>
               <DetailItem icon="home" label="Street Address" value={user?.street_address} />
               <DetailItem icon="map" label="Region" value={`${user?.city || ''}, ${user?.state || ''}`} />
               <DetailItem icon="pin-drop" label="Pincode" value={user?.pincode} />
            </View>
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
  avatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 16, 
    borderWidth: 4, 
    borderColor: '#fff', 
    ...Platform.select({ 
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, 
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 8px rgba(0,0,0,0.1)' }
    }) 
  },
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
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant + '30' },
  detailIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  detailTextContent: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.6, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  infoRow: { flexDirection: 'row', gap: 16 },
  infoItem: { flex: 1, gap: 4 },
  infoLabel: { fontSize: 8, fontWeight: '800', color: COLORS.outline, letterSpacing: 1 },
  infoValue: { fontSize: 14, color: COLORS.onSurface },
  divider: { height: 1, backgroundColor: COLORS.outlineVariant, marginVertical: 16, opacity: 0.5 },

  supportList: { gap: 8, marginTop: 16 },
  supportItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow },
  supportText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.error, marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
  footerMeta: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant, opacity: 0.6, marginTop: 16, letterSpacing: 0.5 },
});

export default ProfileScreen;
