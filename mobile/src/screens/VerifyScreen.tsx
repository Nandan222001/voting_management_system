import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

// Dimensions and Safe Web Input Helper
const getInputStyle = () => {
  return Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};
};

// ==========================================
// SCREEN COMPONENT: Verification/OTP (Derived from Html → Body.svg)
// ==========================================
const VerificationScreen = ({ onNext, onBack }: any) => {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(178); // 2 minutes 58 seconds
  const [loading, setLoading] = useState<boolean>(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTime) => (prevTime <= 1 ? 0 : prevTime - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.slice(-1); // Only keep the last digit
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (code.join("").length < 6) {
      Alert.alert(
        "Incomplete Code",
        "Please enter the complete 6-digit verification code.",
      );
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNext(); // Navigate forward to Profile
    }, 1500);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Connection Indicator Badge Layout */}
      <View style={styles.connectionBadge}>
        <MaterialIcons name="gpp-good" size={14} color="#059669" />
        <Text style={styles.connectionBadgeText}>
          Encrypted Connection Active
        </Text>
      </View>

      <Text style={styles.mainTitleText}>Identity Verification</Text>
      <Text style={styles.descriptionText}>
        We've sent a 6-digit verification code to your registered device ending
        in <Text style={{ fontWeight: "700" }}>•••• 4209</Text>.
      </Text>

      {/* Discrete 6-digit OTP passcode fields input block matrix */}
      <View style={styles.otpInputContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[styles.otpBox, getInputStyle()]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
          />
        ))}
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <MaterialIcons
          name="access-time"
          size={16}
          color="#475569"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.timerText}>
          Code expires in {formatTime(timer)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          Alert.alert("Resend Code", "A new passcode has been dispatched")
        }
      >
        <Text style={styles.resendText}>Resend Code</Text>
      </TouchableOpacity>

      {/* Encryption System Graphic Badge Element Matrix */}
      <View style={styles.graphicCard}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400",
          }}
          style={styles.graphicImage}
        />
        <View style={styles.graphicOverlay}>
          <FontAwesome5
            name="shield-alt"
            size={12}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.graphicOverlayText}>256-bit AES Encryption</Text>
        </View>
      </View>

      {/* Submit Trigger CTA Buttons Matrix Layer */}
      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonInnerContent}>
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backToLoginButton} onPress={onBack}>
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>

      <Text style={styles.footerLegalText}>
        OFFICIAL ELECTION AUTHORITY SYSTEM
      </Text>
    </ScrollView>
  );
};

// ==========================================
// UNIFIED MASTER APP COMPONENT
// ==========================================
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    "login" | "otp" | "register" | "profile"
  >("otp");

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar Header */}
      <View style={styles.secureHeader}>
        <View style={styles.secureHeaderRow}>
          <FontAwesome5 name="shield-alt" size={20} color="#0f172a" />
          <Text style={styles.secureHeaderText}>SecureVote</Text>
        </View>
        <View style={styles.topInitialsCircle}>
          <Text style={styles.topInitialsText}>JD</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {currentScreen === "otp" && (
          <VerificationScreen
            onNext={() => setCurrentScreen("profile")}
            onBack={() => setCurrentScreen("login")}
          />
        )}
        {/* Other screens (LoginScreen, RegisterScreen, ProfileScreen) implementation is stubbed/abstracted for brevity in this specific file */}
        {currentScreen !== "otp" && (
          <View style={styles.scrollContent}>
            <Text style={styles.mainTitleText}>
              Navigated to {currentScreen}
            </Text>
          </View>
        )}
      </View>

      {/* App Bottom Navigation Bar Layout */}
      <View style={styles.appBottomTabsRow}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen("otp")}
        >
          <MaterialIcons
            name="dashboard"
            size={22}
            color={currentScreen === "otp" ? "rgb(16 102 177)" : "#64748b"}
          />
          <Text
            style={[
              styles.tabLabelText,
              currentScreen === "otp" && { color: "rgb(16 102 177)" },
            ]}
          >
            Portal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="how-to-reg" size={22} color="#64748b" />
          <Text style={styles.tabLabelText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="account-circle" size={22} color="#64748b" />
          <Text style={styles.tabLabelText}>Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// UNIFIED STYLESHEET (Included in File)
// ==========================================
const styles = StyleSheet.create({
  // Base Layout & Global Elements
  container: { flex: 1, backgroundColor: "#f8fafc" },
  secureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  secureHeaderRow: { flexDirection: "row", alignItems: "center" },
  secureHeaderText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: 10,
  },
  topInitialsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  topInitialsText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: "center",
  },

  // Verification Screen Top Status Indicator Badge
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginTop: 24,
    marginBottom: 28,
  },
  connectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
    marginLeft: 6,
  },
  mainTitleText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  // Discrete OTP passcode inputs grid matrix configuration
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  otpBox: {
    width: "14%",
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  timerText: { fontSize: 14, color: "#334155", fontWeight: "500" },
  resendText: {
    fontSize: 15,
    color: "rgb(16 102 177)",
    fontWeight: "500",
    marginBottom: 24,
  },

  // Encryption System Graphic Badge Box Layer
  graphicCard: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    marginBottom: 32,
    backgroundColor: "#0f172a",
  },
  graphicImage: { width: "100%", height: "100%", opacity: 0.45 },
  graphicOverlay: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  graphicOverlayText: { color: "#fff", fontSize: 12, fontWeight: "500" },

  // Submit Trigger Layer CTA Buttons
  primaryButton: {
    backgroundColor: "rgb(16 102 177)",
    width: "100%",
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  buttonInnerContent: { flexDirection: "row", alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backToLoginButton: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  backToLoginText: { fontSize: 15, color: "#334155", fontWeight: "500" },
  footerLegalText: {
    fontSize: 11,
    color: "#94a3b8",
    letterSpacing: 1,
    fontWeight: "600",
    marginTop: "auto",
  },

  // App Bottom Tabs Structure
  appBottomTabsRow: {
    flexDirection: "row",
    height: 56,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  tabLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 2,
  },
});
