import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useAuth } from "../context/AuthContext";
import Header from "../components/common/Header";
import { showToast } from "../utils/toast";
import { hs, vs, ms } from "../utils/responsive";

const getInputStyle = () => {
  return Platform.OS === "web" ? ({ 
    outlineStyle: "none" 
  }) : {};
};

const VerifyScreen = ({ navigation, route }: any) => {
  const { email } = route.params || {};
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState<number>(178);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!email) {
      showToast.error("Error", "Email not provided for verification");
      navigation.navigate("Login");
    }
  }, [email]);

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
    newCode[index] = text.slice(-1);
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

  const handleVerify = async () => {
    const otpCode = code.join("");
    if (otpCode.length < 6) {
      showToast.error(
        "Incomplete Code",
        "Please enter the complete 6-digit verification code.",
      );
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      showToast.success("Verified", "Your identity has been confirmed.");
      // On success, AuthContext updates 'token', and App.tsx automatically 
      // switches to TabNavigator (Dashboard).
    } catch (error: any) {
      const message = error.response?.data?.detail || "Invalid OTP. Please try again.";
      showToast.error("Verification Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        showBack 
        onBack={() => navigation.goBack()} 
        title="Verification"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.connectionBadge}>
          <MaterialIcons name="gpp-good" size={ms(14)} color="#059669" />
          <Text style={styles.connectionBadgeText}>
            Encrypted Connection Active
          </Text>
        </View>

        <Text style={styles.mainTitleText}>Identity Verification</Text>
        <Text style={styles.descriptionText}>
          We've sent a 6-digit verification code to <Text style={{ fontWeight: "700" }}>{email}</Text>.
        </Text>

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

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: vs(10) }}>
          <MaterialIcons name="access-time" size={ms(16)} color="#475569" style={{ marginRight: hs(6) }} />
          <Text style={styles.timerText}>
            Code expires in {formatTime(timer)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            showToast.info("Resend Code", "A new passcode has been dispatched")
          }
        >
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>

        <View style={styles.graphicCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400",
            }}
            style={styles.graphicImage}
          />
          <View style={styles.graphicOverlay}>
            <FontAwesome5 name="shield-alt" size={ms(12)} color="#fff" style={{ marginRight: hs(6) }} />
            <Text style={styles.graphicOverlayText}>256-bit AES Encryption</Text>
          </View>
        </View>

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
              <MaterialIcons name="arrow-forward" size={ms(18)} color="#fff" style={{ marginLeft: hs(6) }} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backToLoginButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.footerLegalText}>
          OFFICIAL ELECTION AUTHORITY SYSTEM
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: {
    paddingHorizontal: hs(24),
    paddingBottom: vs(40),
    alignItems: "center",
  },
  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: hs(16),
    paddingVertical: vs(6),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginTop: vs(24),
    marginBottom: vs(28),
  },
  connectionBadgeText: {
    fontSize: ms(12),
    fontWeight: "600",
    color: "#065f46",
    marginLeft: hs(6),
  },
  mainTitleText: {
    fontSize: ms(24),
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: vs(12),
  },
  descriptionText: {
    fontSize: ms(15),
    color: "#475569",
    textAlign: "center",
    marginBottom: vs(24),
    lineHeight: vs(22),
    paddingHorizontal: hs(12),
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: vs(20),
  },
  otpBox: {
    width: "14%",
    height: vs(52),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: ms(8),
    fontSize: ms(18),
    fontWeight: "600",
    color: "#0f172a",
  },
  timerText: { fontSize: ms(14), color: "#334155", fontWeight: "500" },
  resendText: {
    fontSize: ms(15),
    color: "#003d9b",
    fontWeight: "500",
    marginBottom: vs(24),
  },
  graphicCard: {
    width: "100%",
    height: vs(190),
    borderRadius: ms(12),
    overflow: "hidden",
    position: "relative",
    marginBottom: vs(32),
    backgroundColor: "#0f172a",
  },
  graphicImage: { width: "100%", height: "100%", opacity: 0.45 },
  graphicOverlay: {
    position: "absolute",
    bottom: vs(14),
    left: hs(14),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(6),
  },
  graphicOverlayText: { color: "#fff", fontSize: ms(12), fontWeight: "500" },
  primaryButton: {
    backgroundColor: "#003d9b",
    width: "100%",
    height: vs(52),
    borderRadius: ms(8),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  buttonInnerContent: { flexDirection: "row", alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: ms(16), fontWeight: "700" },
  backToLoginButton: {
    paddingVertical: vs(10),
    width: "100%",
    alignItems: "center",
    marginBottom: vs(40),
  },
  backToLoginText: { fontSize: ms(15), color: "#334155", fontWeight: "500" },
  footerLegalText: {
    fontSize: ms(11),
    color: "#94a3b8",
    letterSpacing: 1,
    fontWeight: "600",
    marginTop: "auto",
  },
});

export default VerifyScreen;
