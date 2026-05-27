import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { electionService } from '../services/electionService';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Header from '../components/common/Header';

const { height } = Dimensions.get('window');

const VotingScreen = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);

  const fetchElections = async () => {
    try {
      const data = await electionService.getElections();
      setElections(data.filter((e: any) => e.status === 'active'));
    } catch (error) {
      Alert.alert('Error', 'Failed to load active ballots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleSelectElection = async (election: any) => {
    setSelectedElection(election);
    setModalVisible(true);
    setVotingLoading(true);
    try {
      const candidatesData = await electionService.getCandidates(election.id);
      setCandidates(candidatesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load candidates');
      setModalVisible(false);
    } finally {
      setVotingLoading(false);
    }
  };

  const handleVote = async (candidate: any) => {
    Alert.alert(
      'Secure Ballot Confirmation',
      `You are about to cast your vote for ${candidate.full_name}. This action is permanent and encrypted.`,
      [
        { text: 'Review', style: 'cancel' },
        {
          text: 'Confirm Vote',
          onPress: async () => {
            try {
              await electionService.castVote(selectedElection.id, candidate.id);
              Alert.alert('Ballot cast successfully', 'Your vote has been securely recorded in the registry.');
              setModalVisible(false);
              fetchElections();
            } catch (error: any) {
              const msg = error.response?.data?.detail || 'Failed to cast vote';
              Alert.alert('System Error', msg);
            }
          },
        },
      ]
    );
  };

  const renderElectionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.electionCard}
      onPress={() => handleSelectElection(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHighlight} />
      <View style={styles.cardInner}>
        <View style={styles.electionHeader}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPEN BALLOT</Text>
          </View>
          <MaterialIcons name="security" size={16} color="#94a3b8" />
        </View>

        <Text style={styles.electionTitle}>{item.title}</Text>
        <Text style={styles.electionDesc} numberOfLines={2}>Official regional ballot for the current session.</Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <MaterialIcons name="timer" size={16} color="rgb(16 102 177)" />
            <Text style={styles.electionDate}>
              Ends: {new Date(item.end_date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.actionPrompt}>
             <Text style={styles.actionText}>CAST VOTE</Text>
             <MaterialIcons name="chevron-right" size={18} color="rgb(16 102 177)" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="rgb(16 102 177)" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.screenHeader}>
         <Text style={styles.screenTitle}>Official Registry</Text>
         <Text style={styles.screenSub}>Select an active ballot to participate in the democratic process.</Text>
      </View>
      
      {elections.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <FontAwesome5 name="shield-alt" size={32} color="#cbd5e1" />
          </View>
          <Text style={styles.emptyTitle}>Registry Clear</Text>
          <Text style={styles.emptyText}>No active ballots found in your region at this time.</Text>
        </View>
      ) : (
        <FlatList
          data={elections}
          renderItem={renderElectionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchElections();
            }} colors={['rgb(16 102 177)']} />
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSubtitle}>Authorized Casting Session</Text>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedElection?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {votingLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="rgb(16 102 177)" />
                <Text style={styles.loadingText}>Loading verified candidates...</Text>
              </View>
            ) : (
              <FlatList
                data={candidates}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.candidateCard}
                    onPress={() => handleVote(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.candidateAvatar}>
                      <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                    </View>
                    <View style={styles.candidateInfo}>
                      <Text style={styles.candidateName}>{item.full_name}</Text>
                      <View style={styles.badgeRow}>
                         <View style={styles.vettedBadge}>
                            <MaterialIcons name="verified" size={10} color="#10b981" />
                            <Text style={styles.vettedText}>VETTED</Text>
                         </View>
                         {item.party && <Text style={styles.partyName}>{item.party}</Text>}
                      </View>
                    </View>
                    <View style={styles.voteBtn}>
                      <Text style={styles.voteBtnText}>CAST</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyCandidates}>
                    <Text style={styles.emptyText}>No verified candidates available.</Text>
                  </View>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  screenHeader: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 8 },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  screenSub: { fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 18 },
  list: { padding: 20 },
  electionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  cardHighlight: { height: 4, backgroundColor: 'rgb(16 102 177)' },
  cardInner: { padding: 20 },
  electionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#047857' },
  electionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  electionDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dateInfo: { flexDirection: 'row', alignItems: 'center' },
  electionDate: { fontSize: 12, color: '#475569', marginLeft: 6, fontWeight: '600' },
  actionPrompt: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '800', color: 'rgb(16 102 177)', marginRight: 4 },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  modalSubtitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  closeButton: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  modalLoading: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600', fontSize: 13 },

  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgb(16 102 177)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  vettedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#d1fae5', marginRight: 8 },
  vettedText: { fontSize: 8, color: '#047857', fontWeight: '800', marginLeft: 2 },
  partyName: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  voteBtn: { backgroundColor: 'rgb(16 102 177)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  voteBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  emptyCandidates: { padding: 20, alignItems: 'center' },
});

export default VotingScreen;
