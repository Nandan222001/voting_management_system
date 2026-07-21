import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { electionService } from '../services/electionService';
import { mediaService } from '../services/mediaService';
import { showToast } from '../utils/toast';
import { hs, vs, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryDark: '#002266',
  primaryLight: '#4a7bd4',
  secondary: '#056e00',
  secondaryLight: '#4caf50',
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

interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = index * 150;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        delay,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateY }],
        opacity: opacityAnim,
      }}
    >
      {children}
    </Animated.View>
  );
};

const CompletedElectionsScreen = ({ navigation }: any) => {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchCompletedElections = useCallback(async () => {
    try {
      const response = await electionService.getMyCompletedElections();
      const data = response?.data || response || [];
      setElections(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast.error("Error", error.response?.data?.message || "Failed to load completed elections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedElections();
  }, [fetchCompletedElections]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCompletedElections();
    setRefreshing(false);
  }, [fetchCompletedElections]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTrophyColor = (rank: number) => {
    switch (rank) {
      case 1: return COLORS.gold;
      case 2: return COLORS.silver;
      case 3: return COLORS.bronze;
      default: return COLORS.onSurfaceVariant;
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return 'emoji-events';
      case 2: return 'workspace-premium';
      case 3: return 'military-tech';
      default: return 'numeric-' + rank;
    }
  };

  const ConfettiPiece = ({ delay, color }: { delay: number; color: string }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -30],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 1, 0],
    });

    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          right: Math.random() * 60,
          transform: [{ translateY }],
          opacity,
        }}
      >
        <MaterialIcons name="stars" size={12} color={color} />
      </Animated.View>
    );
  };

  const WinningPulse = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <Animated.View
        style={{
          position: 'absolute',
          width: ms(64),
          height: ms(64),
          borderRadius: ms(32),
          borderWidth: 3,
          borderColor: COLORS.gold,
          opacity: 0.3,
          transform: [{ scale: pulseAnim }],
        }}
      />
    );
  };

  const renderElectionCard = ({ item, index }: { item: any; index: number }) => {
    const winner = item.winner;
    const isTie = item.candidates?.length > 1 &&
      item.candidates[0]?.votes === item.candidates[1]?.votes;
    const hasWinner = winner && !isTie;

    return (
      <AnimatedCard index={index}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation.navigate('ElectionResult', { electionId: item.election_id })}
        >
          <LinearGradient
            colors={['#ffffff', '#fafcff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.electionCard}
          >
            {/* Premium Glow Border */}
            <LinearGradient
              colors={['rgba(0,61,155,0.12)', 'rgba(245,158,11,0.08)', 'rgba(0,61,155,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: ms(20) }]}
            />

            {/* Status Badge with Confetti */}
            <View style={styles.topBadgeRow}>
              <LinearGradient
                colors={['#056e00', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.completedBadge}
              >
                <MaterialIcons name="check-circle" size={ms(14)} color="#fff" />
                <Text style={styles.completedBadgeText}>COMPLETED</Text>
              </LinearGradient>
              {hasWinner && <ConfettiPiece delay={0} color={COLORS.gold} />}
              {hasWinner && <ConfettiPiece delay={300} color={COLORS.accent} />}
              {hasWinner && <ConfettiPiece delay={600} color={COLORS.cyan} />}
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <MaterialIcons
                name="how-to-vote"
                size={ms(18)}
                color={COLORS.primary}
                style={{ marginRight: hs(8) }}
              />
              <Text style={styles.electionTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Winner Section - Animated Premium */}
            {hasWinner && (
              <View style={styles.winnerSection}>
                <View style={styles.trophyBanner}>
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.trophyBadge}
                  >
                    <MaterialIcons name="emoji-events" size={ms(22)} color="#fff" />
                    <Text style={styles.trophyLabel}>VICTORY</Text>
                  </LinearGradient>
                  <Text style={styles.winningMarginText}>
                    Won by {item.winning_margin || 0} vote{item.winning_margin !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View style={styles.winnerContent}>
                  <View style={styles.winnerAvatarContainer}>
                    {winner.photo ? (
                      <Image
                        source={{ uri: mediaService.getFileUrl(winner.photo) }}
                        style={styles.winnerAvatarImg}
                      />
                    ) : (
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.winnerAvatarImg}
                      >
                        <MaterialIcons name="person" size={ms(30)} color="#fff" />
                      </LinearGradient>
                    )}
                    <WinningPulse />
                    <View style={styles.goldCrown}>
                      <MaterialIcons name="emoji-events" size={ms(14)} color={COLORS.goldDark} />
                    </View>
                  </View>
                  <View style={styles.winnerInfo}>
                    <Text style={styles.winnerName} numberOfLines={1}>
                      {winner.name}
                    </Text>
                    {winner.position && (
                      <Text style={styles.winnerPosition} numberOfLines={1}>
                        {winner.position}
                      </Text>
                    )}
                    <View style={styles.winnerStatsRow}>
                      <LinearGradient
                        colors={['#eff6ff', '#dbeafe']}
                        style={styles.statChip}
                      >
                        <MaterialIcons name="how-to-vote" size={ms(14)} color={COLORS.primary} />
                        <Text style={styles.statChipText}>
                          {winner.votes} votes
                        </Text>
                      </LinearGradient>
                      <LinearGradient
                        colors={[COLORS.goldLight, '#fde68a']}
                        style={styles.statChip}
                      >
                        <MaterialIcons name="trending-up" size={ms(14)} color={COLORS.goldDark} />
                        <Text style={[styles.statChipText, { color: COLORS.goldDark }]}>
                          Winner
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Tie Banner */}
            {isTie && (
              <LinearGradient
                colors={['#fef3c7', '#fde68a']}
                style={styles.tieBanner}
              >
                <MaterialIcons name="balance" size={ms(20)} color={COLORS.goldDark} />
                <Text style={styles.tieText}>It's a Tie!</Text>
              </LinearGradient>
            )}

            {/* Podium */}
            {item.candidates && item.candidates.length > 0 && (
              <View style={styles.podiumSection}>
                <View style={styles.podiumHeader}>
                  <MaterialIcons name="bar-chart" size={ms(16)} color={COLORS.primary} />
                  <Text style={styles.podiumHeaderText}>Top Candidates</Text>
                </View>
                <View style={styles.podiumRow}>
                  {item.candidates.slice(0, 3).map((candidate: any, cIndex: number) => {
                    const rank = cIndex + 1;
                    const isWinner = rank === 1 && hasWinner;
                    return (
                      <LinearGradient
                        key={candidate.id}
                        colors={
                          isWinner
                            ? ['#fef3c7', '#fde68a']
                            : rank === 2
                            ? ['#f1f5f9', '#e2e8f0']
                            : ['#fff7ed', '#ffedd5']
                        }
                        style={[
                          styles.podiumItem,
                          isWinner && styles.podiumItemGold,
                        ]}
                      >
                        <View style={[
                          styles.rankBadge,
                          isWinner && styles.rankBadgeGold,
                        ]}>
                          <MaterialIcons
                            name={getRankEmoji(rank) as any}
                            size={ms(18)}
                            color={isWinner ? '#fff' : getTrophyColor(rank)}
                          />
                        </View>
                        {candidate.photo ? (
                          <Image
                            source={{ uri: mediaService.getFileUrl(candidate.photo) }}
                            style={styles.podiumAvatar}
                          />
                        ) : (
                          <LinearGradient
                            colors={[COLORS.primaryLight, COLORS.primary]}
                            style={styles.podiumAvatar}
                          >
                            <MaterialIcons name="person" size={ms(18)} color="#fff" />
                          </LinearGradient>
                        )}
                        <Text
                          style={[styles.podiumName, isWinner && styles.podiumNameGold]}
                          numberOfLines={1}
                        >
                          {candidate.name}
                        </Text>
                        <Text style={[styles.podiumVotes, isWinner && styles.podiumVotesGold]}>
                          {candidate.votes?.toLocaleString()}
                        </Text>
                        <Text style={styles.podiumPct}>
                          {candidate.percentage?.toFixed(1)}%
                        </Text>
                      </LinearGradient>
                    );
                  })}
                </View>
              </View>
            )}

            {/* View Details Arrow */}
            <LinearGradient
              colors={['#f8fafc', '#f1f5f9']}
              style={styles.footerRow}
            >
              <Text style={styles.viewDetailsText}>View Full Results</Text>
              <View style={styles.arrowCircle}>
                <MaterialIcons name="arrow-forward" size={ms(18)} color={COLORS.primary} />
              </View>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f0f2f8', '#e8ecf4']} style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0f2f8" />
        <View style={styles.loadingContent}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.loadingIconCircle}
          >
            <MaterialIcons name="how-to-vote" size={ms(36)} color="#fff" />
          </LinearGradient>
          <Text style={styles.loadingTitle}>Loading Results</Text>
          <Text style={styles.loadingSubtitle}>Fetching your completed elections...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Premium Animated Header */}
      <Animated.View style={[styles.headerWrapper, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={ms(24)} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Completed Elections</Text>
              <Text style={styles.headerSubtitle}>
                {elections.length} election{elections.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <MaterialIcons name="emoji-events" size={ms(28)} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={elections}
        keyExtractor={(item) => `election-${item.election_id ?? item.id}`}
        renderItem={renderElectionCard}
        contentContainerStyle={[
          styles.listContainer,
          elections.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#e8ecf4', '#dce0ea']}
              style={styles.emptyIconCircle}
            >
              <MaterialIcons name="hourglass-empty" size={ms(50)} color={COLORS.onSurfaceVariant} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Completed Elections</Text>
            <Text style={styles.emptySubtitle}>
              Elections you've voted in will appear here automatically once they end.
            </Text>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.emptyCTA}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('Voting')}
                style={styles.emptyCTAContent}
              >
                <MaterialIcons name="how-to-vote" size={ms(20)} color="#fff" />
                <Text style={styles.emptyCTAText}>Go Vote Now</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor="#fff"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconCircle: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  loadingTitle: {
    fontSize: ms(22),
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: vs(8),
  },
  loadingSubtitle: {
    fontSize: ms(15),
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },

  // Header
  headerWrapper: {
    zIndex: 100,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? vs(50) : vs(40),
    paddingBottom: vs(20),
    paddingHorizontal: hs(20),
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(12),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: ms(13),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: vs(2),
  },

  // List
  listContainer: {
    paddingHorizontal: hs(16),
    paddingTop: vs(20),
    paddingBottom: vs(30),
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Card
  electionCard: {
    borderRadius: ms(20),
    padding: ms(20),
    marginBottom: vs(18),
    borderWidth: 1,
    borderColor: 'rgba(0,61,155,0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      web: {
        boxShadow: '0px 6px 20px rgba(0,0,0,0.06)',
      },
    }),
  },

  // Top Badge
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: vs(12),
    overflow: 'visible',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(20),
  },
  completedBadgeText: {
    fontSize: ms(11),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },

  // Title
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },
  electionTitle: {
    flex: 1,
    fontSize: ms(18),
    fontWeight: '900',
    color: COLORS.onSurface,
    letterSpacing: -0.3,
    lineHeight: ms(24),
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,61,155,0.06)',
    marginBottom: vs(16),
  },

  // Winner
  winnerSection: {
    marginBottom: vs(16),
  },
  trophyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(14),
  },
  trophyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(20),
  },
  trophyLabel: {
    fontSize: ms(11),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  winningMarginText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  winnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(16),
  },
  winnerAvatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerAvatarImg: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldCrown: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: ms(17),
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: vs(2),
  },
  winnerPosition: {
    fontSize: ms(13),
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: vs(8),
  },
  winnerStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hs(8),
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  statChipText: {
    fontSize: ms(11),
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Tie
  tieBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    paddingVertical: vs(12),
    borderRadius: ms(12),
    marginBottom: vs(16),
  },
  tieText: {
    fontSize: ms(15),
    fontWeight: '900',
    color: COLORS.goldDark,
  },

  // Podium
  podiumSection: {
    marginBottom: vs(14),
  },
  podiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    marginBottom: vs(12),
  },
  podiumHeaderText: {
    fontSize: ms(13),
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: hs(8),
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: hs(6),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  podiumItemGold: {
    borderColor: 'rgba(245,158,11,0.2)',
    borderWidth: 2,
  },
  rankBadge: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  rankBadgeGold: {
    backgroundColor: COLORS.gold,
  },
  podiumAvatar: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    marginBottom: vs(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumName: {
    fontSize: ms(11),
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: vs(4),
  },
  podiumNameGold: {
    color: COLORS.goldDark,
  },
  podiumVotes: {
    fontSize: ms(15),
    fontWeight: '900',
    color: COLORS.onSurface,
  },
  podiumVotesGold: {
    color: COLORS.goldDark,
  },
  podiumPct: {
    fontSize: ms(10),
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    marginTop: vs(2),
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: hs(8),
    marginTop: vs(4),
    paddingTop: vs(12),
    marginHorizontal: -ms(20),
    marginBottom: -ms(20),
    paddingHorizontal: ms(20),
    paddingBottom: ms(14),
    borderBottomLeftRadius: ms(20),
    borderBottomRightRadius: ms(20),
  },
  viewDetailsText: {
    fontSize: ms(13),
    fontWeight: '800',
    color: COLORS.primary,
  },
  arrowCircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: 'rgba(0,61,155,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: hs(40),
  },
  emptyIconCircle: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  emptyTitle: {
    fontSize: ms(20),
    fontWeight: '900',
    color: COLORS.onSurface,
    marginBottom: vs(10),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: ms(14),
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: ms(22),
    marginBottom: vs(24),
  },
  emptyCTA: {
    borderRadius: ms(16),
    overflow: 'hidden',
  },
  emptyCTAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(10),
    paddingHorizontal: hs(24),
    paddingVertical: vs(14),
  },
  emptyCTAText: {
    fontSize: ms(15),
    fontWeight: '900',
    color: '#fff',
  },
});

export default CompletedElectionsScreen;