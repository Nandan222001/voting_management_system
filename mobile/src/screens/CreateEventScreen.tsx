import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { eventService, EventCreate } from '../services/eventService';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';
import DatePicker from 'react-native-date-picker';

const COLORS = {
  primary: '#003d9b',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  outline: '#e2e8f0',
  error: '#ef4444',
  success: '#10b981',
};

const CreateEventScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('Meeting');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [place, setPlace] = useState('');
  const [communicationType, setCommunicationType] = useState<'Online' | 'Offline'>('Offline');
  const [description, setDescription] = useState('');

  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const handleCreate = async () => {
    if (!place) {
      showToast.error('Error', 'Please enter the event place.');
      return;
    }

    setLoading(true);
    try {
      const payload: EventCreate = {
        event_type: eventType,
        event_date: eventDate.toISOString().split('T')[0],
        event_time: eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        place,
        communication_type: communicationType,
        description,
      };

      await eventService.createEvent(payload);
      showToast.success('Success', 'Event created successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create event', error);
      showToast.error('Error', 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Create Event" showBack onBack={() => navigation.goBack()} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeContainer}>
            {['Meeting', 'Jalsa', 'Rally', 'Other'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, eventType === type && styles.typeButtonActive]}
                onPress={() => setEventType(type)}
              >
                <Text style={[styles.typeButtonText, eventType === type && styles.typeButtonTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Event Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setDateOpen(true)}>
            <Text style={styles.inputText}>{eventDate.toDateString()}</Text>
            <MaterialIcons name="event" size={20} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <DatePicker
            modal
            mode="date"
            open={dateOpen}
            date={eventDate}
            onConfirm={(date) => {
              setDateOpen(false);
              setEventDate(date);
            }}
            onCancel={() => setDateOpen(false)}
          />

          <Text style={styles.label}>Event Time</Text>
          <TouchableOpacity style={styles.input} onPress={() => setTimeOpen(true)}>
            <Text style={styles.inputText}>
              {eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <MaterialIcons name="access-time" size={20} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <DatePicker
            modal
            mode="time"
            open={timeOpen}
            date={eventTime}
            onConfirm={(date) => {
              setTimeOpen(false);
              setEventTime(date);
            }}
            onCancel={() => setTimeOpen(false)}
          />

          <Text style={styles.label}>Event Place</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter location"
            value={place}
            onChangeText={setPlace}
          />

          <Text style={styles.label}>Communication Type</Text>
          <View style={styles.commContainer}>
            {(['Online', 'Offline'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.commButton, communicationType === type && styles.commButtonActive]}
                onPress={() => setCommunicationType(type)}
              >
                <MaterialIcons
                  name={type === 'Online' ? 'videocam' : 'groups'}
                  size={18}
                  color={communicationType === type ? '#fff' : COLORS.onSurfaceVariant}
                />
                <Text style={[styles.commButtonText, communicationType === type && styles.commButtonTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Additional Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter event details"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 20 },
  form: { gap: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, marginBottom: -8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.onSurface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { fontSize: 16, color: COLORS.onSurface },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  typeButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant },
  typeButtonTextActive: { color: '#fff' },
  commContainer: { flexDirection: 'row', gap: 12, marginTop: 10 },
  commButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  commButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  commButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.onSurfaceVariant },
  commButtonTextActive: { color: '#fff' },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default CreateEventScreen;
