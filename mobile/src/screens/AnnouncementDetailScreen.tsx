import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';
import { Announcement, announcementService, stripHtml } from '../services/announcementService';

const COLORS = {
  primary: '#003d9b',
  background: '#f8f9fb',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  primaryFixed: '#dae2ff',
};

const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default function AnnouncementDetailScreen({ route }: any) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(route.params?.announcement || null);
  const [loading, setLoading] = useState(!route.params?.announcement);
  const id = route.params?.id;

  useEffect(() => {
    if (!id || announcement?.id === id) return;
    announcementService.getDetails(id)
      .then(setAnnouncement)
      .catch((error) => console.error('Failed to load announcement detail', error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !announcement) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Header title="Announcement" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {announcement.image_urls?.[0] ? (
          <Image source={{ uri: announcement.image_urls[0] }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroFallback}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=800' }} 
              style={styles.heroImage} 
            />
          </View>
        )}

        <View style={styles.articleCard}>
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>{dateLabel(announcement.publish_date)}</Text>
            {announcement.is_featured && <Text style={styles.featuredText}>FEATURED</Text>}
          </View>
          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.summary}>{announcement.short_description}</Text>
          <Text style={styles.contentText}>{stripHtml(announcement.content)}</Text>
        </View>

        {announcement.image_urls?.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {announcement.image_urls.slice(1).map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {announcement.attachment_urls?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {announcement.attachment_urls.map((url) => (
              <TouchableOpacity key={url} style={styles.attachmentRow} onPress={() => Linking.openURL(url)}>
                <MaterialIcons name="attach-file" size={20} color={COLORS.primary} />
                <Text style={styles.attachmentText} numberOfLines={1}>{url.split('/').pop()}</Text>
                <MaterialIcons name="open-in-new" size={16} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 250, backgroundColor: COLORS.primaryFixed },
  heroFallback: { height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed },
  articleCard: { backgroundColor: COLORS.surface, margin: 16, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: COLORS.outlineVariant },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '800', textTransform: 'uppercase' },
  featuredText: { color: COLORS.primary, backgroundColor: COLORS.primaryFixed, overflow: 'hidden', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  title: { fontSize: 26, lineHeight: 32, color: COLORS.onSurface, fontWeight: '900', letterSpacing: -0.5 },
  summary: { marginTop: 10, color: COLORS.onSurfaceVariant, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  contentText: { marginTop: 18, color: COLORS.onSurface, fontSize: 15, fontWeight: '500', lineHeight: 24 },
  section: { marginHorizontal: 16, marginTop: 4, marginBottom: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: COLORS.onSurface, marginBottom: 12 },
  gallery: { gap: 12 },
  galleryImage: { width: 180, height: 120, borderRadius: 16, backgroundColor: COLORS.primaryFixed },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.outlineVariant },
  attachmentText: { flex: 1, color: COLORS.onSurface, fontWeight: '700' },
});
