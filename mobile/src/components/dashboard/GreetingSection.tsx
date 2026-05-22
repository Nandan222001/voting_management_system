import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { User } from '../../types';

interface GreetingSectionProps {
  user: User;
}

export default function GreetingSection({ user }: GreetingSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <Text style={styles.label}>DASHBOARD OVERVIEW</Text>
        <Text style={styles.greeting}>Welcome back,{'\n'}{user.fullName}</Text>
      </View>

      {user.isVerified && (
        <View style={styles.verificationBadge}>
          <View style={styles.iconWrapper}>
            <MaterialIcons name="verified" size={20} color={colors.tertiary} />
          </View>
          <View style={styles.badgeText}>
            <Text style={styles.badgeLabel}>Verification Status</Text>
            <Text style={styles.badgeValue}>Verified Elector</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.stackMd,
  },
  textGroup: {
    gap: 4,
  },
  label: {
    ...typography.labelMd,
    color: colors.secondary,
  },
  greeting: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    backgroundColor: `${colors.tertiary}1A`,
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    gap: 2,
  },
  badgeLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  badgeValue: {
    ...typography.labelMd,
    color: colors.tertiary,
  },
});
