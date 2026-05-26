import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { authService } from "../services/authService";
import Header from "../components/common/Header";

const { width } = Dimensions.get('window');

// Safe Web Input Helper
const getInputStyle = () => {
  return Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};
};

const LoginScreen = ({ navigation, onLoginSuccess }: { navigation: any, onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Incomplete Fields",
        "Please enter your ID/email and password.",
      );
      return;
    }
    setLoading(true);
    try {
      await authService.login(email, password);
      onLoginSuccess();
    } catch (error: any) {
      const message = error.response?.data?.detail || "Invalid credentials. Please check your email and password.";
      Alert.alert("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.illustrationContainer}>
            <View style={styles.outerGlow}>
              <View style={styles.innerGlow}>
                <FontAwesome5 name="shield-alt" size={48} color="#0058e7" />
              </View>
            </View>
          </View>
          
          <Text style={styles.mainHeading}>Authorized Access</Text>
          <Text style={styles.subHeading}>Sign in to your secure voting profile to participate in active ballots.</Text>
        </View>

        <View style={styles.formBorderCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Identity / Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, getInputStyle()]}
                placeholder="voter@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Secure Password</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Forgot Password", "Please contact your organization's administrator to reset your credentials.")
                }
              >
                <Text style={styles.forgotText}>Recovery Options</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, getInputStyle()]}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonInnerContent}>
                <Text style={styles.primaryButtonText}>Verify & Login</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.footerOptions}>
             <Text style={styles.assistanceHelpText}>No account?</Text>
             <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}> Register Now</Text>
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.trustBanner}>
          <MaterialIcons name="verified-user" size={16} color="#047857" />
          <Text style={styles.trustText}>SECURE-RSA ENCRYPTION ACTIVE</Text>
        </View>

        <View style={styles.bottomBranding}>
           <Text style={styles.brandingText}>Powered by CivicVote Integrity Engine</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  illustrationContainer: {
    marginBottom: 24,
  },
  outerGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formBorderCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' }
    })
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", color: "#1e293b", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#0f172a", fontWeight: '500' },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotText: {
    color: "#0058e7",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#0058e7",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  buttonInnerContent: { flexDirection: "row", alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
  footerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  assistanceHelpText: {
    fontSize: 14,
    color: "#64748b",
  },
  registerText: {
    fontSize: 14,
    color: "#0058e7",
    fontWeight: '800',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#d1fae5',
    alignSelf: 'center',
  },
  trustText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    marginLeft: 8,
    letterSpacing: 1,
  },
  bottomBranding: {
    marginTop: 'auto',
    paddingVertical: 24,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default LoginScreen;
