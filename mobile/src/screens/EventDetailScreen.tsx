import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/common/Header';

const COLORS = {
  primary: '#003d9b',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  outline: '#e2e8f0',
  accent: '#ff8c00',
};

const EventDetailScreen = ({ navigation, route }: any) => {
  const { event } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Event Details" showBack onBack={() => navigation.goBack()} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <MaterialIcons
                name={event.event_type === 'Meeting' ? 'groups' : 'campaign'}
                size={32}
                color={COLORS.primary}
              />
            </View>
            <View>
              <Text style={styles.type}>{event.event_type}</Text>
              <Text style={styles.place}>{event.place}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.item}>
              <MaterialIcons name="event" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{event.event_date}</Text>
              </View>
            </View>
            <View style={styles.item}>
              <MaterialIcons name="access-time" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.value}>{event.event_time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.item}>
            <MaterialIcons name="videocam" size={20} color={COLORS.primary} />
            <View>
              <Text style={styles.label}>Communication Type</Text>
              <Text style={styles.value}>{event.communication_type}</Text>
            </View>
          </View>

          <View style={styles.item}>
            <MaterialIcons name="description" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>{event.description || 'No additional details provided.'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to List</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 6 },
    })
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  type: { fontSize: 24, fontWeight: '900', color: COLORS.onSurface },
  place: { fontSize: 16, fontWeight: '600', color: COLORS.onSurfaceVariant },
  divider: { height: 1, backgroundColor: COLORS.outline, opacity: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  description: { fontSize: 15, color: COLORS.onSurface, lineHeight: 22, marginTop: 4 },
  backButton: {
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
  },
  backButtonText: { fontSize: 16, fontWeight: '800', color: COLORS.onSurfaceVariant },
});

export default EventDetailScreen;
