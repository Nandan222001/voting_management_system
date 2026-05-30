import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { electionService } from '../services/electionService';
import Header from '../components/common/Header';

const { width } = Dimensions.get('window');

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
    <View style={styles.timerBlock}>
      <Text style={styles.timerValue}>{value.toString().padStart(2, '0')}</Text>
      <Text style={styles.timerLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.timerContainer}>
      <Block label="HRS" value={time.h} />
      <Block label="MIN" value={time.m} />
      <Block label="SEC" value={time.s} />
    </View>
  );
};

const VotingScreen = ({ navigation, route }: any) => {
  const { election: routeElection } = route.params || {};
  const [selectedElection, setSelectedElection] = useState<any>(routeElection);
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingVote, setExistingVote] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (routeElection) {
      setSelectedElection(routeElection);
    }
  }, [routeElection]);

  useEffect(() => {
    if (selectedElection) {
      fetchElectionDetails(selectedElection.id);
    } else {
      fetchElections();
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const allElections = await electionService.getElections();
      // Show all except drafts
      const filtered = allElections.filter((e: any) => e.status !== 'draft');
      setElections(filtered);
    } catch (error) {
      console.error("Failed to load elections", error);
      Alert.alert("Error", "Failed to load elections.");
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionDetails = async (electionId: number) => {
    try {
      setLoading(true);
      const [cands, vote] = await Promise.all([
        electionService.getCandidates(electionId),
        electionService.getMyVote(electionId).catch(() => null)
      ]);
      setCandidates(cands);
      if (vote) {
        setExistingVote(vote);
        setSelectedCandidateId(vote.candidate_id);
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- RENDER ELECTIONS LIST IF NO ELECTION SELECTED ---
  if (!selectedElection) {
    return (
      <View style={styles.container}>
        <Header />
        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={{ paddingBottom: 60, paddingTop: 24 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.instructionBannerMini}>
             <Text style={styles.instructionHeaderSmall}>Select an active session</Text>
             <Text style={styles.instructionDetailSmall}>Access secure voting sessions currently open for your district.</Text>
          </View>

          <View style={styles.modernListContainer}>
            {elections.length === 0 ? (
               <View style={styles.emptyCandidatesBox}>
                 <MaterialIcons name="how-to-vote" size={48} color={COLORS.outline} />
                 <Text style={styles.emptyCandidatesText}>No active elections available.</Text>
               </View>
            ) : (
              elections.map(elec => (
                <TouchableOpacity 
                  key={elec.id}
                  style={styles.modernElectionCard}
                  onPress={() => setSelectedElection(elec)}
                  activeOpacity={0.9}
                >
                  <View style={styles.modernElecCardTop}>
                    <View style={styles.modernElecTitleGroup}>
                      <Text style={styles.modernElecTitle}>{elec.title}</Text>
                      <View style={styles.modernElecBadgeRow}>
                        <View style={styles.modernTypeBadgeSmall}>
                          <Text style={styles.modernTypeBadgeTextSmall}>{elec.election_type || 'GENERAL'}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.elecArrowBtn}>
                      <MaterialIcons name="chevron-right" size={24} color={COLORS.primary} />
                    </View>
                  </View>
                  
                  <View style={styles.modernElecCardBottom}>
                    <View style={styles.elecMetaItem}>
                      <Text style={styles.statusLabel}>STATUS:</Text>
                      {elec.status === 'active' ? (
                        <View style={[styles.statusBadgeSmall, { backgroundColor: COLORS.secondary }]}>
                          <View style={styles.liveDotSmall} />
                          <Text style={styles.statusBadgeTextSmall}>ACTIVE</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadgeSmall, { backgroundColor: COLORS.error }]}>
                          <Text style={[styles.statusBadgeTextSmall, { color: '#fff' }]}>CLOSED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.elecMetaItem}>
                      <MaterialIcons name="people" size={14} color={COLORS.onSurfaceVariant} />
                      <Text style={styles.elecMetaText}>Candidates Listed</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- RENDER SINGLE ELECTION DETAIL & CANDIDATES ---
  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 24 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Election Session Header Info */}
        <View style={styles.sessionHeaderInfo}>
           <Text style={styles.sessionLabel}>SECURE VOTING SESSION</Text>
           <Text style={styles.sessionTitle}>{selectedElection.title}</Text>
           
           <View style={styles.sessionMetaRow}>
             <View style={styles.sessionBadge}>
               <MaterialIcons name="access-time" size={14} color={COLORS.primary} />
               <Text style={styles.sessionBadgeText}>CLOSES IN</Text>
               <CountdownTimer endDate={selectedElection.end_date || new Date(Date.now() + 86400000).toISOString()} />
             </View>
             <View style={styles.sessionBadge}>
               <MaterialIcons name="layers" size={14} color={COLORS.primary} />
               <Text style={styles.sessionBadgeText}>{selectedElection.election_type || 'GENERAL'}</Text>
             </View>
           </View>

           <TouchableOpacity 
             style={styles.nominationBtn}
             onPress={() => navigation.navigate('Nomination', { election: selectedElection })}
           >
              <LinearGradient
                colors={['#ff8c00', '#f4511e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nominationGradient}
              >
                <MaterialIcons name="assignment-ind" size={20} color="#fff" />
                <Text style={styles.nominationBtnText}>Apply for Nomination</Text>
              </LinearGradient>
           </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionBanner}>
           <View style={styles.instructionIcon}>
             <MaterialIcons 
               name={existingVote ? "task-alt" : "touch-app"} 
               size={24} 
               color={existingVote ? COLORS.secondary : COLORS.primary} 
             />
           </View>
           <View style={{ flex: 1 }}>
             <Text style={styles.instructionHeader}>
               {existingVote ? "Participation Recorded" : "Cast Your Vote"}
             </Text>
             <Text style={styles.instructionDetail}>
               {existingVote 
                 ? "You have already cast your secure vote in this election session." 
                 : "Please select one candidate from the list below to represent your interests."}
             </Text>
           </View>
        </View>

        <Text style={styles.listSectionTitle}>OFFICIAL CANDIDATES</Text>

        {/* Candidate List */}
        <View style={styles.candidatesGrid}>
          {candidates.length === 0 ? (
             <View style={styles.emptyCandidatesBox}>
               <MaterialIcons name="person-off" size={32} color={COLORS.outline} />
               <Text style={styles.emptyCandidatesText}>No candidates registered yet.</Text>
             </View>
          ) : (
            candidates.map(candidate => (
              <TouchableOpacity 
                key={candidate.id}
                style={[
                  styles.modernCandidateCard,
                  selectedCandidateId === candidate.id && styles.modernCandidateCardSelected
                ]}
                onPress={() => !existingVote && setSelectedCandidateId(candidate.id)}
                activeOpacity={existingVote ? 1 : 0.8}
              >
                <View style={styles.candidateTopRow}>
                  <View style={styles.candidateAvatarContainer}>
                    <Image 
                      source={{ uri: candidate.manifesto_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.full_name) + '&background=003d9b&color=fff' }} 
                      style={styles.modernCandidateImg} 
                    />
                    {selectedCandidateId === candidate.id && (
                      <View style={styles.selectionCheck}>
                        <MaterialIcons name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View style={styles.candidateMainInfo}>
                    <Text style={styles.modernCandidateName}>{candidate.full_name}</Text>
                    <View style={styles.modernPartyBadge}>
                       <Text style={styles.modernPartyText}>{candidate.committee?.name?.toUpperCase() || 'INDEPENDENT'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.detailsIconButton}
                    onPress={() => navigateToDetails(candidate)}
                  >
                    <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {selectedCandidateId === candidate.id && (
                  <View style={styles.selectionHighlight} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Audit Disclaimer */}
        <View style={styles.auditDisclaimer}>
           <MaterialIcons name="fingerprint" size={16} color={COLORS.onSurfaceVariant} style={{ opacity: 0.6 }} />
           <Text style={styles.auditText}>
              Session ID: <Text style={{fontWeight: '700'}}>{selectedElection.id}-AUDIT-2026</Text> • All actions are cryptographically signed.
           </Text>
        </View>
      </ScrollView>

      {/* Bottom Floating Action Bar */}
      {!existingVote && (
        <View style={styles.modernBottomBar}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
            style={styles.bottomBarFade}
          />
          <TouchableOpacity 
              style={[
                styles.modernCastBtn,
                (!selectedCandidateId || submitting) && styles.modernCastBtnDisabled
              ]}
              disabled={!selectedCandidateId || submitting}
              onPress={handleCastVote}
          >
              <LinearGradient
                colors={selectedCandidateId ? [COLORS.primary, COLORS.primaryContainer] : [COLORS.outlineVariant, COLORS.outlineVariant]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.castBtnGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="verified-user" size={22} color="#fff" />
                    <Text style={styles.modernCastBtnText}>Confirm Selection</Text>
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

  modernListContainer: {
    gap: 16,
  },
  modernElectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  modernElecCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modernElecTitleGroup: {
    flex: 1,
    marginRight: 12,
  },
  modernElecTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 24,
  },
  modernElecBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  modernTypeBadgeSmall: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  modernTypeBadgeTextSmall: {
    fontSize: 9, fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 0.5,
  },
  statusBadgeSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  statusBadgeTextSmall: {
    fontSize: 9, fontWeight: '800', color: '#fff',
  },
  liveDotSmall: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff',
  },
  elecArrowBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center',
  },
  modernElecCardBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainerLow, paddingTop: 12,
  },
  elecMetaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  elecMetaText: {
    fontSize: 11, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    marginRight: 6,
    opacity: 0.6,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerMainTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTypeBadge: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerTypeBadgeText: {
    color: COLORS.onSecondaryContainer,
    fontSize: 11,
    fontWeight: '800',
  },

  votingHeader: {
    height: 64,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  headerIcon: { padding: 10 },
  votingHeaderText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },

  scrollContent: { flex: 1, paddingHorizontal: 16 },
  
  timerContainer: { flexDirection: 'row', gap: 6 },
  timerBlock: { alignItems: 'center', minWidth: 36 },
  timerValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  timerLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '700' },

  instructionBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  instructionDetail: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 4,
  },

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
      android: { elevation: 3 }
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
      web: { boxShadow: `0px 10px 20px ${COLORS.primary}4D` }
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
  electionCardItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }
    })
  },
  electionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  electionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    marginRight: 12
  },
  liveBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary
  },
  liveTextMini: {
    color: COLORS.onSecondaryContainer,
    fontSize: 10,
    fontWeight: '700'
  },
  electionCardType: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 16
  },
  electionCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerLow,
    paddingTop: 12
  },
  endDateText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic'
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginTop: 20
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600'
  }
});

export default VotingScreen;
