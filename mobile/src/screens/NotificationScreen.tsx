import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';
import { Announcement, announcementService } from '../services/announcementService';

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  background: '#f8f9fb',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  primaryFixed: '#dae2ff',
  accent: '#ff8c00',
  error: '#ba1a1a',
};

const todayLabel = () => new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const timeLabel = (value: string) => new Date(value).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});

export default function NotificationScreen({ navigation }: any) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const featured = useMemo(() => items.find((item) => item.is_featured), [items]);
  const regularItems = useMemo(
    () => items.filter((item) => item.id !== featured?.id),
    [items, featured],
  );

  const load = async () => {
    try {
      const todayItems = await announcementService.getToday();
      setItems(todayItems);
    } catch (error) {
      console.error('Failed to load today announcements', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAnnouncement = (announcement: Announcement) => {
    navigation.navigate('AnnouncementDetail', { id: announcement.id, announcement });
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />
      <FlatList
        data={regularItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListHeaderComponent={(
          <View>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="notifications-active" size={26} color="#fff" />
              </View>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroKicker}>Today</Text>
                <Text style={styles.heroTitle}>{todayLabel()}</Text>
                <Text style={styles.heroDescription}>
                  Current-date announcements published by your organization.
                </Text>
              </View>
            </View>

            {featured && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.featuredCard}
                onPress={() => openAnnouncement(featured)}
              >
                {featured.image_urls?.[0] ? (
                  <Image source={{ uri: featured.image_urls[0] }} style={styles.featuredImage} />
                ) : (
                  <View style={styles.featuredFallback}>
                    <MaterialIcons name="campaign" size={34} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.featuredBody}>
                  <View style={styles.featuredBadge}>
                    <MaterialIcons name="star" size={12} color={COLORS.primary} />
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
                  <Text style={styles.featuredDescription} numberOfLines={2}>{featured.short_description}</Text>
                  <View style={styles.readRow}>
                    <Text style={styles.timeText}>{timeLabel(featured.publish_date)}</Text>
                    <MaterialIcons name="chevron-right" size={18} color={COLORS.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.sectionHeader}>
              <View style={styles.titleIndicator} />
              <Text style={styles.sectionTitle}>
                {items.length ? `${items.length} Announcement${items.length > 1 ? 's' : ''}` : 'No Announcements'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          !featured ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="notifications-none" size={36} color={COLORS.outlineVariant} />
              <Text style={styles.emptyTitle}>No announcements for today</Text>
              <Text style={styles.emptyText}>New announcements published today will appear here.</Text>
            </View>
          ) : null
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.notificationCard} activeOpacity={0.9} onPress={() => openAnnouncement(item)}>
            <View style={styles.notificationIcon}>
              <MaterialIcons name="campaign" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.notificationBody}>
              <View style={styles.notificationTop}>
                <Text style={styles.notificationTime}>{timeLabel(item.publish_date)}</Text>
                {item.attachment_urls?.length > 0 && (
                  <MaterialIcons name="attach-file" size={15} color={COLORS.onSurfaceVariant} />
                )}
              </View>
              <Text style={styles.notificationTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.notificationDescription} numberOfLines={2}>{item.short_description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.outlineVariant} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTextWrap: { flex: 1 },
  heroKicker: { color: COLORS.primaryFixed, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  heroDescription: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 4 },
  featuredCard: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 14 },
      android: { elevation: 4 },
    }),
  },
  featuredImage: { width: '100%', height: 160, backgroundColor: COLORS.primaryFixed },
  featuredFallback: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  featuredBody: { padding: 16 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, backgroundColor: COLORS.primaryFixed, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, marginBottom: 10 },
  featuredBadgeText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  featuredTitle: { color: COLORS.onSurface, fontSize: 19, fontWeight: '900', lineHeight: 24 },
  featuredDescription: { color: COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 19, fontWeight: '600', marginTop: 6 },
  readRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  timeText: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  titleIndicator: { width: 5, height: 20, borderRadius: 3, backgroundColor: COLORS.accent },
  sectionTitle: { color: COLORS.onSurface, fontSize: 16, fontWeight: '900' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.outlineVariant, borderRadius: 22, padding: 36 },
  emptyTitle: { color: COLORS.onSurface, fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptyText: { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginTop: 5 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  notificationIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  notificationBody: { flex: 1 },
  notificationTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  notificationTime: { color: COLORS.onSurfaceVariant, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  notificationTitle: { color: COLORS.onSurface, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  notificationDescription: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 3 },
});
