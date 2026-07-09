import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import Header from '../components/common/Header';
import { hs, vs, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

const PRIVACY_URL = 'https://vbaconnect.in/privacy-policy';

const PrivacyPolicyScreen = ({ navigation }: any) => {
  const openOnline = async () => {
    try {
      await Linking.openURL(PRIVACY_URL);
    } catch (e) {
      console.error('Failed to open privacy policy', e);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Privacy Policy" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(40) }}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Privacy Policy</Text>
          <Text style={styles.updatedText}>Last updated: July 2025</Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us, such as your name, email address, phone number, voter identification details, and any other information you choose to provide.
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the collected information to provide and improve our voting services, verify your identity, communicate with you, and ensure the security and integrity of the electoral process.
          </Text>

          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal data. We may share your information with electoral authorities and service providers who assist us in operating the platform, subject to strict confidentiality obligations.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to access, correct, or delete your personal data. You can update your profile information within the app or contact us for assistance.
          </Text>

          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions or concerns about this Privacy Policy, please contact us at support@vbaconnect.in.
          </Text>

          <TouchableOpacity style={styles.webButton} onPress={openOnline}>
            <Text style={styles.webButtonText}>View Full Policy Online</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  content: {
    flex: 1,
    paddingHorizontal: hs(16),
    paddingTop: vs(12),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: hs(20),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 3 },
    })
  },
  heading: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: vs(4),
    letterSpacing: -0.5,
  },
  updatedText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#64748b',
    marginBottom: vs(20),
  },
  sectionTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: vs(16),
    marginBottom: vs(6),
  },
  paragraph: {
    fontSize: ms(14),
    fontWeight: '500',
    color: '#334155',
    lineHeight: vs(22),
    marginBottom: vs(8),
  },
  webButton: {
    marginTop: vs(20),
    paddingVertical: vs(12),
    paddingHorizontal: hs(16),
    borderRadius: ms(8),
    backgroundColor: '#003d9b',
    alignItems: 'center',
  },
  webButtonText: {
    color: '#fff',
    fontSize: ms(14),
    fontWeight: '800',
  },
});

export { PrivacyPolicyScreen };
