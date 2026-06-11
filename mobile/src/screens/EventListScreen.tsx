import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { eventService, EventResponse } from '../services/eventService';
import Header from '../components/common/Header';
import { hs, vs, ms } from '../utils/responsive';

const COLORS = {
  primary: '#003d9b',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  outline: '#e2e8f0',
  accent: '#ff8c00',
};

const EventListScreen = ({ navigation, route }: any) => {
  const { mode } = route.params; // 'my' or 'hierarchy'
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      const data = mode === 'my' 
        ? await eventService.getMyEvents() 
        : await eventService.getHierarchyEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [mode]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const renderEventItem = ({ item }: { item: EventResponse }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
    >
      <View style={styles.eventIcon}>
        <MaterialIcons
          name={item.event_type === 'Meeting' ? 'groups' : 'campaign'}
          size={ms(24)}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.event_type} at {item.place}</Text>
        <Text style={styles.eventMeta}>
          <MaterialIcons name="event" size={ms(14)} /> {item.event_date}  |  
          <MaterialIcons name="access-time" size={ms(14)} /> {item.event_time}
        </Text>
        <Text style={styles.eventComm}>
          {item.communication_type} • {item.description?.substring(0, 50) || 'No description'}...
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={ms(24)} color={COLORS.outline} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={mode === 'my' ? 'My Events' : 'Hierarchy Events'}
        showBack
        onBack={() => navigation.goBack()}
      />
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="event-busy" size={ms(48)} color={COLORS.outline} />
              <Text style={styles.emptyText}>No events found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: hs(20), gap: vs(16) },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ms(16),
    padding: hs(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(12),
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  eventIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(12),
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: ms(16), fontWeight: '800', color: COLORS.onSurface },
  eventMeta: { fontSize: ms(12), color: COLORS.onSurfaceVariant, marginTop: vs(4) },
  eventComm: { fontSize: ms(12), color: COLORS.onSurfaceVariant, marginTop: vs(2) },
  empty: { alignItems: 'center', marginTop: vs(100), gap: vs(12) },
  emptyText: { fontSize: ms(16), color: COLORS.onSurfaceVariant, fontWeight: '600' },
});

export default EventListScreen;
