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
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import Header from "../components/common/Header";

const getInputStyle = () => {
  return Platform.OS === "web" ? ({ 
    // @ts-ignore
    outlineStyle: "none" 
  } as any) : {};
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
      Alert.alert("Error", "Email not provided for verification");
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
      Alert.alert(
        "Incomplete Code",
        "Please enter the complete 6-digit verification code.",
      );
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otpCode);
      Alert.alert(
        "Verification Successful",
        "Your email has been verified. Please sign in to continue.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error: any) {
      const message = error.response?.data?.detail || "Invalid OTP. Please try again.";
      Alert.alert("Verification Failed", message);
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
        <View style={styles.connectionBadge}>
          <MaterialIcons name="gpp-good" size={14} color="#059669" />
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

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <MaterialIcons name="access-time" size={16} color="#475569" style={{ marginRight: 6 }} />
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

        <View style={styles.graphicCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400",
            }}
            style={styles.graphicImage}
          />
          <View style={styles.graphicOverlay}>
            <FontAwesome5 name="shield-alt" size={12} color="#fff" style={{ marginRight: 6 }} />
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
              <MaterialIcons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
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
});

export default VerifyScreen;
