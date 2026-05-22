import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { LastVoteCast } from '../../types';

interface StatsBentoGridProps {
  activeElectionsCount: number;
  lastVoteCast?: LastVoteCast;
  onViewAllVotes?: () => void;
}

export default function StatsBentoGrid({
  activeElectionsCount,
  lastVoteCast,
  onViewAllVotes,
}: StatsBentoGridProps) {
  return (
    <View style={styles.row}>
      {/* Primary — Active Elections */}
      <View style={styles.primaryCard}>
        <MaterialIcons
          name="how-to-vote"
          size={40}
          color={`${colors.onPrimary}80`}
        />
        <View style={styles.cardBottom}>
          <Text style={styles.primaryTitle}>
            {activeElectionsCount} Active{'\n'}
            {activeElectionsCount !== 1 ? 'Elections' : 'Election'}
          </Text>
          <Text style={styles.primarySubtitle}>
            Cast your vote before polls close.
          </Text>
        </View>
      </View>

      {/* Secondary — Last Vote Cast */}
      <View style={styles.secondaryCard}>
        <View style={styles.secondaryTop}>
          <MaterialIcons name="history" size={28} color={colors.primary} />
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onViewAllVotes}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.secondaryTitle}>Last Vote Cast</Text>
          {lastVoteCast ? (
            <Text style={styles.secondarySubtitle}>
              {lastVoteCast.date} – {lastVoteCast.electionTitle}
            </Text>
          ) : (
            <Text style={styles.secondarySubtitle}>No votes yet</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.stackMd,
  },
  primaryCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.stackMd,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: spacing.stackMd,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardBottom: {
    gap: 4,
  },
  primaryTitle: {
    ...typography.headlineSm,
    color: colors.onPrimary,
  },
  primarySubtitle: {
    ...typography.bodyMd,
    color: `${colors.onPrimary}CC`,
  },
  secondaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  secondaryTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  secondarySubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  viewAllButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewAllText: {
    ...typography.labelMd,
    color: colors.primary,
  },
});
