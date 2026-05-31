import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { electionService } from '../services/electionService';
import Header from '../components/common/Header';

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  secondary: '#056e00',
  secondaryContainer: '#8dfc75',
  onSecondaryContainer: '#067500',
  surfaceContainerLow: '#f3f4f6',
  surfaceContainerHighest: '#e1e2e4',
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const end = new Date(endDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTime({ h: 0, m: 0, s: 0 });
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const Block = ({ label, value }: any) => (
    <View style={styles.timerSegment}>
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
        style={styles.timerValueBox}
      >
        <Text style={styles.timerValueText}>{value.toString().padStart(2, '0')}</Text>
      </LinearGradient>
      <Text style={styles.timerLabelText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.premiumTimerContainer}>
      <Block label="HRS" value={time.h} />
      <View style={styles.timerSeparator}><Text style={styles.timerSeparatorText}>:</Text></View>
      <Block label="MIN" value={time.m} />
      <View style={styles.timerSeparator}><Text style={styles.timerSeparatorText}>:</Text></View>
      <Block label="SEC" value={time.s} />
    </View>
  );
};

const VotingScreen = ({ navigation, route }: any) => {
  const { election: routeElection } = route.params || {};
  const { width } = useWindowDimensions();
  const [selectedElection, setSelectedElection] = useState<any>(routeElection);
  const [elections, setElections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'active' | 'upcoming'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingVote, setExistingVote] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // We allow setting to null to reset to the election list
    setSelectedElection(routeElection);
  }, [routeElection]);

  useEffect(() => {
    if (selectedElection) {
      fetchElectionDetails(selectedElection.id);
    } else {
      fetchElections();
    }
  }, [selectedElection, currentPage]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      // Fetch all published elections (up to 100) to allow accurate frontend filtering/pagination
      const response = await electionService.getElections(false, 1, 100, 'active');
      setElections(response.data || []);
      // Total items and pages will be calculated by the filtered list
    } catch (error) {
      console.error("Failed to load elections", error);
      Alert.alert("Error", "Failed to load elections.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const now = new Date().getTime();
    let filtered = elections.filter(e => {
      const start = new Date(e.start_date).getTime();
      const end = new Date(e.end_date).getTime();
      
      if (selectedFilter === 'active') {
        return start <= now && end >= now;
      } else {
        return start > now;
      }
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        (e.election_type && e.election_type.toLowerCase().includes(query))
      );
    }
    return filtered;
  };

  const filteredElections = getFilteredData();
  const paginatedElections = filteredElections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const currentTotalItems = filteredElections.length;
  const currentTotalPages = Math.ceil(currentTotalItems / itemsPerPage);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);

  const fetchElectionDetails = async (electionId: number) => {
    try {
      setLoading(true);
      const [cands, voteResponse] = await Promise.all([
        electionService.getCandidates(electionId),
        electionService.getMyVote(electionId).catch(() => null)
      ]);
      setCandidates(cands);
      
      // voteResponse is { has_voted: boolean, vote: any }
      if (voteResponse && voteResponse.has_voted) {
        setExistingVote(voteResponse.vote);
        setSelectedCandidateId(voteResponse.vote.candidate_id);
      } else {
        setExistingVote(null);
        setSelectedCandidateId(null);
      }
    } catch (error) {
      console.error("Failed to load election data", error);
      Alert.alert("Error", "Failed to load election details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidateId || !selectedElection) return;
    
    setSubmitting(true);
    try {
      await electionService.castVote(selectedElection.id, selectedCandidateId);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      fetchElectionDetails(selectedElection.id); // Refresh vote status
    } catch (error: any) {
      Alert.alert("Voting Failed", error.response?.data?.detail || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const navigateToDetails = (candidate: any) => {
    navigation.navigate('CandidateDetail', { candidate });
  };

  const handleBack = () => {
    if (routeElection) {
      navigation.goBack();
    } else {
      setSelectedElection(null);
    }
  };

  const isElectionLive = selectedElection 
    ? new Date(selectedElection.start_date).getTime() <= new Date().getTime()
    : false;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      <Header 
        showBack={!!selectedElection} 
        onBack={handleBack} 
        title={selectedElection ? "Election Detail" : "Election Portal"} 
      />
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={{ paddingBottom: selectedElection ? 100 : 20, paddingTop: 0 }} 
        showsVerticalScrollIndicator={false}
      >
        {!selectedElection ? (
          <>
            {/* Premium Hero Header */}
            <LinearGradient
              colors={['#003d9b', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroHeader}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                    <MaterialIcons name="security" size={12} color="#fff" />
                    <Text style={styles.heroBadgeText}>SECURE PORTAL</Text>
                </View>
                <Text style={styles.heroTitlePre}>Secure</Text>
                <Text style={styles.heroTitleMain}>Election Portal</Text>
                <Text style={styles.heroSub}>Access live and upcoming voting sessions for your administrative district.</Text>
                
                {/* Modern Integrated Search */}
                <View style={styles.heroSearchWrapper}>
                    <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.heroSearchInput}
                      placeholder="Search sessions..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      underlineColorAndroid="transparent"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 16 }}>
              {/* Premium Status Filter Tabs */}
              <View style={styles.premiumFilterContainer}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.premiumFilterTab, selectedFilter === 'active' && styles.premiumFilterTabActive]}
                  onPress={() => setSelectedFilter('active')}
                >
                  <MaterialIcons 
                    name="sensors" 
                    size={20} 
                    color={selectedFilter === 'active' ? '#fff' : COLORS.primary} 
                  />
                  <Text style={[styles.premiumFilterTabText, selectedFilter === 'active' && styles.premiumFilterTabTextActive]}>Active</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.premiumFilterTab, selectedFilter === 'upcoming' && styles.premiumFilterTabActive]}
                  onPress={() => setSelectedFilter('upcoming')}
                >
                  <MaterialIcons 
                    name="event" 
                    size={20} 
                    color={selectedFilter === 'upcoming' ? '#fff' : COLORS.onSurfaceVariant} 
                  />
                  <Text style={[styles.premiumFilterTabText, selectedFilter === 'upcoming' && styles.premiumFilterTabTextActive]}>Upcoming</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modernListContainer}>
                {paginatedElections.length === 0 ? (
                  <View style={styles.emptyCandidatesBox}>
                    <MaterialIcons name="how-to-vote" size={48} color={COLORS.outlineVariant} />
                    <Text style={styles.emptyCandidatesText}>
                      {searchQuery ? "No matching elections found." : `No ${selectedFilter} elections available.`}
                    </Text>
                  </View>
                ) : (
                  paginatedElections.map(elec => {
                    const isLive = new Date(elec.start_date).getTime() <= new Date().getTime();
                    const accentColor = isLive ? COLORS.secondary : '#6366f1';

                    return (
                      <TouchableOpacity 
                        key={elec.id}
                        style={styles.premiumElecCard}
                        onPress={() => setSelectedElection(elec)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.premiumElecLayout}>
                           {/* Left Column: Date & Status */}
                           <View style={styles.premiumElecLeft}>
                              <View style={[styles.premiumDateBlock, { backgroundColor: accentColor + '10' }]}>
                                 <Text style={[styles.premiumDateMonth, { color: accentColor }]}>
                                    {new Date(elec.start_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                                 </Text>
                                 <Text style={[styles.premiumDateDay, { color: COLORS.onSurface }]}>
                                    {new Date(elec.start_date).getDate()}
                                 </Text>
                              </View>
                              <View style={[styles.minimalStatusBadge, { backgroundColor: accentColor + '15', marginTop: 12 }]}>
                                <View style={[styles.liveDotSmall, { backgroundColor: accentColor }]} />
                                <Text style={[styles.statusBadgeTextSmall, { color: accentColor }]}>
                                  {isLive ? 'LIVE' : 'UPCOMING'}
                                </Text>
                              </View>
                           </View>

                           {/* Center Column: Detailed Info */}
                           <View style={styles.premiumElecCenter}>
                              <Text style={styles.premiumElecTitle} numberOfLines={1}>{elec.title}</Text>
                              
                              <View style={styles.premiumDetailRow}>
                                 <MaterialIcons name="location-on" size={14} color={COLORS.onSurfaceVariant} opacity={0.6} />
                                 <Text style={styles.premiumDetailText} numberOfLines={1}>
                                    {elec.target_district || 'Regional'} • {elec.committee_level?.toUpperCase() || 'PRECINCT'}
                                 </Text>
                              </View>

                              {elec.description && (
                                <Text style={styles.premiumDescSnippet} numberOfLines={1}>
                                   {elec.description}
                                </Text>
                              )}

                              <View style={styles.premiumFooterRow}>
                                 <View style={styles.premiumStatItem}>
                                    <MaterialIcons name="people-outline" size={14} color={COLORS.primary} />
                                    <Text style={styles.premiumStatText}>{elec.candidate_count || 0} Candidates</Text>
                                 </View>
                                 <View style={styles.premiumStatDivider} />
                                 <View style={styles.premiumStatItem}>
                                    <MaterialIcons name="schedule" size={14} color={COLORS.primary} />
                                    <Text style={styles.premiumStatText}>
                                       {new Date(elec.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                 </View>
                              </View>
                           </View>

                           {/* Right Column: Action */}
                           <View style={styles.premiumElecRight}>
                              <View style={[styles.premiumArrowBtn, { backgroundColor: accentColor + '15' }]}>
                                 <MaterialIcons name="chevron-right" size={20} color={accentColor} />
                              </View>
                           </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* Pagination Controls */}
            {currentTotalPages > 1 && (
              <View style={styles.paginationWrapper}>
                <View style={styles.resultsInfo}>
                  <Text style={styles.resultsText}>
                    Showing <Text style={{fontWeight: '700'}}>{(currentPage - 1) * itemsPerPage + 1}</Text> to <Text style={{fontWeight: '700'}}>{Math.min(currentPage * itemsPerPage, currentTotalItems)}</Text> of <Text style={{fontWeight: '700'}}>{currentTotalItems}</Text> elections
                  </Text>
                </View>

                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.pageNumbersRow}>
                    {Array.from({ length: Math.min(5, currentTotalPages) }, (_, i) => {
                      let pageNum;
                      if (currentTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= currentTotalPages - 2) {
                        pageNum = currentTotalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <TouchableOpacity 
                          key={pageNum}
                          style={[styles.pageNumberBtn, currentPage === pageNum && styles.pageNumberBtnActive]}
                          onPress={() => setCurrentPage(pageNum)}
                        >
                          <Text style={[styles.pageNumberText, currentPage === pageNum && styles.pageNumberTextActive]}>
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === currentTotalPages && styles.pageBtnDisabled]} 
                    onPress={() => setCurrentPage(prev => Math.min(currentTotalPages, prev + 1))}
                    disabled={currentPage === currentTotalPages}
                  >
                    <MaterialIcons name="chevron-right" size={24} color={currentPage === currentTotalPages ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Premium Detail Hero Section */}
            <LinearGradient
              colors={['#003d9b', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailHero}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                    <MaterialIcons name={isElectionLive ? "how-to-vote" : "event-upcoming"} size={12} color="#fff" />
                    <Text style={styles.heroBadgeText}>{isElectionLive ? 'LIVE SESSION' : 'SCHEDULED'}</Text>
                </View>
                <Text style={styles.heroTitlePre}>{isElectionLive ? 'Voting Session' : 'Upcoming Session'}</Text>
                <Text style={styles.heroTitleMain} numberOfLines={2}>{selectedElection.title}</Text>
                
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>{isElectionLive ? 'CLOSES IN' : 'STARTS IN'}</Text>
                    <CountdownTimer endDate={isElectionLive ? selectedElection.end_date : selectedElection.start_date} />
                  </View>
                  <View style={styles.detailMetaDividerVertical} />
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>TYPE</Text>
                    <View style={styles.heroTypeBadge}>
                      <Text style={styles.heroTypeBadgeText}>{selectedElection.election_type || 'GENERAL'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.detailBodyContainer}>
              {/* Election Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardRow}>
                  <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
                  <Text style={styles.infoCardText}>{selectedElection.target_district || 'Regional Jurisdiction'}</Text>
                </View>
                {selectedElection.description && (
                  <>
                    <View style={styles.cardDivider} />
                    <Text style={styles.infoDescText}>{selectedElection.description}</Text>
                  </>
                )}
              </View>

              {!isElectionLive && (
                <TouchableOpacity 
                  style={styles.nominationActionBtn}
                  onPress={() => navigation.navigate('Nomination', { election: selectedElection })}
                >
                  <LinearGradient
                    colors={['#4f46e5', '#3730a3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nominationActionGradient}
                  >
                    <MaterialIcons name="assignment-ind" size={22} color="#fff" />
                    <View>
                      <Text style={styles.nominationActionTitle}>Nominate Yourself</Text>
                      <Text style={styles.nominationActionSub}>Apply to be a candidate in this session</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleLabel}>OFFICIAL CANDIDATES</Text>
                <View style={styles.candidateCountBadge}>
                  <Text style={styles.candidateCountText}>{candidates.length}</Text>
                </View>
              </View>

              {/* Candidate List (Single Column) */}
              <View style={styles.premiumCandidatesList}>
                {candidates.length === 0 ? (
                  <View style={styles.emptyCandidatesBox}>
                    <MaterialIcons name="person-off" size={32} color={COLORS.outline} />
                    <Text style={styles.emptyCandidatesText}>No candidates registered yet.</Text>
                  </View>
                ) : (
                  candidates.map(candidate => {
                    const isSelected = selectedCandidateId === candidate.id;
                    const hasVoted = existingVote && existingVote.candidate_id === candidate.id;
                    
                    return (
                      <TouchableOpacity 
                        key={candidate.id}
                        activeOpacity={existingVote ? 1 : 0.7}
                        onPress={() => !existingVote && setSelectedCandidateId(candidate.id)}
                        style={[
                          styles.candRowCard,
                          isSelected && styles.candRowCardSelected,
                          hasVoted && styles.candRowCardVoted
                        ]}
                      >
                        <View style={styles.candRowContent}>
                          <View style={styles.candRowLeft}>
                            <View style={styles.rowAvatarWrapper}>
                              <Image 
                                source={{ uri: candidate.manifesto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=${isSelected ? '4f46e5' : 'dae2ff'}&color=${isSelected ? 'fff' : '003d9b'}&bold=true` }} 
                                style={styles.rowAvatarImg} 
                              />
                              {hasVoted && (
                                <View style={styles.rowVotedBadge}>
                                  <MaterialIcons name="verified" size={14} color="#fff" />
                                </View>
                              )}
                            </View>
                            <View style={styles.candRowInfo}>
                              <Text style={[styles.rowCandName, isSelected && styles.rowCandNameSelected]} numberOfLines={1}>
                                {candidate.full_name}
                              </Text>
                              <View style={[styles.rowPartyBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={[styles.rowPartyText, isSelected && { color: '#fff' }]} numberOfLines={1}>
                                  {candidate.committee?.name?.toUpperCase() || 'INDEPENDENT'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.candRowRight}>
                            {!existingVote ? (
                              <View style={[styles.rowVoteBtn, isSelected && styles.rowVoteBtnActive]}>
                                <Text style={[styles.rowVoteBtnText, isSelected && styles.rowVoteBtnTextActive]}>
                                  {isSelected ? 'SELECTED' : 'VOTE'}
                                </Text>
                                {isSelected && <MaterialIcons name="check-circle" size={16} color="#fff" />}
                              </View>
                            ) : (
                              <View style={[styles.rowStatusBadge, hasVoted && styles.rowStatusBadgeVoted]}>
                                <Text style={[styles.rowStatusText, hasVoted && styles.rowStatusTextVoted]}>
                                  {hasVoted ? 'YOUR CHOICE' : 'CAST'}
                                </Text>
                              </View>
                            )}
                            <TouchableOpacity 
                              style={styles.rowInfoBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                navigateToDetails(candidate);
                              }}
                            >
                              <MaterialIcons name="info-outline" size={20} color={isSelected ? '#fff' : COLORS.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* Secure Footer Note */}
              <View style={styles.secureFooterNote}>
                <MaterialIcons name="security" size={14} color={COLORS.onSurfaceVariant} opacity={0.5} />
                <Text style={styles.secureFooterText}>
                  End-to-End Encrypted Session • Protocol V4.2
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Bar */}
      {selectedElection && !existingVote && (
        <View style={styles.floatingVoteBar}>
          <LinearGradient
            colors={['rgba(244,245,247,0)', 'rgba(244,245,247,1)']}
            style={styles.floatingBarFade}
          />
          <TouchableOpacity 
            onPress={handleCastVote}
            disabled={!selectedCandidateId || submitting}
            style={[
              styles.actionCastBtn,
              (!selectedCandidateId || submitting) && styles.actionCastBtnDisabled
            ]}
          >
            <LinearGradient
              colors={selectedCandidateId ? ['#4f46e5', '#3730a3'] : ['#c3c6d6', '#c3c6d6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionCastGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="verified" size={22} color="#fff" />
                  <Text style={styles.actionCastBtnText}>Cast Secure Vote</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconContainer}>
              <MaterialIcons name="check-circle" size={48} color={COLORS.onSecondaryContainer} />
            </View>
            <Text style={styles.successTitle}>Vote Submitted</Text>
            <Text style={styles.successSub}>
              Your choice has been securely recorded on the precinct ledger. Your receipt ID: <Text style={{fontWeight: '700'}}>{existingVote?.receipt_hash?.substring(0, 12) || '#VX-9821-AZ'}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.returnBtn}
              onPress={() => {
                setShowSuccessModal(false);
                handleBack();
              }}
            >
              <Text style={styles.returnBtnText}>Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Session Detail Header Info
  sessionHeaderInfo: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sessionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.8,
  },

  nominationBtn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#f4511e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  nominationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  nominationBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  instructionBannerMini: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  instructionHeaderSmall: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  instructionDetailSmall: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    opacity: 0.7,
  },

  // Hero Header Styles
  heroHeader: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  heroContent: {
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitlePre: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  heroTitleMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: -4,
    letterSpacing: -1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  heroSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: { 
        outlineStyle: 'none' 
      }
    })
  },

  // Premium Filter Tab Styles
  premiumFilterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 6,
    marginBottom: 24,
    gap: 6,
  },
  premiumFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  premiumFilterTabActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  premiumFilterTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  premiumFilterTabTextActive: {
    color: '#fff',
  },

  premiumCandidatesGrid: {
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  gridCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },
  gridCardVoted: {
    borderColor: COLORS.secondary,
  },
  cardInfoTopBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardContent: {
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  gridAvatarWrapper: {
    position: 'relative',
  },
  gridAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  gridCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  votedBadgeAbsolute: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridCardInfo: {
    alignItems: 'center',
    gap: 4,
  },
  gridCandName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  gridCandNameSelected: {
    color: COLORS.primary,
  },
  gridPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridPartyText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  voteSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  voteSelectBtnActive: {
    backgroundColor: COLORS.primary,
  },
  voteSelectBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  voteSelectBtnTextActive: {
    color: '#fff',
  },
  voteStatusLabel: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
  },
  voteStatusLabelVoted: {
    backgroundColor: COLORS.secondary + '15',
  },
  voteStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
  },
  voteStatusTextVoted: {
    color: COLORS.secondary,
    opacity: 1,
    fontWeight: '900',
  },
  premiumCandidatesList: {
    gap: 12,
    marginTop: 8,
  },
  candRowCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  candRowCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },
  candRowCardVoted: {
    borderColor: COLORS.secondary,
  },
  candRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  candRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowAvatarWrapper: {
    position: 'relative',
  },
  rowAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  rowVotedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candRowInfo: {
    flex: 1,
    gap: 2,
  },
  rowCandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  rowCandNameSelected: {
    color: COLORS.primary,
  },
  rowPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  rowPartyText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  candRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowVoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowVoteBtnActive: {
    backgroundColor: COLORS.primary,
  },
  rowVoteBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  rowVoteBtnTextActive: {
    color: '#fff',
  },
  rowStatusBadge: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowStatusBadgeVoted: {
    backgroundColor: COLORS.secondary + '15',
  },
  rowStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
  },
  rowStatusTextVoted: {
    color: COLORS.secondary,
    opacity: 1,
    fontWeight: '900',
  },
  rowInfoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernListContainer: {
    gap: 16,
  },

  // Premium Countdown Timer Styles
  premiumTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timerSegment: {
    alignItems: 'center',
    gap: 4,
  },
  timerValueBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerValueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerLabelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerSeparator: {
    paddingBottom: 14,
  },
  timerSeparatorText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 20,
    fontWeight: '900',
  },

  detailHero: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  detailMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  detailMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailMetaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailMetaDividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTypeBadge: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroTypeBadgeText: {
    color: COLORS.onSecondaryContainer,
    fontSize: 10,
    fontWeight: '800',
  },
  detailBodyContainer: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 12,
    opacity: 0.3,
  },
  infoDescText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    opacity: 0.8,
  },
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  instructionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  instructionSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    marginTop: 2,
  },
  nominationActionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    ...Platform.select({
      ios: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },
  nominationActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  nominationActionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nominationActionSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  candidateCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  candidateCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  premiumCandidatesGrid: {
    gap: 14,
  },
  premiumCandidateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  premiumCandidateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },
  candCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  candAvatarContainer: {
    position: 'relative',
  },
  candAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 2,
    borderColor: '#fff',
  },
  candCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candInfoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candCardBody: {
    marginTop: 12,
    gap: 4,
  },
  candName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  candPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  candPartyText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  candSelectionHighlight: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 5,
    backgroundColor: COLORS.primary,
  },
  secureFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    marginBottom: 20,
  },
  secureFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    opacity: 0.4,
  },
  floatingVoteBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  floatingBarFade: {
    position: 'absolute',
    top: -40, left: 0, right: 0,
    height: 40,
  },
  actionCastBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  actionCastBtnDisabled: {
    opacity: 0.5,
  },
  actionCastGradient: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionCastBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumElecCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }
    })
  },
  premiumElecLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  premiumElecLeft: {
    alignItems: 'center',
    width: 64,
  },
  premiumDateBlock: {
    width: 60,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumDateMonth: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumDateDay: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: -2,
  },
  premiumElecCenter: {
    flex: 1,
    paddingVertical: 2,
    gap: 4,
  },
  premiumElecTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.4,
  },
  premiumDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumDetailText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    opacity: 0.8,
  },
  premiumDescSnippet: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.7,
  },
  premiumFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  premiumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  premiumStatDivider: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.4,
  },
  premiumElecRight: {
    justifyContent: 'center',
  },
  premiumArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyCandidatesBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
  },
  emptyCandidatesText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  paginationWrapper: {
    marginTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { 
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)' 
      }
    })
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  pageBtnDisabled: {
    opacity: 0.2,
  },
  pageNumbersRow: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 6,
  },
  pageNumberBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pageNumberBtnActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { 
        boxShadow: `0px 4px 6px ${COLORS.primary}4D` 
      }
    })
  },
  pageNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  pageNumberTextActive: {
    color: '#fff',
  },

  // Missing Candidate Card Styles
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
    opacity: 0.6,
  },
  candidatesGrid: { gap: 16 },
  modernCandidateCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { 
        boxShadow: '0px 6px 12px rgba(0,0,0,0.04)' 
      }
    })
  },
  modernCandidateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f6faff',
  },
  candidateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  candidateAvatarContainer: {
    width: 70,
    height: 70,
    position: 'relative',
  },
  modernCandidateImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 3,
    borderColor: '#fff',
  },
  selectionCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candidateMainInfo: {
    flex: 1,
  },
  modernCandidateName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  modernPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  modernPartyText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  detailsIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: COLORS.primary,
  },
  auditDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  auditText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 16,
  },
  modernBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  bottomBarFade: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  modernCastBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 },
      web: { 
        boxShadow: `0px 10px 20px ${COLORS.primary}4D` 
      }
    })
  },
  modernCastBtnDisabled: {
    opacity: 0.6,
  },
  castBtnGradient: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modernCastBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successBox: { backgroundColor: '#fff', width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
  successIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  returnBtn: { backgroundColor: COLORS.surfaceContainerHighest, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  returnBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
});

export default VotingScreen;
