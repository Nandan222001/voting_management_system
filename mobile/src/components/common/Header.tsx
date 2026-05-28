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
              <MaterialIcons name="arrow-back" size={24} color="#003d9b" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuButton}>
              <MaterialIcons name="menu" size={24} color="#003d9b" />
            </TouchableOpacity>
          )}
          <Text style={styles.brandText}>{title || 'Election Operations'}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="search" size={24} color="#434654" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.notificationButton]}>
            <MaterialIcons name="notifications-none" size={24} color="#434654" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <UserInitials />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fb',
    borderBottomWidth: 1,
    borderColor: '#c3c6d6',
    paddingBottom: 12,
    paddingHorizontal: 16,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  menuButton: {
    marginRight: 8,
    padding: 4,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#003d9b',
    marginLeft: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: '#ba1a1a',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#f8f9fb',
  },
  initialsContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dae2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  initialsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003d9b',
  },
});

export default Header;
