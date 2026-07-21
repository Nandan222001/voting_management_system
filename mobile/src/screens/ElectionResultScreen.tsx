import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { electionService } from '../services/electionService';
import { mediaService } from '../services/mediaService';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { showToast } from '../utils/toast';
import { hs, vs, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryDark: '#002266',
  primaryLight: '#4a7bd4',
  secondary: '#056e00',
  surface: '#ffffff',
  background: '#f0f2f8',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  outlineVariant: '#e2e8f0',
  gold: '#f59e0b',
  goldLight: '#fef3c7',
  goldDark: '#d97706',
  silver: '#94a3b8',
  silverLight: '#f1f5f9',
  bronze: '#b45309',
  bronzeLight: '#fff7ed',
  shadow: '#000',
  accent: '#7c3aed',
  accentLight: '#ede9fe',
  rose: '#e11d48',
  roseLight: '#ffe4e6',
  cyan: '#06b6d4',
  cyanLight: '#cffafe',
  emerald: '#059669',
  emeraldLight: '#d1fae5',
};

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        delay,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const WinningPulse: React.FC<{ size?: number }> = ({ size = ms(84) }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: COLORS.gold,
        opacity: 0.25,
        transform: [{ scale: pulseAnim }],
      }}
    />
  );
};

const ConfettiBurst: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => {
        const anim = useRef(new Animated.Value(0)).current;
        const colors = [COLORS.gold, COLORS.accent, COLORS.cyan, COLORS.rose, COLORS.emerald];
        const color = colors[i % colors.length];

        useEffect(() => {
          Animated.loop(
            Animated.sequence([
              Animated.delay(i * 200),
              Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
              Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
          ).start();
        }, []);

        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20 - Math.random() * 20],
        });
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (Math.random() - 0.5) * 40],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.8, 1, 0],
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: Math.random() * 30,
              left: Math.random() * 80 + 10,
              transform: [{ translateY }, { translateX }],
              opacity,
            }}
          >
            <MaterialIcons name="stars" size={10} color={color} />
          </Animated.View>
        );
      })}
    </View>
  );
};

const ElectionResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { electionId } = route.params;

  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const fetchResult = useCallback(async () => {
    try {
      const data = await electionService.getCompletedElectionResult(electionId);
      setElection(data);
    } catch (error: any) {
      showToast.error("Error", error.response?.data?.message || "Failed to load election result.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResult();
    setRefreshing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return 'emoji-events';
      case 2: return 'workspace-premium';
      case 3: return 'military-tech';
      default: return 'numeric-' + rank;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return COLORS.gold;
      case 2: return COLORS.silver;
      case 3: return COLORS.bronze;
      default: return COLORS.onSurfaceVariant;
    }
  };

  const getRankGradient = (rank: number, isWinner: boolean): string[] => {
    if (isWinner) return ['#fef3c7', '#fde68a'];
    switch (rank) {
      case 2: return ['#f1f5f9', '#e2e8f0'];
      case 3: return ['#fff7ed', '#ffedd5'];
      default: return ['#f8fafc', '#f1f5f9'];
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f0f2f8', '#e8ecf4']} style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f2f8" />
        <View style={styles.loadingContent}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.loadingIcon}>
            <MaterialIcons name="how-to-vote" size={ms(36)} color="#fff" />
          </LinearGradient>
          <Text style={styles.loadingTitle}>Loading Results</Text>
          <Text style={styles.loadingSubtitle}>Fetching election data...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!election) {
    return (
      <LinearGradient colors={['#f0f2f8', '#e8ecf4']} style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={ms(60)} color={COLORS.outlineVariant} />
        <Text style={styles.errorText}>Failed to load results</Text>
        <TouchableOpacity onPress={fetchResult} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const winner = election.winner;
  const runnerUp = election.runner_up;
  const candidates = election.candidates || [];
  const totalVotes = election.total_votes || 0;
  const isTie = candidates.length > 1 && candidates[0]?.votes === candidates[1]?.votes;
  const hasWinner = winner && !isTie;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Premium Header */}
      <Animated.View style={{ opacity: headerOpacity }}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={ms(24)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{election.title}</Text>
            <View style={styles.headerBadgeRow}>
              <LinearGradient colors={['#059669', '#10b981']} style={styles.headerBadge}>
                <MaterialIcons name="check-circle" size={ms(12)} color="#fff" />
                <Text style={styles.headerBadgeText}>COMPLETED</Text>
              </LinearGradient>
              <Text style={styles.headerDate}>{formatDate(election.end_date)}</Text>
            </View>
          </View>
          <MaterialIcons name="emoji-events" size={ms(28)} color="rgba(255,255,255,0.25)" />
        </LinearGradient>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Stats Row */}
        <AnimatedSection delay={100}>
          <LinearGradient colors={['#fff', '#fafcff']} style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.statIconCircle}>
                  <MaterialIcons name="how-to-vote" size={ms(20)} color={COLORS.primary} />
                </LinearGradient>
                <Text style={styles.statValue}>{totalVotes.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Votes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.statIconCircle}>
                  <MaterialIcons name="people" size={ms(20)} color={COLORS.goldDark} />
                </LinearGradient>
                <Text style={styles.statValue}>{candidates.length}</Text>
                <Text style={styles.statLabel}>Candidates</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <LinearGradient colors={['#ede9fe', '#ddd6fe']} style={styles.statIconCircle}>
                  <MaterialIcons name="event" size={ms(20)} color={COLORS.accent} />
                </LinearGradient>
                <Text style={styles.statValue}>{formatDate(election.end_date).split(' ')[0]}</Text>
                <Text style={styles.statLabel}>Ended</Text>
              </View>
            </View>
          </LinearGradient>
        </AnimatedSection>

        {/* Winner Section */}
        {hasWinner && (
          <AnimatedSection delay={200}>
            <LinearGradient
              colors={['#fef3c7', '#fef9c3', '#fffbeb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.winnerCard}
            >
              <ConfettiBurst count={8} />

              <View style={styles.winnerHeader}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.trophyBadge}>
                  <MaterialIcons name="emoji-events" size={ms(20)} color="#fff" />
                  <Text style={styles.trophyText}>WINNER</Text>
                </LinearGradient>
                <Text style={styles.winMarginText}>
                  Won by {election.winning_margin || 0} vote{election.winning_margin !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.winnerContent}>
                <View style={styles.winnerAvatarContainer}>
                  {winner.photo ? (
                    <Image
                      source={{ uri: mediaService.getFileUrl(winner.photo) }}
                      style={styles.winnerAvatar}
                    />
                  ) : (
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.winnerAvatar}>
                      <MaterialIcons name="person" size={ms(36)} color="#fff" />
                    </LinearGradient>
                  )}
                  <WinningPulse size={ms(84)} />
                  <View style={styles.goldCrownBadge}>
                    <MaterialIcons name="emoji-events" size={ms(16)} color={COLORS.goldDark} />
                  </View>
                </View>
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerName} numberOfLines={1}>{winner.name}</Text>
                  {winner.position && (
                    <Text style={styles.winnerPosition}>{winner.position}</Text>
                  )}
                  <View style={styles.winnerStatsRow}>
                    <LinearGradient colors={['#fff', '#fef3c7']} style={styles.winnerChip}>
                      <MaterialIcons name="how-to-vote" size={ms(16)} color={COLORS.goldDark} />
                      <Text style={styles.winnerChipValue}>{winner.votes?.toLocaleString()}</Text>
                      <Text style={styles.winnerChipLabel}>votes</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#fff', '#fef3c7']} style={styles.winnerChip}>
                      <MaterialIcons name="trending-up" size={ms(16)} color={COLORS.goldDark} />
                      <Text style={styles.winnerChipValue}>{election.winning_margin}</Text>
                      <Text style={styles.winnerChipLabel}>margin</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>

              {/* Runner Up */}
              {runnerUp && (
                <View style={styles.runnerUpContainer}>
                  <View style={styles.runnerUpDivider} />
                  <Text style={styles.runnerUpLabel}>Runner Up</Text>
                  <View style={styles.runnerUpRow}>
                    <View style={styles.runnerUpAvatar}>
                      {runnerUp.photo ? (
                        <Image source={{ uri: mediaService.getFileUrl(runnerUp.photo) }} style={styles.runnerUpAvatarImg} />
                      ) : (
                        <LinearGradient colors={[COLORS.silver, COLORS.onSurfaceVariant]} style={styles.runnerUpAvatarImg}>
                          <MaterialIcons name="person" size={ms(18)} color="#fff" />
                        </LinearGradient>
                      )}
                    </View>
                    <Text style={styles.runnerUpName} numberOfLines={1}>{runnerUp.name}</Text>
                    <Text style={styles.runnerUpVotes}>{runnerUp.votes?.toLocaleString()} votes</Text>
                    <MaterialIcons name="workspace-premium" size={ms(22)} color={COLORS.silver} />
                  </View>
                </View>
              )}
            </LinearGradient>
          </AnimatedSection>
        )}

        {/* Tie Banner */}
        {isTie && (
          <AnimatedSection delay={200}>
            <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.tieBanner}>
              <MaterialIcons name="balance" size={ms(24)} color={COLORS.goldDark} />
              <Text style={styles.tieText}>It's a Tie!</Text>
            </LinearGradient>
          </AnimatedSection>
        )}

        {/* All Candidates */}
        <AnimatedSection delay={300}>
          <View style={styles.candidatesSection}>
            <LinearGradient colors={['#fff', '#fafcff']} style={styles.candidatesHeader}>
              <MaterialIcons name="bar-chart" size={ms(20)} color={COLORS.primary} />
              <Text style={styles.candidatesTitle}>All Candidates</Text>
              <Text style={styles.candidatesCount}>({candidates.length})</Text>
            </LinearGradient>

            {candidates.map((candidate: any, index: number) => {
              const rank = index + 1;
              const isWinner = rank === 1 && hasWinner;
              const isTieWinner = rank === 1 && isTie;
              const percentage = totalVotes > 0 ? ((candidate.votes || 0) / totalVotes) * 100 : 0;
              const gradient = getRankGradient(rank, isWinner);

              return (
                <LinearGradient
                  key={candidate.id}
                  colors={gradient}
                  style={[
                    styles.candidateCard,
                    isWinner && styles.candidateCardGold,
                    isTieWinner && styles.candidateCardGold,
                  ]}
                >
                  <View style={[styles.rankCircle, isWinner && styles.rankCircleGold]}>
                    <MaterialIcons
                      name={getRankIcon(rank) as any}
                      size={rank <= 3 ? ms(22) : ms(16)}
                      color={isWinner ? '#fff' : getRankColor(rank)}
                    />
                  </View>

                  <View style={styles.candidateAvatarWrapper}>
                    {candidate.photo ? (
                      <Image source={{ uri: mediaService.getFileUrl(candidate.photo) }} style={styles.candidateAvatar} />
                    ) : (
                      <LinearGradient colors={[COLORS.primaryLight, COLORS.primary]} style={styles.candidateAvatar}>
                        <MaterialIcons name="person" size={ms(20)} color="#fff" />
                      </LinearGradient>
                    )}
                    {(isWinner || isTieWinner) && (
                      <View style={styles.verifiedBadge}>
                        <MaterialIcons name="verified" size={ms(12)} color="#fff" />
                      </View>
                    )}
                  </View>

                  <View style={styles.candidateInfo}>
                    <Text style={[styles.candidateName, isWinner && styles.candidateNameGold]} numberOfLines={1}>
                      {candidate.name}
                    </Text>
                    {candidate.symbol && (
                      <Text style={styles.candidateSymbol} numberOfLines={1}>{candidate.symbol}</Text>
                    )}
                    <View style={styles.candidateStatsRow}>
                      <Text style={styles.candidateVotes}>{candidate.votes?.toLocaleString()} votes</Text>
                      <Text style={[styles.candidatePct, isWinner && styles.candidatePctGold]}>
                        {percentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isWinner ? COLORS.gold : (isTieWinner ? COLORS.gold : COLORS.primary),
                      }]} />
                    </View>
                  </View>

                  <Text style={[styles.rankNumber, { color: getRankColor(rank) }]}>#{rank}</Text>
                </LinearGradient>
              );
            })}
          </View>
        </AnimatedSection>

        {/* No Votes */}
        {candidates.length === 0 && (
          <AnimatedSection delay={300}>
            <View style={styles.noVotesContainer}>
              <LinearGradient colors={['#e8ecf4', '#dce0ea']} style={styles.noVotesIcon}>
                <MaterialIcons name="how-to-vote" size={ms(50)} color={COLORS.onSurfaceVariant} />
              </LinearGradient>
              <Text style={styles.noVotesTitle}>No Votes Cast</Text>
              <Text style={styles.noVotesText}>
                No votes were cast for this election. The election was completed without any participation.
              </Text>
            </View>
          </AnimatedSection>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: vs(40) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContent: { alignItems: 'center' },
  loadingIcon: {
    width: ms(80), height: ms(80), borderRadius: ms(40),
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(20),
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  loadingTitle: { fontSize: ms(22), fontWeight: '900', color: COLORS.onSurface, marginBottom: vs(8) },
  loadingSubtitle: { fontSize: ms(15), color: COLORS.onSurfaceVariant, fontWeight: '600' },
  errorText: { fontSize: ms(16), color: COLORS.onSurfaceVariant, marginTop: vs(16), fontWeight: '700' },
  retryBtn: {
    marginTop: vs(16), paddingHorizontal: hs(24), paddingVertical: vs(12),
    backgroundColor: COLORS.primary, borderRadius: ms(12),
  },
  retryText: { color: '#fff', fontWeight: '900', fontSize: ms(14) },

  // Header
  headerGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? vs(50) : vs(40),
    paddingBottom: vs(18), paddingHorizontal: hs(20),
    borderBottomLeftRadius: ms(24), borderBottomRightRadius: ms(24),
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 16,
  },
  backBtn: {
    width: ms(40), height: ms(40), borderRadius: ms(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginRight: hs(12),
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: ms(20), fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: hs(8), marginTop: vs(4) },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: hs(4),
    paddingHorizontal: hs(10), paddingVertical: vs(3),
    borderRadius: ms(12),
  },
  headerBadgeText: { color: '#fff', fontSize: ms(10), fontWeight: '900', letterSpacing: 0.5 },
  headerDate: { color: 'rgba(255,255,255,0.6)', fontSize: ms(11), fontWeight: '600' },

  // Scroll
  scrollContent: { paddingTop: vs(16), paddingHorizontal: hs(16), paddingBottom: vs(40) },

  // Stats Card
  statsCard: {
    borderRadius: ms(18), padding: ms(16),
    borderWidth: 1, borderColor: 'rgba(0,61,155,0.06)',
    marginBottom: vs(16),
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: vs(4) },
  statIconCircle: {
    width: ms(40), height: ms(40), borderRadius: ms(20),
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(4),
  },
  statValue: { fontSize: ms(20), fontWeight: '900', color: COLORS.onSurface },
  statLabel: { fontSize: ms(11), color: COLORS.onSurfaceVariant, fontWeight: '700' },
  statDivider: { width: 1, height: vs(40), backgroundColor: COLORS.outlineVariant, opacity: 0.3 },

  // Winner Card
  winnerCard: {
    borderRadius: ms(20), padding: ms(20),
    borderWidth: 2, borderColor: COLORS.gold,
    marginBottom: vs(16), overflow: 'hidden',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  winnerHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: vs(16),
  },
  trophyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: hs(6),
    paddingHorizontal: hs(14), paddingVertical: vs(6),
    borderRadius: ms(20),
  },
  trophyText: { fontSize: ms(12), fontWeight: '900', color: '#fff', letterSpacing: 1 },
  winMarginText: { fontSize: ms(12), fontWeight: '800', color: COLORS.onSurfaceVariant },

  winnerContent: { flexDirection: 'row', alignItems: 'center', gap: hs(16) },
  winnerAvatarContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  winnerAvatar: {
    width: ms(84), height: ms(84), borderRadius: ms(42),
    justifyContent: 'center', alignItems: 'center',
  },
  goldCrownBadge: {
    position: 'absolute', top: -4, right: -4,
    width: ms(28), height: ms(28), borderRadius: ms(14),
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  winnerInfo: { flex: 1 },
  winnerName: { fontSize: ms(20), fontWeight: '900', color: COLORS.onSurface, marginBottom: vs(2) },
  winnerPosition: { fontSize: ms(13), color: COLORS.onSurfaceVariant, fontWeight: '600', marginBottom: vs(8) },
  winnerStatsRow: { flexDirection: 'row', gap: hs(10) },
  winnerChip: {
    flexDirection: 'row', alignItems: 'center', gap: hs(4),
    paddingHorizontal: hs(10), paddingVertical: vs(6),
    borderRadius: ms(10), borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  winnerChipValue: { fontSize: ms(15), fontWeight: '900', color: COLORS.goldDark },
  winnerChipLabel: { fontSize: ms(10), color: COLORS.onSurfaceVariant, fontWeight: '700' },

  // Runner Up
  runnerUpContainer: { marginTop: vs(16) },
  runnerUpDivider: { height: 1, backgroundColor: COLORS.outlineVariant, marginBottom: vs(12), opacity: 0.3 },
  runnerUpLabel: { fontSize: ms(11), fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 0.5, marginBottom: vs(8) },
  runnerUpRow: { flexDirection: 'row', alignItems: 'center', gap: hs(12) },
  runnerUpAvatar: { width: ms(40), height: ms(40), borderRadius: ms(20), overflow: 'hidden' },
  runnerUpAvatarImg: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  runnerUpName: { flex: 1, fontSize: ms(14), fontWeight: '800', color: COLORS.onSurface },
  runnerUpVotes: { fontSize: ms(12), color: COLORS.onSurfaceVariant, fontWeight: '700' },

  // Tie
  tieBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: hs(10), paddingVertical: vs(16),
    borderRadius: ms(16), marginBottom: vs(16),
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  tieText: { fontSize: ms(16), fontWeight: '900', color: COLORS.goldDark, letterSpacing: 0.5 },

  // Candidates Section
  candidatesSection: { marginBottom: vs(8) },
  candidatesHeader: {
    flexDirection: 'row', alignItems: 'center', gap: hs(8),
    paddingVertical: vs(14), paddingHorizontal: hs(16),
    borderRadius: ms(14), marginBottom: vs(14),
    borderWidth: 1, borderColor: 'rgba(0,61,155,0.06)',
  },
  candidatesTitle: { flex: 1, fontSize: ms(16), fontWeight: '900', color: COLORS.onSurface, letterSpacing: -0.2 },
  candidatesCount: { fontSize: ms(13), color: COLORS.onSurfaceVariant, fontWeight: '800' },

  candidateCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: hs(14), marginBottom: vs(10),
    borderRadius: ms(14), borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    gap: hs(12),
  },
  candidateCardGold: {
    borderColor: 'rgba(245,158,11,0.2)', borderWidth: 2,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  rankCircle: {
    width: ms(34), height: ms(34), borderRadius: ms(17),
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center', alignItems: 'center',
  },
  rankCircleGold: { backgroundColor: COLORS.gold },
  rankNumber: { fontSize: ms(11), fontWeight: '800', minWidth: ms(28), textAlign: 'right' },

  candidateAvatarWrapper: { position: 'relative' },
  candidateAvatar: {
    width: ms(48), height: ms(48), borderRadius: ms(24),
    justifyContent: 'center', alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: ms(18), height: ms(18), borderRadius: ms(9),
    backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },

  candidateInfo: { flex: 1 },
  candidateName: { fontSize: ms(14), fontWeight: '800', color: COLORS.onSurface, marginBottom: vs(2) },
  candidateNameGold: { color: COLORS.goldDark },
  candidateSymbol: { fontSize: ms(11), color: COLORS.onSurfaceVariant, fontWeight: '600', marginBottom: vs(4) },
  candidateStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(6) },
  candidateVotes: { fontSize: ms(12), fontWeight: '800', color: COLORS.onSurface },
  candidatePct: { fontSize: ms(12), fontWeight: '900', color: COLORS.primary },
  candidatePctGold: { color: COLORS.goldDark },

  progressBar: {
    height: vs(5), backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: ms(3), overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: ms(3) },

  // No Votes
  noVotesContainer: { alignItems: 'center', paddingVertical: vs(50), paddingHorizontal: hs(30) },
  noVotesIcon: {
    width: ms(100), height: ms(100), borderRadius: ms(50),
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(20),
  },
  noVotesTitle: { fontSize: ms(20), fontWeight: '900', color: COLORS.onSurface, marginBottom: vs(8) },
  noVotesText: { fontSize: ms(14), color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center', lineHeight: ms(22) },
});

export default ElectionResultScreen;