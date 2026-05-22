import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopAppBar from '../components/common/TopAppBar';
import SectionHeader from '../components/common/SectionHeader';
import GreetingSection from '../components/dashboard/GreetingSection';
import StatsBentoGrid from '../components/dashboard/StatsBentoGrid';
import ActiveElectionCard from '../components/dashboard/ActiveElectionCard';
import UpcomingElectionCard from '../components/dashboard/UpcomingElectionCard';
import RecentResultCard from '../components/dashboard/RecentResultCard';
import { colors, spacing } from '../theme';
import {
  currentUser,
  activeElections,
  upcomingElections,
  recentVoteRecord,
  lastVoteCast,
} from '../data/mockData';
import { Election } from '../types';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  const handleVotePress = (election: Election) => {
    console.log('Vote pressed for:', election.title);
  };

  const handleViewAllVotes = () => {
    console.log('View all votes');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopAppBar onNotificationsPress={() => console.log('Notifications')} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GreetingSection user={currentUser} />

        <StatsBentoGrid
          activeElectionsCount={activeElections.length}
          lastVoteCast={lastVoteCast}
          onViewAllVotes={handleViewAllVotes}
        />

        {/* Active Elections */}
        <View style={styles.section}>
          <SectionHeader title="Active Elections" showPulse />
          {activeElections.map(election => (
            <ActiveElectionCard
              key={election.id}
              election={election}
              onVotePress={handleVotePress}
            />
          ))}
        </View>

        {/* Upcoming Elections */}
        <View style={[styles.section, styles.dimmed]}>
          <SectionHeader title="Upcoming Elections" />
          <View style={styles.twoColumn}>
            {upcomingElections.map(election => (
              <UpcomingElectionCard key={election.id} election={election} />
            ))}
          </View>
        </View>

        {/* Recent Results */}
        <View style={styles.section}>
          <SectionHeader title="Recent Results" />
          <RecentResultCard
            result={recentVoteRecord}
            onViewResults={() => console.log('View results')}
          />
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
    paddingBottom: spacing.stackLg,
  },
  section: {
    gap: spacing.stackSm,
  },
  dimmed: {
    opacity: 0.6,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.stackMd,
  },
});
