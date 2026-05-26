import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { authService } from '../services/authService';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';

const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          onLogout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={60} color="#fff" />
            </View>
            <TouchableOpacity style={styles.editAvatar}>
              <MaterialIcons name="camera-alt" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="badge" label="Role" value={user?.role?.toUpperCase()} color="#4f46e5" />
            <InfoRow icon="location-on" label="District" value={user?.district || 'Not Assigned'} color="#10b981" />
            <InfoRow icon="work" label="Designation" value={user?.designation || 'Member'} color="#f59e0b" />
            <InfoRow icon="phone" label="Phone" value={user?.phone || 'Not Provided'} color="#6366f1" isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & App</Text>
          <View style={styles.infoCard}>
            <MenuRow icon="lock" label="Change Password" />
            <MenuRow icon="notifications" label="Notification Settings" />
            <MenuRow icon="help" label="Help & Support" isLast />
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0 (Build 24)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value, color, isLast }: { icon: any, label: string, value: string, color: string, isLast?: boolean }) => (
  <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const MenuRow = ({ icon, label, isLast }: { icon: any, label: string, isLast?: boolean }) => (
  <TouchableOpacity style={[styles.menuRow, isLast && { borderBottomWidth: 0 }]}>
    <MaterialIcons name={icon} size={22} color="#4b5563" />
    <Text style={styles.menuLabel}>{label}</Text>
    <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#111827',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 30,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
  },
});

export default ProfileScreen;
