import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

interface TopAppBarProps {
  onNotificationsPress?: () => void;
}

export default function TopAppBar({ onNotificationsPress }: TopAppBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <MaterialIcons name="shield" size={26} color={colors.primary} />
        <Text style={styles.brandText}>CivicVote</Text>
      </View>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onNotificationsPress}
        activeOpacity={0.7}
        accessibilityLabel="Notifications"
        accessibilityRole="button"
      >
        <MaterialIcons name="notifications" size={24} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMain,
    height: spacing.touchTarget,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
  },
  brandText: {
    ...typography.headlineLg,
    color: colors.primary,
    marginLeft: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
});
