import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { hs, vs, ms } from '../../utils/responsive';

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
      { paddingTop: Math.max(insets.top, vs(8)) }
    ]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={ms(24)} color={iconColor} />
            </TouchableOpacity>
          )}
          <Text style={[styles.brandText, transparent && { color: '#fff' }]}>{title || 'VBA Bharat'}</Text>
        </View>
        
        {token && (
          <View style={styles.rightSection}>
            <TouchableOpacity style={[styles.iconButton, styles.notificationButton]} onPress={openNotifications}>
              <MaterialIcons name="notifications-none" size={ms(24)} color={secondaryIconColor} />
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
    backgroundColor: 'transparent',
    paddingBottom: vs(12),
    paddingHorizontal: hs(16),
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: vs(44),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
  },
  backButton: {
    marginRight: hs(8),
    padding: ms(4),
  },
  brandText: {
    fontSize: ms(18),
    fontWeight: '900',
    color: '#003d9b',
    marginLeft: hs(4),
  },
  iconButton: {
    padding: ms(8),
    borderRadius: ms(8),
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: vs(10),
    right: hs(10),
    width: ms(8),
    height: ms(8),
    backgroundColor: '#ba1a1a',
    borderRadius: ms(4),
    borderWidth: 1.5,
    borderColor: '#f8f9fb',
  },
  initialsContainer: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: '#dae2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: hs(4),
  },
  initialsText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#003d9b',
  },
});

export default Header;
