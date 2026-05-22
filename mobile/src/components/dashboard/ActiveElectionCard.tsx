import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Election } from '../../types';

interface ActiveElectionCardProps {
  election: Election;
  onVotePress?: (election: Election) => void;
}

export default function ActiveElectionCard({
  election,
  onVotePress,
}: ActiveElectionCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onVotePress?.(election)}
      accessibilityRole="button"
      accessibilityLabel={`${election.title}, polls close ${election.closingInfo}`}
    >
      <View style={styles.infoRow}>
        <View style={styles.iconWrapper}>
          <MaterialIcons
            name={election.icon as keyof typeof MaterialIcons.glyphMap}
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.title} numberOfLines={2}>
            {election.title}
          </Text>
          <Text style={styles.closingInfo}>Polls Close: {election.closingInfo}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.voteButton}
        onPress={() => onVotePress?.(election)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Vote now in ${election.title}`}
      >
        <Text style={styles.voteButtonText}>VOTE NOW</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: spacing.stackMd,
    gap: spacing.stackMd,
    marginBottom: spacing.stackSm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  closingInfo: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  voteButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.stackLg,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    letterSpacing: 1.2,
  },
});
