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
  Dimensions,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../services/api";
import Header from "../components/common/Header";
import { showToast } from "../utils/toast";
import { hs, vs, ms } from "../utils/responsive";

const { width } = Dimensions.get('window');

// Construct logo URI
const LOGO_URI = `${BASE_URL}/static/uploads/logo.png`;

const getInputStyle = () => {
  return Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};
};

const ChangePasswordScreen = ({ navigation }: { navigation: any }) => {
  const { changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast.error("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await changePassword({ 
        current_password: oldPassword, 
        new_password: newPassword 
      });
      showToast.success("Success", "Password changed successfully.");
      navigation.goBack();
    } catch (error: any) {
      console.error("[ChangePassword Error Detail]", JSON.stringify(error.response?.data, null, 2));
      let message = "Failed to change password. Please check your credentials.";
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          // Extract the first validation error message (e.g., "field required" or "password too short")
          const firstErr = detail[0];
          message = firstErr.msg || JSON.stringify(firstErr);
          
          // If we can identify the field that's wrong, make the message clearer
          if (firstErr.loc && firstErr.loc.length > 1) {
            message = `${firstErr.loc[1]}: ${message}`;
          }
        }
      }
      
      showToast.error("Update Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={() => navigation.goBack()} title="Change Password" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: LOGO_URI }} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.mainHeading}>Security Update</Text>
          <Text style={styles.subHeading}>
            Keep your account secure by regularly updating your password.
          </Text>
        </View>

        <View style={styles.formBorderCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Old Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-open" size={ms(20)} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, getInputStyle()]}
                placeholder="Current Password"
                placeholderTextColor="#94a3b8"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                <MaterialIcons
                  name={showOldPassword ? "visibility-off" : "visibility"}
                  size={ms(20)}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={ms(20)} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, getInputStyle()]}
                placeholder="Min. 8 characters"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <MaterialIcons
                  name={showNewPassword ? "visibility-off" : "visibility"}
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
                placeholder="Re-type New Password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showNewPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonInnerContent}>
                <Text style={styles.primaryButtonText}>Update Password</Text>
                <MaterialIcons name="check-circle" size={ms(18)} color="#fff" style={{ marginLeft: hs(8) }} />
              </View>
            )}
          </TouchableOpacity>
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
  },
  heroSection: {
    alignItems: 'center',
    marginTop: vs(40),
    marginBottom: vs(32),
  },
  logoImage: {
    width: ms(100),
    height: ms(100),
    marginBottom: vs(10),
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
});

export default ChangePasswordScreen;
