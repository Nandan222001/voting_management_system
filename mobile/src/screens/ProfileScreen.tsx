import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import TopAppBar from '../components/common/TopAppBar';
import { colors, typography, spacing } from '../theme';
import { currentUser } from '../data/mockData';

interface ProfileRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}

function ProfileRow({ icon, label, value }: ProfileRowProps) {
  return (
    <View style={profileRowStyles.row}>
      <View style={profileRowStyles.iconWrapper}>
        <MaterialIcons name={icon} size={18} color={colors.onSurfaceVariant} />
      </View>
      <View style={profileRowStyles.text}>
        <Text style={profileRowStyles.label}>{label}</Text>
        <Text style={profileRowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const profileRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackMd,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '500',
  },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopAppBar />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {currentUser.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.fullName}>{currentUser.fullName}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
          {currentUser.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color={colors.tertiary} />
              <Text style={styles.verifiedText}>Verified Member</Text>
            </View>
          )}
        </View>

        {/* Subscription Status */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <MaterialIcons name="card-membership" size={20} color={colors.primary} />
            <Text style={styles.subscriptionTitle}>Membership Plan</Text>
          </View>
          <View style={styles.subscriptionBody}>
            <Text style={styles.planName}>Annual Membership</Text>
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.planExpiry}>Renews on Dec 31, 2026</Text>
          <TouchableOpacity style={styles.renewButton} activeOpacity={0.8}>
            <Text style={styles.renewButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE DETAILS</Text>
          <ProfileRow icon="person" label="Full Name" value={currentUser.fullName} />
          <ProfileRow icon="email" label="Email" value={currentUser.email} />
          <ProfileRow icon="phone" label="Phone" value="+91 98765 43210" />
          <ProfileRow icon="badge" label="Designation" value="District Secretary" />
          <ProfileRow icon="location-on" label="District" value="Maharashtra" />
          <ProfileRow icon="home" label="City" value="Mumbai" />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <MaterialIcons name="lock" size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.actionText}>Change Password</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.actionText}>Notification Preferences</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.logoutRow]} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={[styles.actionText, styles.logoutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.marginMain,
    gap: spacing.stackLg,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.stackSm,
    paddingVertical: spacing.stackMd,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.headlineLg,
    color: colors.onPrimary,
  },
  fullName: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  email: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.tertiary}1A`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    ...typography.labelMd,
    color: colors.tertiary,
  },
  subscriptionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  subscriptionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  activeChip: {
    backgroundColor: `${colors.tertiary}1A`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeChipText: {
    ...typography.labelSm,
    color: colors.tertiary,
    letterSpacing: 1,
  },
  planExpiry: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  renewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  renewButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  section: {
    gap: 0,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.secondary,
    marginBottom: spacing.stackSm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackMd,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  actionText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: colors.error,
  },
});
