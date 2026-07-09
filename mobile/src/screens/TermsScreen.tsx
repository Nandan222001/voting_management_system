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

const TERMS_URL = 'https://vbaconnect.in/terms';

const TermsScreen = ({ navigation }: any) => {
  const openOnline = async () => {
    try {
      await Linking.openURL(TERMS_URL);
    } catch (e) {
      console.error('Failed to open terms', e);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Terms & Conditions" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(40) }}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>Terms & Conditions</Text>
          <Text style={styles.updatedText}>Last updated: July 2025</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using this voting platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use the service.
          </Text>

          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.paragraph}>
            You must be a registered voter and provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.
          </Text>

          <Text style={styles.sectionTitle}>3. Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree not to misuse the platform or assist anyone else in doing so. This includes attempting to access areas of the service you are not authorized to access or interfering with the integrity of the voting process.
          </Text>

          <Text style={styles.sectionTitle}>4. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of the platform are owned by VBA Connect and are protected by applicable intellectual property laws. Unauthorized use is prohibited.
          </Text>

          <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service.
          </Text>

          <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may revise these Terms from time to time. Continued use of the platform after changes become effective constitutes acceptance of the revised Terms.
          </Text>

          <Text style={styles.sectionTitle}>7. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms, please contact us at support@vbaconnect.in.
          </Text>

          <TouchableOpacity style={styles.webButton} onPress={openOnline}>
            <Text style={styles.webButtonText}>View Full Terms Online</Text>
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

export { TermsScreen };