import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string; // Optional custom title, defaults to SecureVote
}

const UserInitials = () => {
  const [initials, setInitials] = useState('??');

  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      if (user && user.full_name) {
        const names = user.full_name.split(' ');
        const initials = names.length > 1 
          ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
          : names[0][0].toUpperCase();
        setInitials(initials);
      } else {
        setInitials('CV');
      }
    };
    loadUser();
  }, []);

  return (
    <View style={styles.initialsContainer}>
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  );
};

const Header = ({ showBack, onBack, title }: HeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandRow}>
              <FontAwesome5 name="shield-alt" size={20} color="#111827" />
              <Text style={styles.brandText}>{title || 'SecureVote'}</Text>
            </View>
          )}
          {showBack && title && (
             <Text style={[styles.brandText, { marginLeft: 10 }]}>{title}</Text>
          )}
        </View>
        
        <UserInitials />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingBottom: 12,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 10,
  },
  initialsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  initialsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0051D5',
  },
});

export default Header;
