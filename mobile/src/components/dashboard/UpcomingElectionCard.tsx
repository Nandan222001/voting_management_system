import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { Election } from '../../types';

interface UpcomingElectionCardProps {
  election: Election;
}

export default function UpcomingElectionCard({ election }: UpcomingElectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            Opens in {election.opensInDays}d
          </Text>
        </View>
        <MaterialIcons name="calendar-today" size={18} color={colors.outline} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {election.title}
      </Text>
      <Text style={styles.date}>{election.openDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 1,
    marginRight: 4,
  },
  badgeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontSize: 15,
  },
  date: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
