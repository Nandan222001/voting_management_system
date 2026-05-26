import React, { useState, useEffect } from 'react';
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
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { authService } from '../services/authService';
import { tenantService } from '../services/tenantService';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import Header from '../components/common/Header';

const { height } = Dimensions.get('window');

// --- HELPER COMPONENTS (Defined outside to prevent focus loss) ---

const UserInitials = () => (
  <View style={styles.initialsContainer}>
    <Text style={styles.initialsText}>CV</Text>
  </View>
);

const InputField = ({
  name,
  icon,
  label,
  placeholder,
  value,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  onRightIconPress,
  rightIcon,
  focusedField,
  setFocusedField,
  errors,
  onChangeText,
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputWrapper,
        focusedField === name && styles.inputWrapperFocused,
        errors[name] && styles.inputWrapperError,
      ]}>
      <Ionicons name={icon} size={18} color="#9ca3af" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocusedField(name)}
        onBlur={() => setFocusedField(null)}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        secureTextEntry={secureTextEntry}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress}>
          <MaterialIcons name={rightIcon} size={20} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
    {errors[name] && <Text style={styles.errorText}>{errors[name]}</Text>}
  </View>
);

// --- MAIN COMPONENT ---

const RegisterScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    date_of_birth: '',
    voter_id: '',
    phone: '',
    street_address: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
    password: '',
    designation: 'voter',
    tenant_id: null as number | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantName, setSelectedTenantName] = useState('Select Tenant');
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true);
      const data = await tenantService.getPublicTenants();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      Alert.alert('Error', 'Could not load tenants. Please try again later.');
    } finally {
      setTenantsLoading(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const selectTenant = (tenant: any) => {
    handleChange('tenant_id', tenant.id);
    setSelectedTenantName(tenant.name);
    setShowTenantModal(false);
  };

  const validateStep1 = () => {
    let newErrors: Record<string, string> = {};

    if (!formData.tenant_id) newErrors.tenant = 'Please select a tenant';
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Enter your full legal name';
    }

    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/; // mm/dd/yyyy
    if (!formData.date_of_birth || !dateRegex.test(formData.date_of_birth)) {
      newErrors.date_of_birth = 'Enter DOB in mm/dd/yyyy format';
    }

    if (!formData.voter_id || formData.voter_id.trim().length === 0) {
      newErrors.voter_id = 'Enter registration number';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    let newErrors: Record<string, string> = {};

    const phoneRegex = /^(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Enter valid 10-digit Indian number';
    }

    if (!formData.street_address) newErrors.street_address = 'Required';
    if (!formData.city) newErrors.city = 'Required';
    if (!formData.district) newErrors.district = 'Required';
    if (!formData.state) newErrors.state = 'Required';

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!formData.pincode || !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Min 8 characters';
    } else {
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
        newErrors.password = 'Include A-z, 0-9, and symbols';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    } else {
      Alert.alert('Missing Information', 'Please complete all required identity details.');
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) {
      Alert.alert('Incomplete Form', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      await authService.register(formData);
      Alert.alert(
        'Registration Successful',
        'Your account has been created and is now awaiting administrator approval.\n\nYou will be redirected to the login page.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        { cancelable: false }
      );
      setTimeout(() => navigation.navigate('Login'), 4000);
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.response?.status === 409) {
        errorMessage = 'This email or voter ID is already registered.';
      } else if (error.response?.data?.detail) {
        errorMessage = Array.isArray(error.response.data.detail) ? error.response.data.detail[0].msg : error.response.data.detail;
      }
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        enabled={Platform.OS !== 'web'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Title & Progress */}
          <View style={styles.mainTitleContainer}>
            <Text style={styles.mainTitleText}>Voter Registration</Text>
            <Text style={styles.subtitleText}>
              Step {step} of 2: {step === 1 ? 'Create your secure identity profile.' : 'Complete your registration details.'}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFilled, { width: step === 1 ? '50%' : '100%' }]} />
            </View>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Tenant</Text>
                  <TouchableOpacity 
                    style={[styles.inputWrapper, errors.tenant && styles.inputWrapperError]}
                    onPress={() => setShowTenantModal(true)}
                    disabled={tenantsLoading}
                  >
                    <Ionicons name="business-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                    <Text style={[styles.pickerText, !formData.tenant_id && { color: '#9ca3af' }]}>
                      {tenantsLoading ? 'Loading tenants...' : selectedTenantName}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#94a3b8" />
                  </TouchableOpacity>
                  {errors.tenant && <Text style={styles.errorText}>{errors.tenant}</Text>}
                </View>

                <InputField
                  name="full_name"
                  icon="person-outline"
                  label="Full Name"
                  placeholder="Legal name as on ID"
                  value={formData.full_name}
                  onChangeText={(val: string) => handleChange('full_name', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                  autoCapitalize="words"
                />

                <InputField
                  name="date_of_birth"
                  icon="calendar-outline"
                  label="Date of Birth"
                  placeholder="mm/dd/yyyy"
                  value={formData.date_of_birth}
                  onChangeText={(val: string) => handleChange('date_of_birth', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                  keyboardType="numbers-and-punctuation"
                />

                <InputField
                  name="voter_id"
                  icon="card-outline"
                  label="Voter ID / National ID Number"
                  placeholder="Enter registration number"
                  value={formData.voter_id}
                  onChangeText={(val: string) => handleChange('voter_id', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                  autoCapitalize="characters"
                />

                <InputField
                  name="email"
                  icon="mail-outline"
                  label="Email Address"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChangeText={(val: string) => handleChange('email', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                  keyboardType="email-address"
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleNextStep}>
                  <Text style={styles.buttonText}>Continue to Step 2</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InputField
                  name="phone"
                  icon="call-outline"
                  label="Phone Number"
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChangeText={(val: string) => handleChange('phone', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                  keyboardType="phone-pad"
                />

                <InputField
                  name="street_address"
                  icon="location-outline"
                  label="Street Address"
                  placeholder="House, Area, Road"
                  value={formData.street_address}
                  onChangeText={(val: string) => handleChange('street_address', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField
                      name="city"
                      icon="map-outline"
                      label="City"
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(val: string) => handleChange('city', val)}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                      errors={errors}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField
                      name="pincode"
                      icon="navigate-outline"
                      label="Pincode"
                      placeholder="6 digits"
                      value={formData.pincode}
                      onChangeText={(val: string) => handleChange('pincode', val)}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                      errors={errors}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField
                      name="district"
                      icon="locate-outline"
                      label="District"
                      placeholder="District"
                      value={formData.district}
                      onChangeText={(val: string) => handleChange('district', val)}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                      errors={errors}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField
                      name="state"
                      icon="globe-outline"
                      label="State"
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(val: string) => handleChange('state', val)}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                      errors={errors}
                    />
                  </View>
                </View>

                <InputField
                  name="password"
                  icon="lock-closed-outline"
                  label="Secure Password"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChangeText={(val: string) => handleChange('password', val)}
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                  errors={errors}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? "visibility-off" : "visibility"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.primaryButton, { flex: 2, marginTop: 0 }, loading && styles.buttonDisabled]} 
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Registry</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.footerContainer}>
              <Text style={styles.alreadyText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.securityBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
              <Text style={styles.securityText}>SOVEREIGN IDENTITY PROTOCOL ACTIVE</Text>
            </View>

            <Text style={styles.disclaimerText}>
              By creating an account, you agree to our Terms of Democratic Participation and Privacy Policy. Your vote remains anonymous and private.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showTenantModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tenant</Text>
              <TouchableOpacity onPress={() => setShowTenantModal(false)}>
                <MaterialIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={tenants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.tenantItem} onPress={() => selectTenant(item)}>
                  <Ionicons name="business-outline" size={20} color="#0058e7" style={{ marginRight: 12 }} />
                  <Text style={styles.tenantName}>{item.name}</Text>
                  {formData.tenant_id === item.id && <Ionicons name="checkmark-circle" size={20} color="#0058e7" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40, flexGrow: 1 },
  mainTitleContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20 },
  mainTitleText: { fontSize: 22, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
  subtitleText: { fontSize: 14, color: '#6b7280', marginTop: 6, lineHeight: 20 },
  progressBarBg: { height: 6, backgroundColor: '#eff6ff', borderRadius: 3, marginTop: 18, width: '100%', overflow: 'hidden' },
  progressBarFilled: { height: 6, backgroundColor: '#0058e7', borderRadius: 3 },
  formContainer: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, height: 48 },
  inputWrapperFocused: { borderColor: '#3b82f6', borderWidth: 1.5 },
  inputWrapperError: { borderColor: '#ef4444', borderWidth: 1.5 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 2 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1f2937', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  pickerText: { flex: 1, fontSize: 15, color: '#1f2937' },
  row: { flexDirection: 'row' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { paddingHorizontal: 10, fontSize: 10, fontWeight: '800', color: '#9ca3af' },
  primaryButton: { backgroundColor: '#0058e7', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#d1d5db' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  backButton: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8 },
  backButtonText: { color: '#4b5563', fontSize: 16, fontWeight: '600' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 20 },
  alreadyText: { color: '#4b5563', fontSize: 14 },
  loginText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignSelf: 'center', marginVertical: 16 },
  securityText: { fontSize: 11, fontWeight: '700', color: '#047857', marginLeft: 6, textTransform: 'uppercase' },
  disclaimerText: { textAlign: 'center', color: '#6b7280', fontSize: 12, lineHeight: 18, paddingHorizontal: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: height * 0.5, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  tenantItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tenantName: { flex: 1, fontSize: 15, fontWeight: '500' },
  initialsContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  initialsText: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
});

export default RegisterScreen;
