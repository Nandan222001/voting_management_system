import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';
import { Announcement, announcementService } from '../services/announcementService';

const COLORS = {
  primary: '#003d9b',
  background: '#f8f9fb',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  primaryFixed: '#dae2ff',
};

const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AnnouncementsListScreen({ navigation }: any) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await announcementService.getPublished(1, 50);
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load announcements', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Header title="Announcements" />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListHeaderComponent={(
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Latest Updates</Text>
            <Text style={styles.pageDescription}>Stay informed with the latest news, official notices, and important updates regarding upcoming elections and party activities.</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <MaterialIcons name="campaign" size={32} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>No published announcements.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.is_featured && styles.featuredCard]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('AnnouncementDetail', { id: item.id, announcement: item })}
          >
            {item.image_urls?.[0] ? (
              <Image source={{ uri: item.image_urls[0] }} style={styles.cardImage} />
            ) : (
              <View style={styles.imageFallback}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=800' }} 
                  style={styles.cardImage} 
                />
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardMeta}>
                <Text style={styles.dateText}>{dateLabel(item.publish_date)}</Text>
                {item.is_featured && (
                  <View style={styles.featuredBadge}>
                    <MaterialIcons name="star" size={12} color={COLORS.primary} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.short_description}</Text>
              
              <View style={styles.cardFooter}>
                <View style={styles.readMoreContainer}>
                  <Text style={styles.readMoreText}>Read More</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  listContent: { padding: 16, paddingBottom: 40, gap: 14 },
  pageHeader: { marginBottom: 20, marginTop: 10 },
  pageTitle: { fontSize: 32, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  pageDescription: { fontSize: 15, color: COLORS.onSurfaceVariant, fontWeight: '600', lineHeight: 22, marginTop: 8 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.outlineVariant },
  emptyText: { marginTop: 10, color: COLORS.onSurfaceVariant, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  featuredCard: { borderColor: COLORS.primary },
  cardImage: { width: '100%', height: 160, backgroundColor: COLORS.primaryFixed },
  imageFallback: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  cardBody: { padding: 16, marginTop: 15 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryFixed, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  featuredText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: COLORS.onSurface, fontSize: 18, fontWeight: '900', lineHeight: 23 },
  description: { color: COLORS.onSurfaceVariant, fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 6 },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.background, flexDirection: 'row', justifyContent: 'flex-end' },
  readMoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readMoreText: { color: COLORS.primary, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
});
