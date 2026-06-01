import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, ActivityIndicator, Platform, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/common/Header';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { tenantService } from '../services/tenantService';

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

const AnalyticsScreen = () => {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [committees, setCommittees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadPeople = async () => {
    try {
      const data = await tenantService.getPublicTargets();
      
      // Hierarchy order for sorting
      const typeOrder: Record<string, number> = {
        'country': 1,
        'state': 2,
        'district': 3,
        'block': 4,
        'booth': 5,
        'taluka': 6,
        'city': 7,
        'village': 8,
        'other': 9
      };

      // Filter and Sort
      const sortedLeaders = data
        .filter((item: any) => item.president !== null || item.winner !== null)
        .sort((a: any, b: any) => {
          const orderA = typeOrder[a.type] || 99;
          const orderB = typeOrder[b.type] || 99;
          
          if (orderA !== orderB) {
            return orderA - orderB;
          }
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const PersonItem = ({ title, person, isWinner = false }: any) => {
    if (!person) return null;
    const isPresident = title.toLowerCase().includes('president');

    return (
      <View style={styles.modernPersonRow}>
         <View style={styles.personAvatarCol}>
            <View style={[
              styles.modernAvatarContainer, 
              isWinner && { borderColor: '#10b981' },
              isPresident && !isWinner && { borderColor: '#4338ca' }
            ]}>
               <Image 
                 source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(person.full_name)}&background=${isWinner ? '10b981' : (isPresident ? '4338ca' : '003d9b')}&color=fff&bold=true` }} 
                 style={styles.modernPersonImg} 
               />
               <View style={[
                 styles.verifiedBadgeSmall, 
                 isWinner && { backgroundColor: '#10b981' },
                 isPresident && !isWinner && { backgroundColor: '#4338ca' }
               ]}>
                  <MaterialIcons name={isWinner ? "stars" : (isPresident ? "workspace-premium" : "verified")} size={10} color="#fff" />
               </View>
            </View>
         </View>
         <View style={styles.personInfoCol}>
            <View style={styles.roleRow}>
               <Text style={[
                 styles.personRoleLabel,
                 isWinner && { color: '#10b981' },
                 isPresident && !isWinner && { color: '#4338ca' }
               ]}>{title.toUpperCase()}</Text>
               {isWinner && <View style={styles.winnerPill}><Text style={styles.winnerPillText}>WINNER</Text></View>}
            </View>
            <Text style={styles.modernPersonName}>{person.full_name}</Text>
            <View style={styles.personMetaRow}>
               <MaterialIcons name="alternate-email" size={12} color={COLORS.onSurfaceVariant} style={{ opacity: 0.5 }} />
               <Text style={styles.personMetaText}>{person.email || 'Authorized Ledger'}</Text>
            </View>
         </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="People" />
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Premium Hero Header */}
        <LinearGradient
          colors={['#003d9b', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <View style={styles.heroContent}>
             <View style={styles.heroBadge}>
                <MaterialIcons name="people" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}>NETWORK</Text>
             </View>
             <Text style={styles.heroTitle}>Leadership Network</Text>
             <Text style={styles.heroSub}>Access cryptographically verified records of administrative representatives.</Text>
             
             {/* Modern Integrated Search */}
             <View style={styles.heroSearchWrapper}>
                <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
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
                     <MaterialIcons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
             </View>
          </View>
        </LinearGradient>

        <View style={styles.peopleList}>
           {paginatedCommittees.length === 0 ? (
              <View style={styles.emptyState}>
                 <MaterialIcons name="search-off" size={48} color={COLORS.onSurfaceVariant} />
                 <Text style={styles.emptyText}>No matching leadership records found.</Text>
              </View>
           ) : (
             paginatedCommittees.map((item: any) => (
               <View key={item.id} style={styles.targetCard}>
                  <View style={styles.targetHeader}>
                    <View style={styles.targetTitleRow}>
                       <Ionicons name="location" size={18} color={COLORS.primary} />
                       <Text style={styles.targetName}>{item.name}</Text>
                    </View>
                    <View style={styles.targetTypeBadge}>
                       <Text style={styles.targetTypeText}>{item.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.leadershipBody}>
                     <PersonItem title="Current President" person={item.president} />
                     <View style={styles.cardDivider} />
                     <PersonItem title="Winning Candidate" person={item.winner} isWinner />
                  </View>
               </View>
             ))
           )}
        </View>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationWrapper}>
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                Showing <Text style={{fontWeight: '700'}}>{(currentPage - 1) * itemsPerPage + 1}</Text> to <Text style={{fontWeight: '700'}}>{Math.min(currentPage * itemsPerPage, filteredCommittees.length)}</Text> of <Text style={{fontWeight: '700'}}>{filteredCommittees.length}</Text> records
              </Text>
            </View>

            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
              </TouchableOpacity>
              
              <View style={styles.pageNumbersRow}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <TouchableOpacity 
                      key={pageNum}
                      style={[styles.pageNumberBtn, currentPage === pageNum && styles.pageNumberBtnActive]}
                      onPress={() => setCurrentPage(pageNum)}
                    >
                      <Text style={[styles.pageNumberText, currentPage === pageNum && styles.pageNumberTextActive]}>
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity 
                style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} 
                onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footerNote}>
           <MaterialIcons name="security" size={14} color={COLORS.onSurfaceVariant} style={{ opacity: 0.5 }} />
           <Text style={styles.footerText}>Records are cryptographically locked and verified by Central Command.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 16 },

  screenHeader: { marginTop: 24, marginBottom: 24, paddingHorizontal: 4 },
  screenTitle: { fontSize: 32, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  screenSub: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 8, lineHeight: 22 },

  // Hero Header Styles
  heroHeader: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  heroContent: {
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  heroSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: { 
        outlineStyle: 'none' 
      }
    })
  },

  // Search Bar Styles (Old - keeping some for compatibility if needed, but hero is primary)
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 12, 
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { 
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' 
      }
    })
  },
  searchIcon: { marginRight: 10 },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    color: COLORS.onSurface, 
    fontWeight: '500',
    ...Platform.select({
      web: { 
        outlineStyle: 'none' 
      }
    })
  },

  peopleList: { gap: 20, marginTop: 8 },
  targetCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { 
        boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.04)' 
      }
    })
  },
  targetHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: COLORS.primaryContainer + '30',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  targetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  targetTypeBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  targetTypeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  leadershipBody: { padding: 16, gap: 16 },
  leadershipMember: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  memberAvatarContainer: { position: 'relative' },
  memberImg: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surfaceContainerLow },
  initialsAvatarSmall: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: COLORS.primary + '10', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  initialsTextSmall: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  verifiedBadgeSmall: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    backgroundColor: COLORS.primary, 
    width: 18, 
    height: 18, 
    borderRadius: 9, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  memberInfo: { flex: 1 },
  memberLabel: { fontSize: 9, fontWeight: '800', color: COLORS.onSurfaceVariant, opacity: 0.6, letterSpacing: 0.5, marginBottom: 2 },
  memberName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  memberEmail: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 1 },

  cardDivider: { height: 1, backgroundColor: COLORS.outlineVariant, opacity: 0.4 },

  modernPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  personAvatarCol: {
    width: 60,
  },
  modernAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    padding: 2,
    position: 'relative',
  },
  modernPersonImg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  winnerBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10b981',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  personInfoCol: {
    flex: 1,
    gap: 2,
  },
  personRoleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 1,
  },
  modernPersonName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  personMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  personMetaText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    opacity: 0.8,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  winnerPill: {
    backgroundColor: '#10b98115',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b98130',
  },
  winnerPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.5,
  },

  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center' },

  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingHorizontal: 20 },
  footerText: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center', opacity: 0.5, lineHeight: 16 },

  // Pagination Styles
  paginationWrapper: {
    marginTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 }
    })
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryContainer,
  },
  pageBtnDisabled: {
    opacity: 0.2,
  },
  pageNumbersRow: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 6,
  },
  pageNumberBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pageNumberBtnActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 }
    })
  },
  pageNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  pageNumberTextActive: {
    color: '#fff',
  },
});
export default AnalyticsScreen;
