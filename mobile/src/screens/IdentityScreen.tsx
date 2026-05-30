import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  background: '#f8f9fb',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  secondaryContainer: '#8dfc75',
  onPrimaryContainer: '#c4d2ff',
  surfaceContainer: '#edeef0',
  surfaceContainerHigh: '#e7e8ea',
};

const IdentityScreen = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Member Identity" />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.meshBg} />
        
        {/* Perspective Container */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.idCard}
          >
            {/* Shimmer Effect Placeholder */}
            <View style={styles.shimmer} />
            
            <View style={styles.cardInner}>
              {/* Top Row */}
              <View style={styles.cardHeader}>
                <View style={styles.brandRow}>
                  <View style={styles.logoContainer}>
                    <MaterialIcons name="account-balance" size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.brandTitle}>FEDERAL ELECTORATE</Text>
                    <Text style={styles.brandSubtitle}>INSTITUTIONAL MEMBER</Text>
                  </View>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelLabel}>LEVEL 04</Text>
                  <Text style={styles.serialNo}>SVRGN-2026-X</Text>
                </View>
              </View>

              {/* Middle Row */}
              <View style={styles.userInfoRow}>
                <View style={styles.portraitWrapper}>
                  <View style={styles.portraitGlow} />
                  <Image 
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvo78HjymyAuJ2TJvBEscxlYmtrV0EEvucnuGDxauyKXq91FS3dmWZKIQ0X9KhnBq2CBC_oeHLeuVNsOo3ycr62NzqzYpcehGQXoIWoSUK_OQCdcHZwucoSL8Ynww6GA4EJ4X8vvRQsoxPOJ9dTaUkhXej99SKMilotbjMVP3MjPKd2gX9mBoEmNEguJVlvR4jxuIDWvSKy9RsnciSeAc2vqYmxXGXx__E7mrARq2tDZFjDWrJfjuvLj4richXd4gpRKaHUv1Psak' }} 
                    style={styles.portrait} 
                  />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user?.full_name || "Alexander J. Vance"}</Text>
                  <Text style={styles.userRole}>{user?.role === 'superadmin' ? 'Supervisory Commissioner' : 'Registry Member'}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                    <Text style={styles.expDate}>EXP: 12/2026</Text>
                  </View>
                </View>
              </View>

              {/* Bottom Row */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.idLabel}>UNIQUE MEMBER ID</Text>
                  <Text style={styles.idNumber}>ID: {user?.voter_id || `8829-1029-${(user?.id || 7731).toString().padStart(4, '0')}-X`}</Text>
                </View>
                <View style={styles.qrContainer}>
                  <View style={styles.qrGrid}>
                    {[...Array(16)].map((_, i) => (
                      <View key={i} style={[styles.qrPixel, { backgroundColor: Math.random() > 0.5 ? '#191c1e' : '#fff' }]} />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9}>
            <MaterialIcons name="file-download" size={24} color="#fff" />
            <Text style={styles.primaryBtnText}>Download Official PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.blackBtn} activeOpacity={0.9}>
            <FontAwesome5 name="wallet" size={20} color="#fff" />
            <Text style={styles.blackBtnText}>Add to Apple Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn}>
            <MaterialIcons name="verified" size={20} color={COLORS.primary} />
            <Text style={styles.outlineBtnText}>View Membership Benefits</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerMessage}>
          This digital ID is a valid form of internal accreditation for all 2026 Federal Election jurisdictions.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center', paddingBottom: 100 },
  meshBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    // Note: React Native doesn't support radial gradients natively without extra libs, 
    // so we use simple background or subtle overlays if needed.
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1.586,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: { elevation: 15 }
    })
  },
  idCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardInner: { flex: 1, padding: 20, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoContainer: { backgroundColor: '#fff', padding: 6, borderRadius: 8 },
  brandTitle: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: -0.5 },
  brandSubtitle: { color: COLORS.onPrimaryContainer, fontSize: 8, fontWeight: '700', letterSpacing: 1, opacity: 0.8 },
  levelInfo: { alignItems: 'flex-end' },
  levelLabel: { color: COLORS.onPrimaryContainer, fontSize: 8, fontWeight: '700', opacity: 0.6 },
  serialNo: { color: '#fff', fontSize: 10, fontWeight: '500' },
  
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  portraitWrapper: { position: 'relative' },
  portraitGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(141, 252, 117, 0.1)',
    borderRadius: 50,
  },
  portrait: { width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  userDetails: { flex: 1 },
  userName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userRole: { color: COLORS.onPrimaryContainer, fontSize: 12, marginTop: 2, opacity: 0.9 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  activeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  expDate: { color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  idLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  idNumber: { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  qrContainer: { backgroundColor: '#fff', padding: 4, borderRadius: 8 },
  qrGrid: { width: 56, height: 56, flexDirection: 'row', flexWrap: 'wrap' },
  qrPixel: { width: 14, height: 14 },

  actionContainer: { width: '100%', marginTop: 48, gap: 12 },
  primaryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.primary, 
    paddingVertical: 14, 
    borderRadius: 12, 
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  blackBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#000', 
    paddingVertical: 14, 
    borderRadius: 12, 
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  blackBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  outlineBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.surfaceContainer, 
    paddingVertical: 14, 
    borderRadius: 12, 
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  outlineBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },

  footerMessage: { marginTop: 32, textAlign: 'center', color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 18, opacity: 0.7, paddingHorizontal: 40 },
});

export default IdentityScreen;
