import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/common/Header';
import { Announcement } from '../services/announcementService';
import { notificationService, NotificationItem, NotificationGroups } from '../services/notificationService';
import { eventService, EventNotification } from '../services/eventService';
import { navigationService } from '../utils/navigationService';
import { hs, vs, ms } from '../utils/responsive';

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
  secondary: '#056e00',
};

const todayLabel = () => new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const tomorrowLabel = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const timeLabel = (value: string) => new Date(value).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});

export default function NotificationScreen({ navigation }: any) {
  const [data, setData] = useState<NotificationGroups>({ today: [], tomorrow: [] });
  const [eventNotifs, setEventNotifs] = useState<EventNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const featured = useMemo(() => 
    data.today.find((item) => item.item_type === 'announcement' && (item as Announcement).is_featured) as Announcement | undefined
  , [data.today]);

  const regularToday = useMemo(
    () => data.today.filter((item) => item.item_type !== 'announcement' || item.id !== featured?.id),
    [data.today, featured],
  );

  const load = async () => {
    try {
      const [groups, events] = await Promise.all([
        notificationService.getNotifications(),
        eventService.getEventNotifications()
      ]);
      setData(groups);
      setEventNotifs(events);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openItem = (item: any) => {
    if (item.item_type === 'announcement') {
      navigationService.navigate('AnnouncementDetail', { id: item.id, announcement: item });
    } else if (item.item_type === 'election') {
      navigationService.navigate('Voting', { election: item }, 'Elections');
    } else if (item.event) {
      navigationService.navigate('EventDetail', { event: item.event }, 'Profile');
      if (!item.is_read) {
        eventService.markNotificationRead(item.id).catch(console.error);
      }
    } else {
      navigationService.navigate('Dashboard');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} COLORS={[COLORS.primary]} />}
      >
        {/* SECTION 1: TODAY */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="notifications-active" size={ms(26)} color="#fff" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroKicker}>Today</Text>
            <Text style={styles.heroTitle}>{todayLabel()}</Text>
            <Text style={styles.heroDescription}>
              Active events and announcements for today.
            </Text>
          </View>
        </View>

        {/* Event Notifications Section */}
        {eventNotifs.length > 0 && (
          <View style={{ marginBottom: vs(16) }}>
            <View style={styles.sectionHeader}>
              <View style={[styles.titleIndicator, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.sectionTitle}>Event Alerts</Text>
            </View>
            {eventNotifs.map((notif) => (
              <TouchableOpacity 
                key={`event-notif-${notif.id}`} 
                style={[styles.notificationCard, !notif.is_read && { borderLeftWidth: 4, borderLeftColor: COLORS.primary }]} 
                onPress={() => openItem(notif)}
              >
                <View style={[styles.notificationIcon, { backgroundColor: COLORS.accent + '15' }]}>
                  <MaterialIcons name="event" size={ms(22)} color={COLORS.accent} />
                </View>
                <View style={styles.notificationBody}>
                  <Text style={styles.notificationTime}>{timeLabel(notif.created_at)}</Text>
                  <Text style={styles.notificationTitle}>New Event: {notif.event?.event_type}</Text>
                  <Text style={styles.notificationDescription}>
                    Scheduled for {notif.event?.event_date} at {notif.event?.place}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={ms(22)} color={COLORS.outlineVariant} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {featured && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.featuredCard}
            onPress={() => openItem(featured)}
          >
            {featured.image_urls?.[0] ? (
              <Image source={{ uri: featured.image_urls[0] }} style={styles.featuredImage} />
            ) : (
              <View style={styles.featuredFallback}>
                <MaterialIcons name="campaign" size={ms(34)} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.featuredBody}>
              <View style={styles.featuredBadge}>
                <MaterialIcons name="star" size={ms(12)} color={COLORS.primary} />
                <Text style={styles.featuredBadgeText}>Featured</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
              <Text style={styles.featuredDescription} numberOfLines={2}>{featured.short_description}</Text>
              <View style={styles.readRow}>
                <Text style={styles.timeText}>{timeLabel(featured.publish_date)}</Text>
                <MaterialIcons name="chevron-right" size={ms(18)} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {regularToday.length > 0 ? (
          regularToday.map((item) => (
            <NotificationCard key={`${item.item_type}-${item.id}`} item={item} onPress={() => openItem(item)} />
          ))
        ) : (
          !featured && (
            <View style={styles.emptyCard}>
              <MaterialIcons name="notifications-none" size={ms(36)} color={COLORS.outlineVariant} />
              <Text style={styles.emptyTitle}>No announcements for today</Text>
              <Text style={styles.emptyText}>New announcements published today will appear here.</Text>
            </View>
          )
        )}

        {/* SECTION 2: TOMORROW */}
        <View style={[styles.sectionHeader, { marginTop: vs(24) }]}>
          <View style={[styles.titleIndicator, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.sectionTitle}>Tomorrow</Text>
        </View>
        <Text style={styles.sectionSubtitle}>{tomorrowLabel()}</Text>

        {data.tomorrow.length > 0 ? (
          data.tomorrow.map((item) => (
            <NotificationCard key={`${item.item_type}-${item.id}`} item={item} onPress={() => openItem(item)} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-note" size={ms(36)} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>No scheduled events for tomorrow</Text>
            <Text style={styles.emptyText}>Any upcoming announcements or elections will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const NotificationCard = ({ item, onPress }: { item: NotificationItem; onPress: () => void }) => {
  const isAnnouncement = item.item_type === 'announcement';
  const icon = isAnnouncement ? 'campaign' : 'how-to-vote';
  const iconColor = isAnnouncement ? COLORS.primary : COLORS.secondary;
  const time = isAnnouncement ? (item as Announcement).publish_date : (item as any).start_date;

  return (
    <TouchableOpacity style={styles.notificationCard} activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.notificationIcon, { backgroundColor: iconColor + '15' }]}>
        <MaterialIcons name={icon} size={ms(22)} color={iconColor} />
      </View>
      <View style={styles.notificationBody}>
        <View style={styles.notificationTop}>
          <Text style={styles.notificationTime}>{timeLabel(time)}</Text>
          {!isAnnouncement && (
            <View style={styles.electionBadge}>
              <Text style={styles.electionBadgeText}>ELECTION</Text>
            </View>
          )}
        </View>
        <Text style={styles.notificationTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.notificationDescription} numberOfLines={2}>
          {isAnnouncement ? (item as Announcement).short_description : (item as any).description || 'Starting tomorrow'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={ms(22)} color={COLORS.outlineVariant} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  content: { padding: hs(16), paddingBottom: vs(40), gap: vs(12) },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(14),
    backgroundColor: COLORS.primary,
    borderRadius: ms(12),
    padding: hs(18),
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  heroIcon: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTextWrap: { flex: 1 },
  heroKicker: { color: COLORS.primaryFixed, fontSize: ms(11), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: ms(20), fontWeight: '900', marginTop: vs(2) },
  heroDescription: { color: 'rgba(255,255,255,0.75)', fontSize: ms(12), fontWeight: '600', lineHeight: vs(17), marginTop: vs(4) },
  featuredCard: {
    overflow: 'hidden',
    borderRadius: ms(12),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: vs(18),
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 14 },
      android: { elevation: 4 },
    }),
  },
  featuredImage: { width: '100%', height: vs(160), backgroundColor: COLORS.primaryFixed },
  featuredFallback: { height: vs(120), alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  featuredBody: { padding: hs(16) },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: hs(4), backgroundColor: COLORS.primaryFixed, paddingHorizontal: hs(9), paddingVertical: vs(5), borderRadius: ms(9), marginBottom: vs(10) },
  featuredBadgeText: { color: COLORS.primary, fontSize: ms(9), fontWeight: '900', textTransform: 'uppercase' },
  featuredTitle: { color: COLORS.onSurface, fontSize: ms(19), fontWeight: '900', lineHeight: vs(24) },
  featuredDescription: { color: COLORS.onSurfaceVariant, fontSize: ms(13), lineHeight: vs(19), fontWeight: '600', marginTop: vs(6) },
  readRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(14) },
  timeText: { color: COLORS.onSurfaceVariant, fontSize: ms(11), fontWeight: '800', textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(4) },
  sectionSubtitle: { color: COLORS.onSurfaceVariant, fontSize: ms(13), fontWeight: '600', marginBottom: vs(12), marginLeft: hs(13) },
  titleIndicator: { width: hs(5), height: vs(20), borderRadius: ms(3), backgroundColor: COLORS.accent },
  sectionTitle: { color: COLORS.onSurface, fontSize: ms(18), fontWeight: '900' },
  electionBadge: { backgroundColor: COLORS.secondary + '15', paddingHorizontal: hs(6), paddingVertical: vs(2), borderRadius: ms(4) },
  electionBadgeText: { color: COLORS.secondary, fontSize: ms(8), fontWeight: '900' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.outlineVariant, borderRadius: ms(11), padding: hs(36), marginTop: vs(10) },
  emptyTitle: { color: COLORS.onSurface, fontSize: ms(16), fontWeight: '900', marginTop: vs(12) },
  emptyText: { color: COLORS.onSurfaceVariant, fontSize: ms(13), fontWeight: '600', textAlign: 'center', lineHeight: vs(18), marginTop: vs(5) },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
    backgroundColor: COLORS.surface,
    borderRadius: ms(9),
    padding: hs(14),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  notificationIcon: { width: ms(42), height: ms(42), borderRadius: ms(14), alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  notificationBody: { flex: 1 },
  notificationTop: { flexDirection: 'row', alignItems: 'center', gap: hs(4), marginBottom: vs(3) },
  notificationTime: { color: COLORS.onSurfaceVariant, fontSize: ms(10), fontWeight: '900', textTransform: 'uppercase' },
  notificationTitle: { color: COLORS.onSurface, fontSize: ms(15), fontWeight: '900', lineHeight: vs(20) },
  notificationDescription: { color: COLORS.onSurfaceVariant, fontSize: ms(12), fontWeight: '600', lineHeight: vs(17), marginTop: vs(3) },
});
