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
  Dimensions,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { authService } from '../services/authService';
import { tenantService } from '../services/tenantService';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../components/common/Header';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    street_address: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
    password: '',
    designation: 'Member',
    tenant_id: null as number | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantName, setSelectedTenantName] = useState('Select Tenant');
  const [loading, setLoading] = useState(false);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
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
  };

  const selectTenant = (tenant: any) => {
    handleChange('tenant_id', tenant.id);
    setSelectedTenantName(tenant.name);
    setShowTenantModal(false);
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    // Tenant Validation
    if (!formData.tenant_id) {
      newErrors.tenant = 'Please select a tenant';
    }

    // Full Name
    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Enter a valid full name (min 2 chars)';
    }

    // Email Validation (Proper Mail Format)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Phone Validation (Indian/IN Format: +91 followed by 10 digits or just 10 digits)
    const phoneRegex = /^(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian phone number';
    }

    // Address
    if (!formData.street_address || formData.street_address.length < 3) {
      newErrors.street_address = 'Address must be at least 3 characters';
    }

    // City, District, State
    if (!formData.city) newErrors.city = 'Required';
    if (!formData.district) newErrors.district = 'Required';
    if (!formData.state) newErrors.state = 'Required';

    // Pincode (Indian Format: 6 digits)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!formData.pincode || !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }

    // Password
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Min 8 characters';
    } else {
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
        newErrors.password = 'Must include A-z, 0-9, and symbols';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors highlighted in the form.');
      return;
    }

    setLoading(true);
    try {
      await authService.register(formData);
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully and is now awaiting administrator approval.\n\nYou will be redirected to the login page.',
        [{ text: 'Proceed to Login', onPress: () => navigation.navigate('Login') }],
        { cancelable: false }
      );

      // Automatic redirect after a delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);

    } catch (error: any) {
      console.error('Registration API Error:', error.response?.data || error.message);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'This email is already registered.';
        setErrors(prev => ({ ...prev, email: 'Email already exists' }));
      } else if (error.response?.data?.detail) {
        errorMessage = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0].msg 
          : error.response.data.detail;
      }
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Registration" 
        showBack={true} 
        onBack={() => navigation.goBack()} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        enabled={Platform.OS !== 'web'} // Usually not needed on web
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={Platform.OS === 'web'} // Show it on web
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.backgroundDecoration}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Join CivicVote</Text>
            <Text style={styles.headerSubtitle}>Create your account to start voting</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Tenant</Text>
              <TouchableOpacity 
                style={[
                  styles.inputWrapper,
                  focusedField === 'tenant' && styles.inputWrapperFocused,
                  errors.tenant && styles.inputWrapperError
                ]}
                onPress={() => setShowTenantModal(true)}
                disabled={tenantsLoading}
              >
                <MaterialIcons 
                  name="business" 
                  size={20} 
                  color={formData.tenant_id ? '#4f46e5' : '#9ca3af'} 
                  style={styles.inputIcon} 
                />
                <Text style={[
                  styles.pickerText, 
                  !formData.tenant_id && { color: '#9ca3af' }
                ]}>
                  {tenantsLoading ? 'Loading tenants...' : selectedTenantName}
                </Text>
                {tenantsLoading ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <MaterialIcons name="arrow-drop-down" size={24} color="#9ca3af" />
                )}
              </TouchableOpacity>
              {errors.tenant && <Text style={styles.errorText}>{errors.tenant}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'full_name' && styles.inputWrapperFocused,
                errors.full_name && styles.inputWrapperError
              ]}>
                <MaterialIcons 
                  name="person-outline" 
                  size={20} 
                  color={focusedField === 'full_name' ? '#4f46e5' : '#9ca3af'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  value={formData.full_name}
                  onChangeText={(val) => handleChange('full_name', val)}
                  onFocus={() => setFocusedField('full_name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputWrapperFocused,
                errors.email && styles.inputWrapperError
              ]}>
                <MaterialIcons 
                  name="mail-outline" 
                  size={20} 
                  color={focusedField === 'email' ? '#4f46e5' : '#9ca3af'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="example@mail.com"
                  placeholderTextColor="#9ca3af"
                  value={formData.email}
                  onChangeText={(val) => handleChange('email', val)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'phone' && styles.inputWrapperFocused,
                errors.phone && styles.inputWrapperError
              ]}>
                <MaterialIcons 
                  name="phone-android" 
                  size={20} 
                  color={focusedField === 'phone' ? '#4f46e5' : '#9ca3af'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="+91 00000 00000"
                  placeholderTextColor="#9ca3af"
                  value={formData.phone}
                  onChangeText={(val) => handleChange('phone', val)}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ADDRESS DETAILS</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'street_address' && styles.inputWrapperFocused,
                errors.street_address && styles.inputWrapperError
              ]}>
                <MaterialIcons 
                  name="map" 
                  size={20} 
                  color={focusedField === 'street_address' ? '#4f46e5' : '#9ca3af'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="House No, Building, Street"
                  placeholderTextColor="#9ca3af"
                  value={formData.street_address}
                  onChangeText={(val) => handleChange('street_address', val)}
                  onFocus={() => setFocusedField('street_address')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.street_address && <Text style={styles.errorText}>{errors.street_address}</Text>}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'city' && styles.inputWrapperFocused,
                  errors.city && styles.inputWrapperError
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor="#9ca3af"
                    value={formData.city}
                    onChangeText={(val) => handleChange('city', val)}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>District</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'district' && styles.inputWrapperFocused,
                  errors.district && styles.inputWrapperError
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="District"
                    placeholderTextColor="#9ca3af"
                    value={formData.district}
                    onChangeText={(val) => handleChange('district', val)}
                    onFocus={() => setFocusedField('district')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>State</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'state' && styles.inputWrapperFocused,
                  errors.state && styles.inputWrapperError
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="State"
                    placeholderTextColor="#9ca3af"
                    value={formData.state}
                    onChangeText={(val) => handleChange('state', val)}
                    onFocus={() => setFocusedField('state')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Pincode</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'pincode' && styles.inputWrapperFocused,
                  errors.pincode && styles.inputWrapperError
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor="#9ca3af"
                    value={formData.pincode}
                    onChangeText={(val) => handleChange('pincode', val)}
                    keyboardType="number-pad"
                    maxLength={6}
                    onFocus={() => setFocusedField('pincode')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>SECURITY</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused,
                errors.password && styles.inputWrapperError
              ]}>
                <MaterialIcons 
                  name="lock-outline" 
                  size={20} 
                  color={focusedField === 'password' ? '#4f46e5' : '#9ca3af'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 characters"
                  placeholderTextColor="#9ca3af"
                  value={formData.password}
                  onChangeText={(val) => handleChange('password', val)}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color="#9ca3af" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already part of the community?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInText}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Tenant Selection Modal */}
      <Modal
        visible={showTenantModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTenantModal(false)}
      >
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
                <TouchableOpacity 
                  style={styles.tenantItem} 
                  onPress={() => selectTenant(item)}
                >
                  <View style={styles.tenantIcon}>
                    <MaterialIcons name="business" size={24} color="#4f46e5" />
                  </View>
                  <Text style={styles.tenantName}>{item.name}</Text>
                  {formData.tenant_id === item.id && (
                    <MaterialIcons name="check-circle" size={20} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No active tenants found.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    flexGrow: 1,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
    zIndex: -1,
  },
  circle1: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#4f46e505',
  },
  circle2: {
    position: 'absolute',
    top: 100,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4f46e503',
  },
  headerInfo: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 6,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputWrapperFocused: {
    borderColor: '#4f46e5',
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 1.5,
  },
  registerButton: {
    backgroundColor: '#4f46e5',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        cursor: 'pointer',
      },
    }),
  },
  registerButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  signInText: {
    color: '#4f46e5',
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.6,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  tenantIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4f46e510',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tenantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default RegisterScreen;
