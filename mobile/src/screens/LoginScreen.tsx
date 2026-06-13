import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../services/api";
import Header from "../components/common/Header";
import { showToast } from "../utils/toast";
import { hs, vs, ms } from "../utils/responsive";

const { width } = Dimensions.get('window');

// Construct logo URI
const LOGO_URI = `${BASE_URL}/static/uploads/logo.png`;

// Safe Web Input Helper
const getInputStyle = () => {
  return Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};
};

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { login, setToken, setUser, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast.error("Incomplete Fields", "Please enter your ID/email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      const user = result.user;

      // 1. Evaluate User Status (Active Check)
      if (user.status === 'active') {
        // 2. Success Behavior: Active users log in immediately and bypass OTP
        setToken(result.access_token);
        setUser(user);
        showToast.success("Success", "Welcome back to VBA Bharat!");
        // Navigation to Dashboard happens automatically in App.tsx due to token state
      } else {
        // 3. Validation & Error Handling: Prevent login for non-active users
        await logout(); // Ensure any stored data is cleared
        
        let statusMessage = "Your account is not active. Please contact support.";
        if (user.status === 'pending') {
          statusMessage = "Your account is awaiting admin approval.";
        } else if (user.status === 'blocked') {
          statusMessage = "Your account has been blocked. Please contact support.";
        }
        
        showToast.error("Access Denied", statusMessage);
      }
    } catch (error: any) {
      // 4. Detailed Error Handling
      console.error("[Login Error Details]", error);
      
      let message = "An unexpected error occurred.";
      
      if (error.response) {
        message = error.response.data?.detail || error.response.data?.message || "Invalid credentials.";
      } else if (error.request) {
        message = "Network error. This is likely due to the self-signed SSL certificate on the server. Please ensure your device/simulator trusts the connection.";
      } else {
        message = error.message;
      }
      
      showToast.error("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: LOGO_URI }} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          
          <Text style={styles.mainHeading}>Authorized Access</Text>
          <Text style={styles.subHeading}>Sign in to your secure voting profile to participate in active elections.</Text>
        </View>

        <View style={styles.formBorderCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person-outline"
                size={ms(20)}
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
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock-outline"
                size={ms(20)}
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
                  size={ms(20)}
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
                <MaterialIcons name="arrow-forward" size={ms(18)} color="#fff" style={{ marginLeft: hs(8) }} />
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
          <MaterialIcons name="verified-user" size={ms(16)} color="#047857" />
          <Text style={styles.trustText}>SECURE-RSA ENCRYPTION ACTIVE</Text>
        </View>

        <View style={styles.bottomBranding}>
           <Text style={styles.brandingText}>Powered by VBA Bharat Integrity Engine</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: hs(24),
    paddingBottom: vs(40),
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: vs(40),
    marginBottom: vs(32),
  },
  logoImage: {
    width: ms(120),
    height: ms(120),
    marginBottom: vs(20),
  },
  mainHeading: {
    fontSize: ms(26),
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: ms(14),
    color: '#64748b',
    textAlign: 'center',
    marginTop: vs(10),
    lineHeight: vs(20),
    paddingHorizontal: hs(20),
  },
  formBorderCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: ms(24),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' }
    })
  },
  inputGroup: { marginBottom: vs(20) },
  label: { fontSize: ms(12), fontWeight: "700", color: "#1e293b", marginBottom: vs(8), textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: ms(6),
    paddingHorizontal: hs(14),
    height: vs(52),
  },
  inputIcon: { marginRight: hs(10) },
  input: { flex: 1, fontSize: ms(15), color: "#0f172a", fontWeight: '500' },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPasswordText: {
    fontSize: ms(12),
    color: "#003d9b",
    fontWeight: '700',
    marginBottom: vs(8),
  },
  primaryButton: {
    backgroundColor: "#003d9b",
    height: vs(56),
    borderRadius: ms(6),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(8),
  },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  buttonInnerContent: { flexDirection: "row", alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: ms(16), fontWeight: "800", letterSpacing: 0.5 },
  footerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: vs(24),
  },
  assistanceHelpText: {
    fontSize: ms(14),
    color: "#64748b",
  },
  registerText: {
    fontSize: ms(14),
    color: "#003d9b",
    fontWeight: '800',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: vs(10),
    paddingHorizontal: hs(16),
    borderRadius: ms(8),
    marginTop: vs(32),
    borderWidth: 1,
    borderColor: '#d1fae5',
    alignSelf: 'center',
  },
  trustText: {
    fontSize: ms(10),
    fontWeight: "800",
    color: "#047857",
    marginLeft: hs(8),
    letterSpacing: 1,
  },
  bottomBranding: {
    marginTop: 'auto',
    paddingVertical: vs(24),
    alignItems: 'center',
  },
  brandingText: {
    fontSize: ms(11),
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default LoginScreen;
