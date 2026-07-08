import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { candidateService } from '../services/candidateService';
import { mediaService } from '../services/mediaService';
import Header from '../components/common/Header';
import { hs, vs, ms } from '../utils/responsive';

const COLORS = {
  primary: '#003d9b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

const FollowersListScreen = ({ navigation }: any) => {
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowers = async () => {
    try {
      const data = await candidateService.getFollowers();
      setFollowers(data || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowers();
  };

  const renderFollowerItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.followerCard}
      activeOpacity={0.7}
      onPress={() => {
        navigation.navigate('UserDetail', { user: item });
      }}
    >
      <View style={styles.avatarContainer}>
        {item.image_url ? (
          <Image 
            source={{ uri: mediaService.getFileUrl(item.image_url) }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <Ionicons name="person" size={ms(24)} color={COLORS.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.followerInfo}>
        <Text style={styles.followerName}>{item.full_name || 'Anonymous User'}</Text>
        <Text style={styles.followerRole}>{item.role || 'Voter'}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={ms(24)} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header showBack onBack={() => navigation.goBack()} title="Followers" />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={ms(64)} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Followers Yet</Text>
          <Text style={styles.emptySubtitle}>When people follow you, they will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollowerItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: hs(40),
  },
  listContent: {
    padding: hs(16),
  },
  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: ms(12),
    borderRadius: ms(12),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    overflow: 'hidden',
    marginRight: hs(12),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: ms(16),
    fontWeight: '700',
    color: COLORS.text,
  },
  followerRole: {
    fontSize: ms(13),
    color: COLORS.textSecondary,
    marginTop: vs(2),
  },
  emptyIconContainer: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: COLORS.border + '50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
  },
  emptyTitle: {
    fontSize: ms(20),
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: vs(8),
  },
  emptySubtitle: {
    fontSize: ms(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: vs(20),
  },
});

export default FollowersListScreen;
