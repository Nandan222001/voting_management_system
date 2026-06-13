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

const FollowingListScreen = ({ navigation }: any) => {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowing = async () => {
    try {
      const data = await candidateService.getFollowing();
      setFollowing(data || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowing();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
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
      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name || 'Anonymous User'}</Text>
        <Text style={styles.role}>{item.role || 'Member'}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={ms(24)} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header showBack onBack={() => navigation.goBack()} title="Following" />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : following.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="person-add-outline" size={ms(64)} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Not Following Anyone</Text>
          <Text style={styles.emptySubtitle}>When you follow candidates or representatives, they will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderItem}
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
  card: {
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: ms(16),
    fontWeight: '700',
    color: COLORS.text,
  },
  role: {
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

export default FollowingListScreen;
