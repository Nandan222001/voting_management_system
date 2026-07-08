import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import Header from "../components/common/Header";
import { showToast } from "../utils/toast";
import { hs, vs, ms } from "../utils/responsive";

const getInputStyle = () => {
  return Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};
};

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const { forgotPassword, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      showToast.error("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      showToast.success("OTP Sent", "A verification code has been sent to your email.");
      setStep(2);
    } catch (error: any) {
      console.error("[ForgotPassword Error]", error);
      let message = "Failed to send OTP. Please try again.";
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Handle FastAPI/Pydantic validation errors
          message = detail[0].msg || JSON.stringify(detail);
        } else if (typeof detail === 'object') {
          message = detail.message || JSON.stringify(detail);
        }
      }
      
      showToast.error("Request Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      showToast.error("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, otp_code: otp, new_password: newPassword });
      showToast.success("Success", "Password reset successfully. Please login.");
      navigation.navigate("Login");
    } catch (error: any) {
      console.error("[ResetPassword Error]", error);
      let message = "Reset failed. Check your OTP and try again.";
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          message = detail[0].msg || JSON.stringify(detail);
        } else if (typeof detail === 'object') {
          message = detail.message || JSON.stringify(detail);
        }
      }
      
      showToast.error("Reset Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={() => navigation.goBack()} title="Forgot Password" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <MaterialIcons name="lock-reset" size={ms(80)} color="#003d9b" />
          <Text style={styles.mainHeading}>
            {step === 1 ? "Reset Password" : "Create New Password"}
          </Text>
          <Text style={styles.subHeading}>
            {step === 1 
              ? "Enter your registered email address to receive a verification code."
              : "Enter the code sent to your email and choose a strong new password."}
          </Text>
        </View>

        <View style={styles.formBorderCard}>
          {step === 1 ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={ms(20)} color="#94a3b8" style={styles.inputIcon} />
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
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="verified" size={ms(20)} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, getInputStyle()]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={ms(20)} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, getInputStyle()]}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={newPassword}
                    onChangeText={setNewPassword}
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={ms(20)} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, getInputStyle()]}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={step === 1 ? handleSendOtp : handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonInnerContent}>
                <Text style={styles.primaryButtonText}>
                  {step === 1 ? "Send Verification Code" : "Reset Password"}
                </Text>
                <MaterialIcons name="arrow-forward" size={ms(18)} color="#fff" style={{ marginLeft: hs(8) }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {step === 2 && (
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
            <Text style={styles.backButtonText}>Use different email</Text>
          </TouchableOpacity>
        )}
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
  },
  heroSection: {
    alignItems: 'center',
    marginTop: vs(40),
    marginBottom: vs(32),
  },
  mainHeading: {
    fontSize: ms(24),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: vs(20),
  },
  subHeading: {
    fontSize: ms(14),
    color: '#64748b',
    textAlign: 'center',
    marginTop: vs(10),
    lineHeight: vs(20),
  },
  formBorderCard: {
    backgroundColor: "#fff",
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: ms(24),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
    })
  },
  inputGroup: { marginBottom: vs(20) },
  label: { fontSize: ms(12), fontWeight: "700", color: "#1e293b", marginBottom: vs(8), textTransform: 'uppercase' },
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
  input: { flex: 1, fontSize: ms(15), color: "#0f172a" },
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
  primaryButtonText: { color: "#fff", fontSize: ms(16), fontWeight: "800" },
  backButton: {
    marginTop: vs(20),
    alignItems: 'center',
  },
  backButtonText: {
    color: '#003d9b',
    fontWeight: '600',
    fontSize: ms(14),
  },
});

export default ForgotPasswordScreen;
