import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../services/authService';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Header from '../components/common/Header';

const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBiometricAuth, setIsBiometricAuth] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user in Profile", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        console.log('Starting logout process...');
        await authService.logout();
        onLogout();
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="rgb(16 102 177)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Verified Profile" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Block */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.full_name || 'User') + '&background=3b82f6&color=fff&size=200' }} 
              style={styles.avatar} 
            />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={18} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>{user?.full_name || "Verified Voter"}</Text>
          <View style={styles.secureIdBadge}>
            <Ionicons name="finger-print" size={14} color="rgb(16 102 177)" style={{ marginRight: 4 }} />
            <Text style={styles.secureIdText}>SECURE ID: {(user?.id || '4209').toString().padStart(4, '0')}</Text>
          </View>
        </View>

        {/* IDENTITY DETAILS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>IDENTITY DETAILS</Text>
            <MaterialIcons name="info-outline" size={18} color="#6b7280" />
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.detailItem}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Full Legal Name</Text>
                <Text style={styles.detailValue}>{user?.full_name || 'N/A'}</Text>
              </View>
              <MaterialIcons name="lock-outline" size={20} color="#9ca3af" />
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
              </View>
              <MaterialIcons name="mail-outline" size={18} color="#9ca3af" />
            </View>

            <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Account Status</Text>
                <Text style={styles.detailValue}>{(user?.status || 'Pending').toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: user?.status === 'active' ? '#a7f3d0' : '#fee2e2' }]}>
                <Text style={[styles.statusText, { color: user?.status === 'active' ? '#047857' : '#991b1b' }]}>
                  {(user?.status || 'PENDING').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECURITY SETTINGS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY SETTINGS</Text>
          <View style={styles.infoCard}>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons name="password" size={20} color="#1f2937" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuSubtitle}>Enhance your registry security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons name="face" size={20} color="#1f2937" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Biometric Auth</Text>
                <Text style={styles.menuSubtitle}>Use FaceID or Fingerprint</Text>
              </View>
              <Switch
                value={isBiometricAuth}
                onValueChange={setIsBiometricAuth}
                trackColor={{ false: '#e5e7eb', true: 'rgb(16 102 177)' }}
                thumbColor={'#fff'}
              />
            </View>

            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons name="vpn-key" size={20} color="#1f2937" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Two-Factor Auth</Text>
                <Text style={[styles.menuSubtitle, { color: '#10b981', fontWeight: '500' }]}>Active Protection</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* VERIFICATION DOCUMENTS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VERIFICATION DOCUMENTS</Text>
          
          <View style={styles.documentCard}>
            <View style={styles.documentDetails}>
              <Text style={styles.documentTitle}>Voter Registration Card</Text>
              <Text style={styles.documentSubtitle}>Verified in Digital Registry</Text>
            </View>
            <MaterialIcons name="check-circle" size={22} color="#10b981" />
          </View>

          <View style={styles.documentCard}>
            <View style={styles.documentDetails}>
              <Text style={styles.documentTitle}>Identity Confirmation</Text>
              <Text style={styles.documentSubtitle}>Verified by System Admin</Text>
            </View>
            <MaterialIcons name="check-circle" size={22} color="#10b981" />
          </View>
        </View>

        {/* Log Out Action Trigger */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#dc2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Log out of SecureVote</Text>
        </TouchableOpacity>
        
        {/* Footer Build Specifications */}
        <Text style={styles.buildVersionText}>Version 2.2.0-secure | Built for Civic Integrity</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgb(16 102 177)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  secureIdBadge: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#eff6ff',
   paddingHorizontal: 14,
   paddingVertical: 6,
   borderRadius: 20,
  },
  secureIdText: {
   fontSize: 12,
   fontWeight: '600',
   color: 'rgb(16 102 177)',
   letterSpacing: 0.5,
  },  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.5,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    marginBottom: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  documentSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '700',
  },
  buildVersionText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 20,
  },
});

export default ProfileScreen;
