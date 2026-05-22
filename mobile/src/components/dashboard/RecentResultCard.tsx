import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { VoteRecord } from '../../types';

interface RecentResultCardProps {
  result: VoteRecord;
  onViewResults?: (result: VoteRecord) => void;
}

export default function RecentResultCard({
  result,
  onViewResults,
}: RecentResultCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{result.electionTitle}</Text>
          <Text style={styles.finalizedDate}>{result.finalizedDate}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onViewResults?.(result)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="View results"
        >
          <Text style={styles.viewButtonText}>View Results</Text>
          <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.verificationRow}>
        <View style={styles.checkIconWrapper}>
          <MaterialIcons name="check-circle" size={20} color={colors.onSurfaceVariant} />
        </View>
        <Text style={styles.verificationText}>{result.verificationMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.onSurface,
  },
  finalizedDate: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  viewButtonText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackMd,
    padding: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLow,
  },
  checkIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.outlineVariant}50`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  verificationText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    flex: 1,
  },
});
