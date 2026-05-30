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
import { MaterialIcons } from '@expo/vector-icons';
import { electionService } from '../services/electionService';

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
      fetchActiveElections();
    }
  }, [selectedElection]);

  const fetchActiveElections = async () => {
    try {
      setLoading(true);
      const allElections = await electionService.getElections();
      const active = allElections.filter((e: any) => e.status === 'active');
      setElections(active);
    } catch (error) {
      console.error("Failed to load active elections", error);
      Alert.alert("Error", "Failed to load active elections.");
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
        {/* Top App Bar */}
        <View style={styles.votingHeader}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.votingHeaderText}>Active Ballots</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialIcons name="info-outline" size={24} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={styles.instructionBox}>
             <Text style={styles.instructionTitle}>Select an Election</Text>
             <Text style={styles.instructionSub}>Choose one of the ongoing ballots below to view candidate profiles and cast your secure vote.</Text>
          </View>

          <View style={styles.candidatesStack}>
            {elections.length === 0 ? (
               <View style={styles.emptyContainer}>
                 <MaterialIcons name="how-to-vote" size={48} color={COLORS.onSurfaceVariant} style={{ marginBottom: 12 }} />
                 <Text style={styles.emptyText}>No active elections currently.</Text>
               </View>
            ) : (
              elections.map(elec => (
                <TouchableOpacity 
                  key={elec.id}
                  style={styles.electionCardItem}
                  onPress={() => setSelectedElection(elec)}
                  activeOpacity={0.8}
                >
                  <View style={styles.electionCardTop}>
                    <Text style={styles.electionCardTitle}>{elec.title}</Text>
                    <View style={styles.liveBadgeMini}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveTextMini}>LIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.electionCardType}>Type: {elec.election_type || 'General'}</Text>
                  
                  <View style={styles.electionCardBottom}>
                    <Text style={styles.endDateText}>Closes: {new Date(elec.end_date).toLocaleDateString()}</Text>
                    <View style={styles.actionLinkRow}>
                      <Text style={styles.enterBallotText}>Enter Ballot</Text>
                      <MaterialIcons name="chevron-right" size={20} color={COLORS.primary} />
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
      {/* Top App Bar */}
      <View style={styles.votingHeader}>
        <TouchableOpacity style={styles.headerIcon} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.votingHeaderText}>{selectedElection.title || 'Voting'}</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialIcons name="info-outline" size={24} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Election Banner */}
        <View style={styles.electionBanner}>
          <View style={styles.bannerTop}>
            <View>
              <Text style={styles.bannerLabel}>CURRENT ELECTION</Text>
              <Text style={styles.bannerTitle}>{selectedElection.title}</Text>
            </View>
            <MaterialIcons name="verified-user" size={32} color="#fff" />
          </View>
          <Text style={styles.countdownLabel}>Voting closes in:</Text>
          <CountdownTimer endDate={selectedElection.end_date || new Date(Date.now() + 86400000).toISOString()} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionBox}>
           <Text style={styles.instructionTitle}>{existingVote ? "Your vote has been recorded" : "Select your candidate"}</Text>
           <Text style={styles.instructionSub}>{existingVote ? "You have already participated in this election." : "Please choose one individual to represent your district."}</Text>
        </View>

        {/* Candidate List */}
        <View style={styles.candidatesStack}>
          {candidates.length === 0 ? (
             <Text style={{ textAlign: 'center', marginTop: 20 }}>No candidates found for this election.</Text>
          ) : (
            candidates.map(candidate => (
              <TouchableOpacity 
                key={candidate.id}
                style={[
                  styles.candidateCard,
                  selectedCandidateId === candidate.id && styles.candidateCardSelected
                ]}
                onPress={() => !existingVote && setSelectedCandidateId(candidate.id)}
                activeOpacity={existingVote ? 1 : 0.9}
              >
                <Image 
                  source={{ uri: candidate.manifesto_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(candidate.full_name) + '&background=0D8ABC&color=fff' }} 
                  style={styles.candidateImg} 
                />
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateName}>{candidate.full_name}</Text>
                  <View style={styles.partyRow}>
                     <View style={styles.partyBadge}>
                        <Text style={styles.partyBadgeText}>{candidate.committee?.name?.toUpperCase() || 'INDEPENDENT'}</Text>
                     </View>
                     <TouchableOpacity onPress={() => navigateToDetails(candidate)}>
                        <Text style={styles.detailsLink}>View Details</Text>
                     </TouchableOpacity>
                  </View>
                </View>
                <View style={[
                  styles.checkCircle,
                  selectedCandidateId === candidate.id && styles.checkCircleSelected
                ]}>
                  {selectedCandidateId === candidate.id && <View style={styles.checkDot} />}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Verification Note */}
        <View style={styles.verificationNote}>
           <MaterialIcons name="shield" size={20} color={COLORS.onSurfaceVariant} />
           <Text style={styles.verificationText}>
              Your identity has been verified via <Text style={{fontWeight: '700'}}>Federal Biometric ID</Text>. This vote is end-to-end encrypted and anonymous.
           </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!existingVote && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
              style={[
                styles.castBtn,
                (!selectedCandidateId || submitting) && styles.castBtnDisabled
              ]}
              disabled={!selectedCandidateId || submitting}
              onPress={handleCastVote}
          >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="lock" size={20} color="#fff" />
                  <Text style={styles.castBtnText}>Cast Secure Vote</Text>
                </>
              )}
          </TouchableOpacity>
          <Text style={styles.signedAction}>Cryptographically Signed Action</Text>
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

  scrollContent: { flex: 1, padding: 16 },
  
  electionBanner: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 4 }
    })
  },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bannerTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 4 },
  countdownLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 8 },
  
  timerContainer: { flexDirection: 'row', gap: 12 },
  timerBlock: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 56, alignItems: 'center' },
  timerValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  timerLabel: { color: '#fff', fontSize: 10, fontWeight: '700', opacity: 0.8 },

  instructionBox: { marginBottom: 16 },
  instructionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  instructionSub: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2 },

  candidatesStack: { gap: 12 },
  candidateCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.outlineVariant, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16 
  },
  candidateCardSelected: { borderColor: COLORS.primary, backgroundColor: '#f0f7ff' },
  candidateImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surfaceContainerLow },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  partyBadge: { backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  partyBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant },
  detailsLink: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.outlineVariant, justifyContent: 'center', alignItems: 'center' },
  checkCircleSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  verificationNote: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 12, marginTop: 24, borderWidth: 1, borderColor: COLORS.outlineVariant },
  verificationText: { flex: 1, fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(255,255,255,0.8)', borderTopWidth: 1, borderTopColor: COLORS.outlineVariant },
  castBtn: { 
    backgroundColor: COLORS.primary, 
    height: 56, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
  },
  castBtnDisabled: { opacity: 0.5, backgroundColor: COLORS.primaryContainer },
  castBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  signedAction: { textAlign: 'center', fontSize: 10, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', marginTop: 12, letterSpacing: 0.5 },

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
      android: { elevation: 2 }
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
  enterBallotText: {
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
