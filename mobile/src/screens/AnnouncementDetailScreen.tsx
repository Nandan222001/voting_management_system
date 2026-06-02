import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/common/Header';
import { Announcement, announcementService, stripHtml } from '../services/announcementService';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#eff6ff',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  primaryFixed: '#dae2ff',
  accent: '#ff8c00',
  secondary: '#056e00',
};

const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default function AnnouncementDetailScreen({ route, navigation }: any) {
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
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Details" 
        transparent 
        showBack 
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Premium Image Hero */}
        <View style={styles.heroContainer}>
          {announcement.image_urls?.[0] ? (
            <Image source={{ uri: announcement.image_urls[0] }} style={styles.heroImage} />
          ) : (
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=800' }} 
              style={styles.heroImage} 
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', COLORS.background]}
            style={styles.heroOverlay}
          />
          
          {announcement.is_featured && (
            <View style={styles.featuredBadge}>
              <MaterialIcons name="star" size={14} color="#fff" />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
        </View>

        {/* Content Body */}
        <View style={styles.bodyWrapper}>
          <View style={styles.metaHeader}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>ANNOUNCEMENT</Text>
            </View>
            <View style={styles.dot} />
            <Text style={styles.dateText}>{dateLabel(announcement.publish_date)}</Text>
          </View>

          <Text style={styles.title}>{announcement.title}</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.quoteBar} />
            <Text style={styles.summaryText}>{announcement.short_description}</Text>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.contentText}>{stripHtml(announcement.content)}</Text>
          </View>

          {/* Gallery Section */}
          {announcement.image_urls?.length > 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <MaterialIcons name="photo-library" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>Visual Gallery</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                {announcement.image_urls.slice(1).map((url, idx) => (
                  <TouchableOpacity key={idx} activeOpacity={0.9} style={styles.galleryItem}>
                    <Image source={{ uri: url }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Attachments Section */}
          {announcement.attachment_urls?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconBg}>
                  <MaterialIcons name="description" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>Resources & Files</Text>
              </View>
              <View style={styles.attachmentList}>
                {announcement.attachment_urls.map((url, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.attachmentCard} 
                    onPress={() => Linking.openURL(url)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.attachmentIconBox}>
                      <MaterialIcons name="insert-drive-file" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {url.split('/').pop() || 'Resource Document'}
                      </Text>
                      <Text style={styles.attachmentMeta}>Official attachment • PDF/DOC</Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.outlineVariant} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Verification Footer */}
          <View style={styles.footerVerification}>
            <View style={styles.divider} />
            <View style={styles.verificationContent}>
               <MaterialIcons name="verified-user" size={16} color={COLORS.secondary} opacity={0.6} />
               <Text style={styles.verificationText}>Official communication verified by precinct administration.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 60 },
  
  // Hero Section
  heroContainer: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  featuredBadge: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
    })
  },
  featuredBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Body Layout
  bodyWrapper: {
    marginTop: -30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  categoryTag: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.outlineVariant },
  dateText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    opacity: 0.6,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.onSurface,
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    opacity: 0.9,
  },
  quoteBar: {
    width: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    lineHeight: 22,
    fontStyle: 'italic',
  },

  mainContent: {
    marginBottom: 32,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.onSurface,
    lineHeight: 26,
    fontWeight: '500',
    opacity: 0.85,
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.2,
  },

  gallery: { gap: 14, paddingRight: 20 },
  galleryItem: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    })
  },
  galleryImage: { width: 220, height: 140, borderRadius: 20, backgroundColor: '#ddd' },

  attachmentList: { gap: 12 },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    gap: 14,
  },
  attachmentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfo: { flex: 1 },
  attachmentName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  attachmentMeta: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    fontWeight: '600',
  },

  footerVerification: {
    marginTop: 10,
    alignItems: 'center',
  },
  divider: {
    width: '40%',
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginBottom: 20,
    opacity: 0.3,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  verificationText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.4,
    lineHeight: 16,
  },
});
