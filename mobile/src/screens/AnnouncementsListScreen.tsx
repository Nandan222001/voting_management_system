import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/common/Header';
import { Announcement, announcementService } from '../services/announcementService';
import { mediaService } from '../services/mediaService';
import { hs, vs, ms } from '../utils/responsive';

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

  if (loading && !refreshing) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Announcements" 
        showBack 
        onBack={() => navigation.goBack()} 
      />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} COLORS={[COLORS.primary]} />}
        ListHeaderComponent={(
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Latest Updates</Text>
            <Text style={styles.pageDescription}>Stay informed with the latest news, official notices, and important updates regarding upcoming elections and party activities.</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <MaterialIcons name="campaign" size={ms(32)} color={COLORS.outlineVariant} />
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
              <Image source={{ uri: mediaService.getFileUrl(item.image_urls[0]) }} style={styles.cardImage} />
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
                    <MaterialIcons name="star" size={ms(12)} color={COLORS.primary} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.short_description}</Text>
              
              <View style={styles.cardFooter}>
                <View style={styles.readMoreContainer}>
                  <Text style={styles.readMoreText}>Read More</Text>
                  <MaterialIcons name="arrow-forward" size={ms(16)} color={COLORS.primary} />
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
  listContent: { padding: hs(16), paddingBottom: vs(40), gap: vs(14) },
  pageHeader: { marginBottom: vs(20), marginTop: vs(10) },
  pageTitle: { fontSize: ms(32), fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  pageDescription: { fontSize: ms(15), color: COLORS.onSurfaceVariant, fontWeight: '600', lineHeight: vs(22), marginTop: vs(8) },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: hs(40), backgroundColor: COLORS.surface, borderRadius: ms(20), borderWidth: 1, borderColor: COLORS.outlineVariant },
  emptyText: { marginTop: vs(10), color: COLORS.onSurfaceVariant, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: ms(22),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  featuredCard: { borderColor: COLORS.primary },
  cardImage: { width: '100%', height: vs(160), backgroundColor: COLORS.primaryFixed },
  imageFallback: { height: vs(120), alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  cardBody: { padding: hs(16), marginTop: vs(15) },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(8) },
  dateText: { color: COLORS.onSurfaceVariant, fontSize: ms(11), fontWeight: '800', textTransform: 'uppercase' },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: hs(4), backgroundColor: COLORS.primaryFixed, paddingHorizontal: hs(8), paddingVertical: vs(4), borderRadius: ms(8) },
  featuredText: { color: COLORS.primary, fontSize: ms(9), fontWeight: '900', textTransform: 'uppercase' },
  title: { color: COLORS.onSurface, fontSize: ms(18), fontWeight: '900', lineHeight: vs(23) },
  description: { color: COLORS.onSurfaceVariant, fontSize: ms(13), fontWeight: '600', lineHeight: vs(19), marginTop: vs(6) },
  cardFooter: { marginTop: vs(16), paddingTop: vs(12), borderTopWidth: 1, borderTopColor: COLORS.background, flexDirection: 'row', justifyContent: 'flex-end' },
  readMoreContainer: { flexDirection: 'row', alignItems: 'center', gap: hs(6) },
  readMoreText: { color: COLORS.primary, fontSize: ms(13), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
});
