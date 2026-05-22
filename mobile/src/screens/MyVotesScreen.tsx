import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import TopAppBar from '../components/common/TopAppBar';
import { colors, typography, spacing } from '../theme';
import { recentVoteRecord } from '../data/mockData';

export default function MyVotesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopAppBar />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>My Votes</Text>

        {/* Voted election record */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="how-to-vote" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{recentVoteRecord.electionTitle}</Text>
              <Text style={styles.cardDate}>{recentVoteRecord.finalizedDate}</Text>
            </View>
            <View style={styles.verifiedChip}>
              <MaterialIcons name="verified" size={14} color={colors.tertiary} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <Text style={styles.verificationNote}>{recentVoteRecord.verificationMessage}</Text>
        </View>

        {/* Empty state placeholder for more records */}
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={48} color={colors.outlineVariant} />
          <Text style={styles.emptyText}>
            Future voting history will appear here.
          </Text>
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
    gap: spacing.stackMd,
    paddingBottom: spacing.stackLg,
  },
  pageTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.stackSm,
    padding: spacing.stackMd,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cardDate: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.tertiary}1A`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    ...typography.labelSm,
    color: colors.tertiary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  verificationNote: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    padding: spacing.stackMd,
    backgroundColor: colors.surfaceContainerLow,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.stackMd,
    paddingVertical: spacing.stackLg,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
