import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform, RefreshControl } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../components/common/Header';
import { Announcement, announcementService, stripHtml } from '../services/announcementService';
import { hs, vs, ms } from '../utils/responsive';

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
  const [refreshing, setRefreshing] = useState(false);
  const id = route.params?.id;

  const loadDetails = async (isRefreshing = false) => {
    if (!id) return;
    if (isRefreshing) setRefreshing(true);
    else if (!announcement) setLoading(true);

    try {
      const data = await announcementService.getDetails(id);
      setAnnouncement(data);
    } catch (error) {
      console.error('Failed to load announcement detail', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    // Only load if we don't have it or ID changed
    if (!announcement || announcement.id !== id) {
      loadDetails();
    }
  }, [id]);

  const onRefresh = () => {
    loadDetails(true);
  };

  if (loading && !refreshing && !announcement) {
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
        showBack 
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
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
              <MaterialIcons name="star" size={ms(14)} color="#fff" />
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
                  <MaterialIcons name="photo-library" size={ms(18)} color={COLORS.primary} />
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
                  <MaterialIcons name="description" size={ms(18)} color={COLORS.primary} />
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
                      <MaterialIcons name="insert-drive-file" size={ms(24)} color={COLORS.primary} />
                    </View>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {url.split('/').pop() || 'Resource Document'}
                      </Text>
                      <Text style={styles.attachmentMeta}>Official attachment • PDF/DOC</Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={ms(14)} color={COLORS.outlineVariant} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Verification Footer */}
          <View style={styles.footerVerification}>
            <View style={styles.divider} />
            <View style={styles.verificationContent}>
               <MaterialIcons name="verified-user" size={ms(16)} color={COLORS.secondary} opacity={0.6} />
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
  scrollContent: { paddingBottom: vs(60) },
  
  heroContainer: { width: '100%', height: vs(320), position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  featuredBadge: {
    position: 'absolute',
    top: vs(100),
    left: hs(20),
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hs(12),
    paddingVertical: vs(6),
    borderRadius: ms(12),
    gap: hs(6),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
    })
  },
  featuredBadgeText: { color: '#fff', fontSize: ms(10), fontWeight: '900', letterSpacing: 1 },

  bodyWrapper: {
    marginTop: vs(-30),
    backgroundColor: COLORS.background,
    borderTopLeftRadius: ms(32),
    borderTopRightRadius: ms(32),
    paddingTop: vs(30),
    paddingHorizontal: hs(20),
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(16),
    gap: hs(10),
  },
  categoryTag: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: ms(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dot: { width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: COLORS.outlineVariant },
  dateText: {
    fontSize: ms(12),
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    opacity: 0.6,
  },

  title: {
    fontSize: ms(28),
    fontWeight: '900',
    color: COLORS.onSurface,
    lineHeight: vs(36),
    letterSpacing: -0.5,
    marginBottom: vs(20),
  },
  
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: hs(16),
    borderRadius: ms(8),
    marginBottom: vs(24),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    opacity: 0.9,
  },
  quoteBar: {
    width: hs(4),
    backgroundColor: COLORS.primary,
    borderRadius: ms(2),
    marginRight: hs(12),
  },
  summaryText: {
    flex: 1,
    fontSize: ms(15),
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    lineHeight: vs(22),
    fontStyle: 'italic',
  },

  mainContent: {
    marginBottom: vs(32),
  },
  contentText: {
    fontSize: ms(16),
    color: COLORS.onSurface,
    lineHeight: vs(26),
    fontWeight: '500',
    opacity: 0.85,
  },

  section: {
    marginBottom: vs(32),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
    marginBottom: vs(16),
  },
  sectionIconBg: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(12),
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  sectionTitle: {
    fontSize: ms(18),
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.2,
  },

  gallery: { gap: hs(14), paddingRight: hs(20) },
  galleryItem: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    })
  },
  galleryImage: { width: hs(220), height: vs(140), borderRadius: ms(10), backgroundColor: '#ddd' },

  attachmentList: { gap: vs(12) },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ms(9),
    padding: hs(12),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    gap: hs(14),
  },
  attachmentIconBox: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(7),
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfo: { flex: 1 },
  attachmentName: {
    fontSize: ms(14),
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: vs(2),
  },
  attachmentMeta: {
    fontSize: ms(11),
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    fontWeight: '600',
  },

  footerVerification: {
    marginTop: vs(10),
    alignItems: 'center',
  },
  divider: {
    width: '40%',
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginBottom: vs(20),
    opacity: 0.3,
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(8),
    paddingHorizontal: hs(20),
  },
  verificationText: {
    fontSize: ms(10),
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.4,
    lineHeight: vs(16),
  },
});
