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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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

const STATIC_CANDIDATES = [
  {
    id: 1,
    full_name: 'Eleanor Vance',
    party: 'Party Alpha',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaLbJYG0FFa0HHd53_Eke-vUdcbPYbrx5WdZZI6YpRZPjOSHUi0odKNAMTX-CUXoGUzl0goUw97eEBk-hXbKGeemP9hHlMlA217OJ3zSiW0W3trX6iIbeFnek_uGanlmjXN2o3QIwxEDta7qeyM1_5jBnd8SGhZRRJ8mR9iOY8FYWi5ZXy7lmTZYMCQU45FlsqhaOsJ9j_vk5SDw2pFLECx6dfNdq4sR2YXtuyG6_ctCV-aPyY_gSxDrSGt9TnztuU63keBlT204k'
  },
  {
    id: 2,
    full_name: 'Marcus Thorne',
    party: 'Party Beta',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX2Dj6GuygdzUOiNkTrqb7Z-pcJ9WcpBqqPftIK6UOpBKqMLiJ2SHJWvmuqM94vcl6T3f2AD31FDkIIQvQqgPX6iAvw2bKrWFWGf7eKvy-IYKnSVm1bskLuK7TS2Bp6qEJsNwLBivodoTnABldfmJQWCaTWaMhANwS4sHpSUyM2PG_tu_oTH9hg7XYwfuZXOhuwvn8_Qyeq-juFp-qAJNJjdK9PglwBNJPqmCCetAIbzbeFr-FZiYECufjxGb-H_98iSNDB_y55n8'
  },
  {
    id: 3,
    full_name: 'Sarah Jenkins',
    party: 'Independent',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeJZIR1yzhYZg2veql8hvLtb92w66inF-snv8lK0bCYJiSSVNARDlvpu-WISLAVPPRu8UPplLZtFwLhF8qx0npfVJwPXJd8gl3M_SpZXMNJAYTIpPOQlvtN0_rQjE8nrEehWCABiwLVidWshb0uWmb9hvcvKqA7hqFlLx8Dp_Q0cf1Z4Koh8LuDv0vbGb-UZp_MuB4t_69HaDNWefAhD1aUSq0ATgEVPCqg4W1JWsoBt9QYpaX9gsugcxAyuSaJ3qtCV4K5iJUrJc'
  }
];

const CountdownTimer = () => {
  const [time, setTime] = useState({ h: 4, m: 22, s: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

const VotingScreen = ({ navigation }: any) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCastVote = () => {
    if (selectedCandidateId) {
      setShowSuccessModal(true);
    }
  };

  const navigateToDetails = (candidate: any) => {
    navigation.navigate('CandidateDetail', { candidate });
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.votingHeader}>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.votingHeaderText}>2026 Presidential Primary</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialIcons name="notifications-none" size={24} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Election Banner */}
        <View style={styles.electionBanner}>
          <View style={styles.bannerTop}>
            <View>
              <Text style={styles.bannerLabel}>CURRENT ELECTION</Text>
              <Text style={styles.bannerTitle}>Federal Primary Results</Text>
            </View>
            <MaterialIcons name="verified-user" size={32} color="#fff" />
          </View>
          <Text style={styles.countdownLabel}>Voting closes in:</Text>
          <CountdownTimer />
        </View>

        {/* Instructions */}
        <View style={styles.instructionBox}>
           <Text style={styles.instructionTitle}>Select your candidate</Text>
           <Text style={styles.instructionSub}>Please choose one individual to represent your district.</Text>
        </View>

        {/* Candidate List */}
        <View style={styles.candidatesStack}>
          {STATIC_CANDIDATES.map(candidate => (
            <TouchableOpacity 
              key={candidate.id}
              style={[
                styles.candidateCard,
                selectedCandidateId === candidate.id && styles.candidateCardSelected
              ]}
              onPress={() => setSelectedCandidateId(candidate.id)}
              activeOpacity={0.9}
            >
              <Image 
                source={{ uri: candidate.image }} 
                style={styles.candidateImg} 
              />
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName}>{candidate.full_name}</Text>
                <View style={styles.partyRow}>
                   <View style={styles.partyBadge}>
                      <Text style={styles.partyBadgeText}>{candidate.party.toUpperCase()}</Text>
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
          ))}
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
      <View style={styles.bottomBar}>
         <TouchableOpacity 
            style={[
              styles.castBtn,
              !selectedCandidateId && styles.castBtnDisabled
            ]}
            disabled={!selectedCandidateId}
            onPress={handleCastVote}
         >
            <MaterialIcons name="lock" size={20} color="#fff" />
            <Text style={styles.castBtnText}>Cast Secure Vote</Text>
         </TouchableOpacity>
         <Text style={styles.signedAction}>Cryptographically Signed Action</Text>
      </View>

      {/* Success Modal */}
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconContainer}>
              <MaterialIcons name="check-circle" size={48} color={COLORS.onSecondaryContainer} />
            </View>
            <Text style={styles.successTitle}>Vote Submitted</Text>
            <Text style={styles.successSub}>
              Your choice has been securely recorded on the precinct ledger. Your receipt ID: <Text style={{fontWeight: '700'}}>#VX-9821-AZ</Text>
            </Text>
            <TouchableOpacity 
              style={styles.returnBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.returnBtnText}>Return to Dashboard</Text>
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
});

export default VotingScreen;
