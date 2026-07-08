import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, ActivityIndicator, Platform, TouchableOpacity, Image, Alert, TextInput, Modal } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../components/common/Header';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { tenantService } from '../services/tenantService';
import { mediaService } from '../services/mediaService';
import { hs, vs, ms, hp } from '../utils/responsive';

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#eff6ff',
  background: '#f8fafc',
  surface: '#ffffff',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  outlineVariant: '#e2e8f0',
  secondary: '#056e00',
  accent: '#ff8c00',
  error: '#ef4444',
};

const AnalyticsScreen = ({ navigation }: any) => {
  const { width, height } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [committees, setCommittees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadPeople = async () => {
    try {
      const data = await tenantService.getPublicTargets();
      
      const typeOrder: Record<string, number> = {
        'country': 1, 'state': 2, 'district': 3, 'block': 4, 'booth': 5, 'taluka': 6, 'city': 7, 'village': 8, 'other': 9
      };

      const sortedLeaders = data
        .filter((item: any) => item.president !== null || item.winner !== null)
        .sort((a: any, b: any) => {
          const orderA = typeOrder[a.type] || 99;
          const orderB = typeOrder[b.type] || 99;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });

      setCommittees(sortedLeaders);
    } catch (error) {
      console.error('Failed to load people data', error);
      Alert.alert("Error", "Could not load committee leadership data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPeople();
  };

  const filteredCommittees = committees.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.president?.full_name.toLowerCase().includes(query) ||
      item.winner?.full_name.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredCommittees.length / itemsPerPage);
  const paginatedCommittees = filteredCommittees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const PersonItem = ({ title, person, target, isWinner = false }: any) => {
    if (!person) return null;
    const isPresident = title.toLowerCase().includes('president');

    return (
      <TouchableOpacity 
        style={styles.modernPersonRow} 
        onPress={() => {
          const mappedCandidate = {
            id: person.id,
            full_name: person.full_name,
            position_name: title,
            committee: { name: target.name },
            target: { name: target.name },
            image_url: person.image,
            email: person.email,
            phone: person.phone,
            gender: person.gender,
            date_of_birth: person.date_of_birth,
            is_representative: true,
          };
          navigation.navigate('CandidateDetail', { candidate: mappedCandidate });
        }}
        activeOpacity={0.7}
      >
         <View style={styles.personAvatarCol}>
            <View style={[
              styles.modernAvatarContainer, 
              isWinner && { borderColor: '#10b981' },
              isPresident && !isWinner && { borderColor: '#4338ca' }
            ]}>
               {person.image ? (
                 <Image 
                   source={{ uri: mediaService.getFileUrl(person.image) }} 
                   style={styles.modernPersonImg} 
                 />
               ) : (
                 <View style={[styles.modernPersonImg, { backgroundColor: isWinner ? '#10b981' : (isPresident ? '#4338ca' : '#003d9b'), justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialIcons name="person" size={ms(32)} color="#fff" />
                 </View>
               )}
               <View style={[
                 styles.verifiedBadgeSmall, 
                 isWinner && { backgroundColor: '#10b981' },
                 isPresident && !isWinner && { backgroundColor: '#4338ca' }
               ]}>
                  <MaterialIcons name={isWinner ? "stars" : (isPresident ? "workspace-premium" : "verified")} size={ms(10)} color="#fff" />
               </View>
            </View>
         </View>
         <View style={styles.personInfoCol}>
            <View style={styles.roleRow}>
               {isPresident && !isWinner && (
                 <MaterialIcons name="workspace-premium" size={ms(14)} color="#4338ca" style={{ marginRight: hs(4) }} />
               )}
               {isWinner && (
                 <MaterialIcons name="stars" size={ms(14)} color="#10b981" style={{ marginRight: hs(4) }} />
               )}
               <Text style={[
                 styles.personRoleLabel,
                 isWinner && { color: '#10b981' },
                 isPresident && !isWinner && { color: '#4338ca' }
               ]}>{title.toUpperCase()}</Text>
               {isWinner && <View style={styles.winnerPill}><Text style={styles.winnerPillText}>WINNER</Text></View>}
            </View>
            <Text style={styles.modernPersonName}>{person.full_name}</Text>
            <View style={styles.personMetaRow}>
               <MaterialIcons name="alternate-email" size={ms(12)} color={COLORS.onSurfaceVariant} style={{ opacity: 0.5 }} />
               <Text style={styles.personMetaText}>{person.email || 'Authorized Ledger'}</Text>
            </View>
         </View>
         <MaterialIcons name="chevron-right" size={ms(20)} color={COLORS.outlineVariant} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="People" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: vs(60) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <LinearGradient colors={['#003d9b', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroHeader}>
          <View style={styles.heroContent}>
             <Text style={styles.heroTitle}>Leadership Network</Text>
             <Text style={styles.heroSub}>Access cryptographically verified records of administrative representatives.</Text>
             <View style={styles.heroSearchWrapper}>
                <MaterialIcons name="search" size={ms(20)} color="rgba(255,255,255,0.7)" style={{ marginRight: hs(8) }} />
                <TextInput
                  style={styles.heroSearchInput}
                  placeholder="Search by name or region..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  underlineColorAndroid="transparent"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                     <MaterialIcons name="close" size={ms(18)} color="#fff" />
                  </TouchableOpacity>
                )}
             </View>
          </View>
        </LinearGradient>
        <View style={styles.peopleList}>
           {paginatedCommittees.length === 0 ? (
              <View style={styles.emptyState}>
                 <MaterialIcons name="search-off" size={ms(48)} color={COLORS.onSurfaceVariant} />
                 <Text style={styles.emptyText}>No matching leadership records found.</Text>
              </View>
           ) : (
             paginatedCommittees.map((item: any) => (
               <View key={item.id} style={styles.targetCard}>
                  <View style={styles.targetHeader}>
                    <View style={styles.targetTitleRow}>
                       <Ionicons name="location" size={ms(18)} color={COLORS.primary} />
                       <Text style={styles.targetName}>{item.name}</Text>
                    </View>
                    <View style={styles.targetTypeBadge}>
                       <Text style={styles.targetTypeText}>{item.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.leadershipBody}>
                     <PersonItem title="Current President" person={item.president} target={item} />
                     <View style={styles.cardDivider} />
                     <PersonItem title="Winning Candidate" person={item.winner} target={item} isWinner />
                  </View>
               </View>
             ))
           )}
        </View>
        {totalPages > 1 && (
          <View style={styles.paginationWrapper}>
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                Showing <Text style={{fontWeight: '700'}}>{(currentPage - 1) * itemsPerPage + 1}</Text> to <Text style={{fontWeight: '700'}}>{Math.min(currentPage * itemsPerPage, filteredCommittees.length)}</Text> of <Text style={{fontWeight: '700'}}>{filteredCommittees.length}</Text> records
              </Text>
            </View>
            <View style={styles.paginationContainer}>
              <TouchableOpacity style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <MaterialIcons name="chevron-left" size={ms(24)} color={currentPage === 1 ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
              </TouchableOpacity>
              <View style={styles.pageNumbersRow}>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) pageNum = i + 1;
                  else if (currentPage <= 2) pageNum = i + 1;
                  else if (currentPage >= totalPages - 1) pageNum = totalPages - 2 + i;
                  else pageNum = currentPage - 1 + i;
                  return (
                    <TouchableOpacity key={pageNum} style={[styles.pageNumberBtn, currentPage === pageNum && styles.pageNumberBtnActive]} onPress={() => setCurrentPage(pageNum)}>
                      <Text style={[styles.pageNumberText, currentPage === pageNum && styles.pageNumberTextActive]}>{pageNum}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                <MaterialIcons name="chevron-right" size={ms(24)} color={currentPage === totalPages ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.footerNote}>
           <MaterialIcons name="security" size={ms(14)} color={COLORS.onSurfaceVariant} style={{ opacity: 0.5 }} />
           <Text style={styles.footerText}>Records are cryptographically locked and verified by Central Command.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  // content: { flex: 1, paddingHorizontal: hs(16) },
  heroHeader: {
    paddingTop: vs(20),
    minHeight: vs(240),
    paddingHorizontal: hs(20),
    // borderBottomLeftRadius: ms(32),
    // borderBottomRightRadius: ms(32),
    marginBottom: vs(20),
    
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  heroContent: { gap: vs(8) },
  heroTitle: { fontSize: ms(28), fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroSub: { fontSize: ms(13), color: 'rgba(255,255,255,0.8)', lineHeight: vs(18), fontWeight: '500', marginBottom: vs(10) },
  heroSearchWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: ms(8), height: vs(50), paddingHorizontal: hs(16), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroSearchInput: { flex: 1, color: '#fff', fontSize: ms(15), fontWeight: '600', paddingVertical: 0, backgroundColor: 'transparent', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  peopleList: { gap: vs(16), marginTop: vs(8) },
  targetCard: { 
    backgroundColor: '#fff', borderRadius: ms(12), overflow: 'hidden', borderWidth: 1, borderColor: COLORS.outlineVariant,
    marginHorizontal: hs(16),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.04)' }
    })
  },
  targetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ms(14), backgroundColor: COLORS.primaryContainer + '30', borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant },
  targetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: hs(8), flex: 1 },
  targetName: { fontSize: ms(15), fontWeight: '800', color: COLORS.primary },
  targetTypeBadge: { backgroundColor: COLORS.primary, paddingHorizontal: hs(8), paddingVertical: vs(2), borderRadius: ms(6) },
  targetTypeText: { fontSize: ms(8), fontWeight: '800', color: '#fff' },
  leadershipBody: { padding: ms(14), gap: vs(14) },
  cardDivider: { height: 1, backgroundColor: COLORS.outlineVariant, opacity: 0.4 },
  modernPersonRow: { flexDirection: 'row', alignItems: 'center', gap: hs(12) },
  personAvatarCol: { width: hs(54) },
  modernAvatarContainer: { width: ms(52), height: ms(52), borderRadius: ms(14), borderWidth: 2, borderColor: COLORS.primary + '20', padding: 2, position: 'relative' },
  modernPersonImg: { width: '100%', height: '100%', borderRadius: ms(12), backgroundColor: '#f1f5f9' },
  verifiedBadgeSmall: { position: 'absolute', bottom: vs(-2), right: hs(-2), backgroundColor: COLORS.primary, width: ms(16), height: ms(16), borderRadius: ms(8), justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  personInfoCol: { flex: 1, gap: vs(2) },
  personRoleLabel: { fontSize: ms(8), fontWeight: '800', color: COLORS.onSurfaceVariant, opacity: 0.6, letterSpacing: 1 },
  modernPersonName: { fontSize: ms(15), fontWeight: '700', color: COLORS.onSurface },
  personMetaRow: { flexDirection: 'row', alignItems: 'center', gap: hs(4), marginTop: vs(2) },
  personMetaText: { fontSize: ms(11), color: COLORS.onSurfaceVariant, opacity: 0.8 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(2) },
  winnerPill: { backgroundColor: '#10b98115', paddingHorizontal: hs(6), paddingVertical: vs(1), borderRadius: ms(4), borderWidth: 1, borderColor: '#10b98130' },
  winnerPillText: { fontSize: ms(8), fontWeight: '900', color: '#10b981', letterSpacing: 0.5 },
  emptyState: { padding: ms(60), alignItems: 'center', justifyContent: 'center', gap: vs(12) },
  emptyText: { fontSize: ms(16), color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center' },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: hs(8), marginTop: vs(32), paddingHorizontal: hs(20) },
  footerText: { fontSize: ms(11), color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center', opacity: 0.5, lineHeight: vs(16) },
  paginationWrapper: { marginTop: vs(32), paddingBottom: vs(40), alignItems: 'center' },
  resultsInfo: { marginBottom: vs(16) },
  resultsText: { fontSize: ms(13), color: COLORS.onSurfaceVariant, opacity: 0.7, letterSpacing: 0.2 },
  paginationContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: ms(6), borderRadius: ms(10), borderWidth: 1, borderColor: COLORS.outlineVariant, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 4 } }) },
  pageBtn: { width: ms(44), height: ms(44), borderRadius: ms(8), justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primaryContainer },
  pageBtnDisabled: { opacity: 0.2 },
  pageNumbersRow: { flexDirection: 'row', marginHorizontal: hs(8), gap: hs(6) },
  pageNumberBtn: { minWidth: ms(44), height: ms(44), borderRadius: ms(8), justifyContent: 'center', alignItems: 'center', paddingHorizontal: hs(12) },
  pageNumberBtnActive: { backgroundColor: COLORS.primary, ...Platform.select({ ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 4 } }) },
  pageNumberText: { fontSize: ms(15), fontWeight: '700', color: COLORS.onSurfaceVariant },
  pageNumberTextActive: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: ms(16), borderTopRightRadius: ms(16), overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ms(20), backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant },
  modalTitle: { fontSize: ms(18), fontWeight: '800', color: COLORS.onSurface },
  closeBtn: { width: ms(40), height: ms(40), borderRadius: ms(8), backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { paddingBottom: vs(40) },
  profileHero: { paddingBottom: 0 },
  heroGradient: { padding: ms(30), alignItems: 'center', gap: vs(16) },
  heroAvatarContainer: { position: 'relative', padding: ms(4), borderRadius: ms(15), backgroundColor: 'rgba(255,255,255,0.2)' },
  heroAvatar: { width: ms(100), height: ms(100), borderRadius: ms(12), borderWidth: 4, borderColor: '#fff' },
  heroBadge: { position: 'absolute', bottom: 0, right: 0, width: ms(32), height: ms(32), borderRadius: ms(8), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  heroName: { fontSize: ms(24), fontWeight: '900', color: '#fff', textAlign: 'center' },
  heroTagPill: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: hs(12), paddingVertical: vs(4), borderRadius: ms(8) },
  heroTagText: { color: '#fff', fontSize: ms(10), fontWeight: '800', letterSpacing: 1 },
  profileBody: { padding: ms(20), gap: vs(20) },
  infoCard: { backgroundColor: '#fff', borderRadius: ms(12), padding: ms(20), borderWidth: 1, borderColor: COLORS.outlineVariant },
  infoCardTitle: { fontSize: ms(12), fontWeight: '800', color: COLORS.onSurfaceVariant, marginBottom: vs(20), letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: hs(16), marginBottom: vs(16) },
  infoIconBox: { width: ms(40), height: ms(40), borderRadius: ms(12), backgroundColor: COLORS.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: ms(11), fontWeight: '700', color: COLORS.onSurfaceVariant, marginBottom: vs(2) },
  infoValue: { fontSize: ms(15), fontWeight: '700', color: COLORS.onSurface },
  gridRow: { flexDirection: 'row', gap: hs(20) },
  gridItem: { flex: 1 },
  securitySeal: { flexDirection: 'row', alignItems: 'center', gap: hs(12), padding: ms(16), backgroundColor: '#10b98110', borderRadius: ms(8), marginTop: vs(10) },
  securitySealText: { flex: 1, fontSize: ms(11), color: '#065f46', fontWeight: '600', lineHeight: vs(16) },
});

export default AnalyticsScreen;
