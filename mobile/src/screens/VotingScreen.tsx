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
} from 'react-native';
import { electionService } from '../services/electionService';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';

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
      Alert.alert('Error', 'Failed to load elections');
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
      'Confirm Vote',
      `You are about to vote for ${candidate.full_name}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Vote',
          onPress: async () => {
            try {
              await electionService.castVote(selectedElection.id, candidate.id);
              Alert.alert('Vote Cast!', 'Your vote has been securely recorded.');
              setModalVisible(false);
              fetchElections();
            } catch (error: any) {
              const msg = error.response?.data?.detail || 'Failed to cast vote';
              Alert.alert('Error', msg);
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
      activeOpacity={0.7}
    >
      <View style={styles.electionIcon}>
        <MaterialIcons name="event-note" size={24} color="#4f46e5" />
      </View>
      <View style={styles.electionInfo}>
        <Text style={styles.electionTitle}>{item.title}</Text>
        <View style={styles.dateBadge}>
          <MaterialIcons name="timer" size={14} color="#6b7280" />
          <Text style={styles.electionDate}>
            Ends: {new Date(item.end_date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Active Elections" />
      
      {elections.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="how-to-vote" size={60} color="#e5e7eb" />
          </View>
          <Text style={styles.emptyTitle}>No Pending Votes</Text>
          <Text style={styles.emptyText}>There are no active elections matching your district right now.</Text>
        </View>
      ) : (
        <FlatList
          data={elections}
          renderItem={renderElectionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchElections();
            }} colors={['#4f46e5']} />
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
              <View>
                <Text style={styles.modalSubtitle}>Cast your vote for</Text>
                <Text style={styles.modalTitle}>{selectedElection?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {votingLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading candidates...</Text>
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
                      {item.party && (
                        <View style={styles.partyBadge}>
                          <Text style={styles.partyText}>{item.party}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.voteCircle}>
                      <MaterialIcons name="check" size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyCandidates}>
                    <Text style={styles.emptyText}>No candidates registered for this election.</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  electionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  electionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  electionInfo: {
    flex: 1,
  },
  electionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  electionDate: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 20,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  candidateAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  partyBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  partyText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  voteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCandidates: {
    padding: 20,
    alignItems: 'center',
  },
});

export default VotingScreen;
