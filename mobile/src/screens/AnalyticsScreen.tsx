import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, ActivityIndicator, Platform, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/common/Header';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { tenantService } from '../services/tenantService';

const { width } = Dimensions.get('window');

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [committees, setCommittees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const PersonItem = ({ title, person, isWinner = false }: any) => {
    if (!person) return null;
    return (
      <View style={styles.leadershipMember}>
         <View style={styles.memberAvatarContainer}>
            {person.image ? (
              <Image source={{ uri: person.image }} style={styles.memberImg} />
            ) : (
              <View style={[styles.initialsAvatarSmall, isWinner && { backgroundColor: COLORS.secondary + '15' }]}>
                 <Text style={[styles.initialsTextSmall, isWinner && { color: COLORS.secondary }]}>
                    {person.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                 </Text>
              </View>
            )}
            <View style={[styles.verifiedBadgeSmall, isWinner && { backgroundColor: COLORS.secondary }]}>
               <MaterialIcons name={isWinner ? "emoji-events" : "verified"} size={10} color="#fff" />
            </View>
         </View>
         <View style={styles.memberInfo}>
            <Text style={styles.memberLabel}>{title}</Text>
            <Text style={styles.memberName}>{person.full_name}</Text>
            <Text style={styles.memberEmail}>{person.email}</Text>
         </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="People" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
           <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} style={styles.searchIcon} />
           <TextInput
              style={styles.searchInput}
              placeholder="Search by committee or name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.onSurfaceVariant + '80'}
           />
           {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color={COLORS.onSurfaceVariant} />
             </TouchableOpacity>
           )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.screenHeader}>
           <Text style={styles.screenTitle}>Registry Directory</Text>
           <Text style={styles.screenSub}>Access authorized leadership data across active administrative regions.</Text>
        </View>

        <View style={styles.peopleList}>
           {filteredCommittees.length === 0 ? (
              <View style={styles.emptyState}>
                 <MaterialIcons name="search-off" size={48} color={COLORS.onSurfaceVariant} />
                 <Text style={styles.emptyText}>No matching leadership records found.</Text>
              </View>
           ) : (
             filteredCommittees.map((item: any) => (
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

  // Search Bar Styles
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
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' }
    })
  },
  searchIcon: { marginRight: 10 },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    color: COLORS.onSurface, 
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' }
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
      web: { boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.04)' }
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

  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center' },

  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingHorizontal: 20 },
  footerText: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', textAlign: 'center', opacity: 0.5, lineHeight: 16 },
});
export default AnalyticsScreen;
