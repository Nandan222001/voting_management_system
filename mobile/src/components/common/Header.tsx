import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string; // Optional custom title, defaults to SecureVote
  transparent?: boolean;
}

const UserInitials = ({ transparent, onPress }: { transparent?: boolean; onPress?: () => void }) => {
  const { user } = useAuth();
  const [initials, setInitials] = useState('??');

  useEffect(() => {
    if (user && user.full_name) {
      const names = user.full_name.split(' ');
      const initials = names.length > 1 
        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
        : names[0][0].toUpperCase();
      setInitials(initials);
    } else {
      setInitials('CV');
    }
  }, [user]);

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.initialsContainer, transparent && { backgroundColor: 'rgba(255,255,255,0.2)' }]}
    >
      <Text style={[styles.initialsText, transparent && { color: '#fff' }]}>{initials}</Text>
    </TouchableOpacity>
  );
};

const Header = ({ showBack, onBack, title, transparent }: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  
  const iconColor = transparent ? '#fff' : '#003d9b';
  const secondaryIconColor = transparent ? '#fff' : '#434654';

  const openNotifications = () => {
    navigation.navigate('Notifications');
  };

  const goToProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top + 8 },
      transparent && { backgroundColor: 'transparent', borderBottomWidth: 0, position: 'absolute', top: 0, left: 0, right: 0 }
    ]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
          )}
          <Text style={[styles.brandText, transparent && { color: '#fff' }]}>{title || 'CivicVote'}</Text>
        </View>
        
        {token && (
          <View style={styles.rightSection}>
            <TouchableOpacity style={[styles.iconButton, styles.notificationButton]} onPress={openNotifications}>
              <MaterialIcons name="notifications-none" size={24} color={secondaryIconColor} />
              <View style={[styles.notificationBadge, transparent && { borderColor: 'transparent' }]} />
            </TouchableOpacity>
            <UserInitials transparent={transparent} onPress={goToProfile} />
          </View>
        )}
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
