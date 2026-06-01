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
  Image,
  Switch,
} from 'react-native';
import { tenantService } from '../services/tenantService';
import { mediaService } from '../services/mediaService';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import Header from '../components/common/Header';

const { width, height } = Dimensions.get('window');

// --- COLORS ---
const COLORS = {
  primary: 'rgb(16 102 177)',
  primaryContainer: '#eff6ff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#cbd5e1',
  error: '#ef4444',
  white: '#ffffff',
  bg: '#f8fafc',
};

// --- HELPER COMPONENTS ---

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
  errors = {},
  onChangeText,
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputWrapper,
        focusedField === name && styles.inputWrapperFocused,
        name && errors[name] && styles.inputWrapperError,
      ]}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
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
    {name && errors[name] && <Text style={styles.errorText}>{errors[name]}</Text>}
  </View>
);

const PickerField = ({ label, value, icon, onPress, error }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={[styles.inputWrapper, error && styles.inputWrapperError]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
      <Text style={[styles.pickerText, !value && { color: '#9ca3af' }]}>
        {value || `Select ${label}`}
      </Text>
      <MaterialIcons name="arrow-drop-down" size={24} color="#94a3b8" />
    </TouchableOpacity>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const SectionHeader = ({ title, step, subtitle }: any) => (
  <View style={styles.sectionHeaderContainer}>
    <View style={styles.stepBadge}>
      <Text style={styles.stepBadgeText}>Step {step} of 5</Text>
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFilled, { width: `${(step / 5) * 100}%` }]} />
    </View>
  </View>
);

// --- MAIN COMPONENT ---

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Data States
  const [formData, setFormData] = useState({
    // Step 1
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    parent_name: '',
    password: '',
    confirmPassword: '',

    // Step 2
    kyc_type: '',
    kyc_front_url: '',
    kyc_back_url: '',

    // Step 3
    house_number: '',
    street_address: '',
    village: '',
    landmark: '',
    pincode: '',
    state: '',
    district: '',
    taluka: '',
    country: 'India',

    current_street_address: '',
    current_city: '',
    current_district: '',
    current_state: '',
    current_pincode: '',

    // Step 4
    tenant_id: null as number | null,
    committee_id: null as number | null,
    state_id: null as number | null,
    district_id: null as number | null,
    taluka_id: null as number | null,
    village_id: null as number | null,

    // Step 5
    membership_plan_id: null as number | null,
  });

  const [sameAsPermanent, setSameAsPermanent] = useState(true);

  // Selection Data
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [talukas, setTalukas] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedTenantName, setSelectedTenantName] = useState('');
  const [selectedCommitteeName, setSelectedCommitteeName] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedTalukaName, setSelectedTalukaName] = useState('');
  const [selectedVillageName, setSelectedVillageName] = useState('');

  // Modals
  const [modalType, setModalType] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  useEffect(() => {
    if (modalType) {
      setModalSearchQuery('');
    }
  }, [modalType]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch current tenant details based on UUID in header
      const tenant = await tenantService.getCurrentTenant();
      setCurrentTenant(tenant);
      
      // Auto-set the tenant ID in form
      setFormData(prev => ({ ...prev, tenant_id: tenant.id }));
      setSelectedTenantName(tenant.name);

      // 2. Fetch states
      const statesData = await tenantService.getPublicTargets(undefined, 'state');
      setStates(statesData);

      // 3. Fetch specific data for this tenant (header already carries X-Tenant-ID)
      fetchTenantSpecificData();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      fetchTenants();
      fetchStates();
    }
  };

  const fetchStates = async () => {
    try {
      const data = await tenantService.getPublicTargets(undefined, 'state');
      setStates(data);
    } catch (error) {
      console.error('Failed to fetch states:', error);
    }
  };

  const fetchDistricts = async (stateId: number) => {
    try {
      const data = await tenantService.getPublicTargets(stateId, 'district');
      setDistricts(data);
    } catch (error) {
      console.error('Failed to fetch districts:', error);
    }
  };

  const fetchTalukas = async (districtId: number) => {
    try {
      const data = await tenantService.getPublicTargets(districtId, 'taluka');
      setTalukas(data);
    } catch (error) {
      console.error('Failed to fetch talukas:', error);
    }
  };

  const fetchVillages = async (talukaId: number) => {
    try {
      const data = await tenantService.getPublicTargets(talukaId, 'village');
      setVillages(data);
    } catch (error) {
      console.error('Failed to fetch villages:', error);
    }
  };

  const pickAndUploadImage = async (field: 'kyc_front_url' | 'kyc_back_url') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload KYC documents.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(field);
      try {
        const uri = result.assets[0].uri;
        const uploadedUrl = await mediaService.uploadFile(uri, `${field}.jpg`);
        handleChange(field, uploadedUrl);
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
      } finally {
        setUploading(null);
      }
    }
  };

  useEffect(() => {
    if (formData.tenant_id) {
      fetchTenantSpecificData();
    }
  }, [formData.tenant_id]);

  const fetchTenants = async () => {
    try {
      const data = await tenantService.getPublicTenants();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  const fetchTenantSpecificData = async () => {
    try {
      const commData = await tenantService.getPublicCommittees();
      setCommittees(commData);
      const planData = await tenantService.getPublicPlans();
      setPlans(planData);
    } catch (error) {
      console.error('Failed to fetch tenant specific data:', error);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.full_name) newErrors.full_name = 'Required';
    if (!formData.phone) newErrors.phone = 'Required';
    if (!formData.email) newErrors.email = 'Required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Required';
    if (!formData.gender) newErrors.gender = 'Required';
    if (!formData.password) newErrors.password = 'Required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.kyc_type) {
      newErrors.kyc_type = 'Please select identity proof';
    }
    if (!formData.kyc_front_url || formData.kyc_front_url === 'mock_front.jpg') {
      newErrors.kyc_front_url = 'Please upload identity proof document';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Prepare submission data
      const submissionData = { ...formData };
      if (sameAsPermanent) {
        submissionData.current_street_address = formData.street_address;
        submissionData.current_city = formData.village || ''; // fallback to village if city not explicit
        submissionData.current_district = formData.district;
        submissionData.current_state = formData.state;
        submissionData.current_pincode = formData.pincode;
      }

      // Resolve target_id (most granular selected)
      const target_id = formData.village_id || formData.taluka_id || formData.district_id || formData.state_id;
      (submissionData as any).target_id = target_id;
      
      await register(submissionData);
      Alert.alert(
        'Success',
        'Registration successful! Please sign in with your credentials.',
        [{ text: 'Sign In', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    let data: any[] = [];
    let onSelect = (item: any) => {};
    let title = "";

    if (modalType === 'gender') {
      title = "Select Gender";
      data = [{ id: 'Male', name: 'Male' }, { id: 'Female', name: 'Female' }, { id: 'Other', name: 'Other' }];
      onSelect = (item) => handleChange('gender', item.id);
    } else if (modalType === 'kyc') {
      title = "Select Identity Proof";
      data = [
        { id: 'Aadhaar Card', name: 'Aadhaar Card' },
        { id: 'Voter ID', name: 'Voter ID' },
        { id: 'PAN Card', name: 'PAN Card' },
        { id: 'Driving License', name: 'Driving License' },
        { id: 'Passport', name: 'Passport' }
      ];
      onSelect = (item) => handleChange('kyc_type', item.id);
    } else if (modalType === 'tenant') {
      title = "Select Organization";
      data = tenants;
      onSelect = async (item) => {
        if (item.uuid) {
          await tenantService.selectTenant(item.uuid);
        }
        handleChange('tenant_id', item.id);
        setSelectedTenantName(item.name);
      };
    } else if (modalType === 'committee') {
      title = "Select Committee";
      data = committees;
      onSelect = (item) => {
        handleChange('committee_id', item.id);
        setSelectedCommitteeName(item.name);
        setModalSearchQuery('');
      };
    } else if (modalType === 'plan') {
      title = "Select Membership Plan";
      data = plans;
      onSelect = (item) => {
        handleChange('membership_plan_id', item.id);
        setSelectedPlanName(item.name);
      };
    } else if (modalType === 'state') {
      title = "Select State";
      data = states;
      onSelect = (item) => {
        handleChange('state_id', item.id);
        setSelectedStateName(item.name);
        fetchDistricts(item.id);
      };
    } else if (modalType === 'district') {
      title = "Select District";
      data = districts;
      onSelect = (item) => {
        handleChange('district_id', item.id);
        setSelectedDistrictName(item.name);
        fetchTalukas(item.id);
      };
    } else if (modalType === 'taluka') {
      title = "Select Taluka / Block";
      data = talukas;
      onSelect = (item) => {
        handleChange('taluka_id', item.id);
        setSelectedTalukaName(item.name);
        fetchVillages(item.id);
      };
    } else if (modalType === 'village') {
      title = "Select Village / City";
      data = villages;
      onSelect = (item) => {
        handleChange('village_id', item.id);
        setSelectedVillageName(item.name);
      };
    }

    const searchableData =
      modalType === 'committee' && modalSearchQuery.trim()
        ? data.filter((item) =>
            String(item.name || '').toLowerCase().includes(modalSearchQuery.trim().toLowerCase()),
          )
        : data;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => {
              setModalSearchQuery('');
              setModalType(null);
            }}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          {modalType === 'committee' && (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                placeholder="Search committee"
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
            </View>
          )}
          <FlatList
            data={searchableData}
            keyExtractor={(item) => (item.id || item.name).toString()}
            ListEmptyComponent={
              modalType === 'committee' ? (
                <View style={styles.emptySearchState}>
                  <Text style={styles.emptyText}>No committee found.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  onSelect(item);
                  setModalSearchQuery('');
                  setModalType(null);
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                {(formData.gender === item.id || formData.kyc_type === item.id || formData.tenant_id === item.id || formData.committee_id === item.id || formData.membership_plan_id === item.id || formData.state_id === item.id || formData.district_id === item.id || formData.taluka_id === item.id || formData.village_id === item.id) && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <View style={styles.formSection}>
              <SectionHeader title="Personal Information" step={1} subtitle="Create your secure identity profile." />
              <InputField
                name="full_name"
                icon="person-outline"
                label="Full Name (as per ID proof)"
                placeholder="Enter full name"
                value={formData.full_name}
                onChangeText={(val: string) => handleChange('full_name', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <InputField
                name="phone"
                icon="call-outline"
                label="Mobile Number"
                placeholder="+91"
                value={formData.phone}
                onChangeText={(val: string) => handleChange('phone', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                keyboardType="phone-pad"
              />
              <InputField
                name="email"
                icon="mail-outline"
                label="Email Id"
                placeholder="name@example.com"
                value={formData.email}
                onChangeText={(val: string) => handleChange('email', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                keyboardType="email-address"
              />
              <InputField
                name="date_of_birth"
                icon="calendar-outline"
                label="Date of Birth"
                placeholder="DD/MM/YYYY"
                value={formData.date_of_birth}
                onChangeText={(val: string) => handleChange('date_of_birth', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <PickerField
                label="Gender"
                icon="people-outline"
                value={formData.gender}
                onPress={() => setModalType('gender')}
                error={errors.gender}
              />
              <InputField
                name="parent_name"
                icon="people-circle-outline"
                label="Father's / Husband's Name"
                placeholder="Enter name"
                value={formData.parent_name}
                onChangeText={(val: string) => handleChange('parent_name', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <InputField
                name="password"
                icon="lock-closed-outline"
                label="Password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChangeText={(val: string) => handleChange('password', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? "visibility-off" : "visibility"}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
              <InputField
                name="confirmPassword"
                icon="lock-closed-outline"
                label="Confirm Password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChangeText={(val: string) => handleChange('confirmPassword', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? "visibility-off" : "visibility"}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </View>
          )}

          {/* Step 2: Identity KYC */}
          {step === 2 && (
            <View style={styles.formSection}>
              <SectionHeader title="Identity KYC Details" step={2} subtitle="Verify your identity with official documents." />
              <PickerField
                label="Primary Identity Proof"
                icon="card-outline"
                value={formData.kyc_type}
                onPress={() => setModalType('kyc')}
                error={errors.kyc_type}
              />
              
              <Text style={styles.label}>Upload Documents</Text>
              <TouchableOpacity 
                style={[
                  styles.uploadBox,
                  formData.kyc_front_url ? styles.uploadBoxSuccess : null,
                  errors.kyc_front_url ? styles.uploadBoxError : null,
                ]} 
                onPress={() => pickAndUploadImage('kyc_front_url')}
                disabled={!!uploading}
              >
                {uploading === 'kyc_front_url' ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons 
                      name={formData.kyc_front_url && formData.kyc_front_url !== 'mock_front.jpg' ? "checkmark-circle" : "cloud-upload-outline"} 
                      size={32} 
                      color={formData.kyc_front_url && formData.kyc_front_url !== 'mock_front.jpg' ? "#059669" : COLORS.primary} 
                    />
                    <Text style={styles.uploadTitle}>
                      {formData.kyc_front_url && formData.kyc_front_url !== 'mock_front.jpg' ? "Front Document Uploaded" : "Front Side Document"}
                    </Text>
                    <Text style={styles.uploadSubtitle}>Format: Image / PDF</Text>
                  </>
                )}
              </TouchableOpacity>
              {errors.kyc_front_url && <Text style={styles.errorText}>{errors.kyc_front_url}</Text>}

              <TouchableOpacity 
                style={[styles.uploadBox, formData.kyc_back_url ? styles.uploadBoxSuccess : null]} 
                onPress={() => pickAndUploadImage('kyc_back_url')}
                disabled={!!uploading}
              >
                {uploading === 'kyc_back_url' ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons 
                      name={formData.kyc_back_url && formData.kyc_back_url !== 'mock_back.jpg' ? "checkmark-circle" : "cloud-upload-outline"} 
                      size={32} 
                      color={formData.kyc_back_url && formData.kyc_back_url !== 'mock_back.jpg' ? "#059669" : COLORS.primary} 
                    />
                    <Text style={styles.uploadTitle}>
                      {formData.kyc_back_url && formData.kyc_back_url !== 'mock_back.jpg' ? "Back Document Uploaded" : "Back Side Document"}
                    </Text>
                    <Text style={styles.uploadSubtitle}>Optional if required (Format: Image / PDF)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Address Details */}
          {step === 3 && (
            <View style={styles.formSection}>
              <View style={styles.rowBetween}>
                <SectionHeader title="Address Details" step={3} />
                <TouchableOpacity onPress={() => setStep(4)} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subSectionTitle}>Permanent Address</Text>
              <InputField
                name="house_number"
                icon="home-outline"
                label="House / Flat Number"
                placeholder="Enter house no."
                value={formData.house_number}
                onChangeText={(val: string) => handleChange('house_number', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <InputField
                name="street_address"
                icon="location-outline"
                label="Street / Area"
                placeholder="Enter street"
                value={formData.street_address}
                onChangeText={(val: string) => handleChange('street_address', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <InputField
                name="village"
                icon="business-outline"
                label="Village / Locality"
                placeholder="Enter village"
                value={formData.village}
                onChangeText={(val: string) => handleChange('village', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <InputField
                name="landmark"
                icon="navigate-outline"
                label="Landmark"
                placeholder="Enter landmark"
                value={formData.landmark}
                onChangeText={(val: string) => handleChange('landmark', val)}
                errors={errors}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <InputField
                    name="pincode"
                    icon="pin-outline"
                    label="Pincode"
                    placeholder="6 digits"
                    value={formData.pincode}
                    onChangeText={(val: string) => handleChange('pincode', val)}
                    errors={errors}
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <InputField
                    name="state"
                    icon="map-outline"
                    label="State"
                    placeholder="Enter state"
                    value={formData.state}
                    onChangeText={(val: string) => handleChange('state', val)}
                    errors={errors}
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <InputField
                    name="district"
                    icon="locate-outline"
                    label="District"
                    placeholder="Enter district"
                    value={formData.district}
                    onChangeText={(val: string) => handleChange('district', val)}
                    errors={errors}
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <InputField
                    name="taluka"
                    icon="trail-sign-outline"
                    label="Taluka / Block"
                    placeholder="Enter taluka"
                    value={formData.taluka}
                    onChangeText={(val: string) => handleChange('taluka', val)}
                    errors={errors}
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                  />
                </View>
              </View>

              <View style={styles.checkboxRow}>
                <Switch
                  value={sameAsPermanent}
                  onValueChange={setSameAsPermanent}
                  trackColor={{ false: "#767577", true: COLORS.primary }}
                  thumbColor={sameAsPermanent ? "#fff" : "#f4f3f4"}
                />
                <Text style={styles.checkboxLabel}>Current Address is same as Permanent</Text>
              </View>

              {!sameAsPermanent && (
                <>
                  <Text style={styles.subSectionTitle}>Current Address</Text>
                  <InputField
                    name="current_street_address"
                    icon="location-outline"
                    label="Current Street / Area"
                    placeholder="Enter street"
                    value={formData.current_street_address}
                    onChangeText={(val: string) => handleChange('current_street_address', val)}
                    errors={errors}
                    focusedField={focusedField}
                    setFocusedField={setFocusedField}
                  />
                  {/* ... other current address fields could go here ... */}
                </>
              )}
            </View>
          )}

          {/* Step 4: Organization Mapping */}
          {step === 4 && (
            <View style={styles.formSection}>
              <View style={styles.rowBetween}>
                <SectionHeader title="Committee Management" step={4} subtitle="Select the committee you belong to." />
                <TouchableOpacity onPress={() => setStep(5)} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>

              <PickerField
                label="Committee Management"
                icon="people-circle-outline"
                value={selectedCommitteeName}
                onPress={() => {
                  if (!formData.tenant_id) Alert.alert("Select Organization First");
                  else setModalType('committee');
                }}
                error={errors.committee_id}
              />
              
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoBoxText}>
                  You can only select existing committees. New ones must be added by an administrator.
                </Text>
              </View>
            </View>
          )}

          {/* Step 5: Membership Plan */}
          {step === 5 && (
            <View style={styles.formSection}>
              <View style={styles.rowBetween}>
                <SectionHeader title="Membership Plan" step={5} subtitle="Choose a plan that fits your needs." />
                <TouchableOpacity onPress={handleRegister} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>

              {plans.length > 0 ? (
                plans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      formData.membership_plan_id === plan.id && styles.planCardSelected
                    ]}
                    onPress={() => {
                      handleChange('membership_plan_id', plan.id);
                      setSelectedPlanName(plan.name);
                    }}
                  >
                    <View style={styles.planHeader}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>₹{plan.price}/{plan.period}</Text>
                    </View>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                    {formData.membership_plan_id === plan.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} style={styles.planCheck} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyPlans}>
                   <Text style={styles.emptyText}>No special plans available for this organization. You will be registered as a free member.</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            {step > 1 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 5 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Text style={styles.nextBtnText}>Complete Registration</Text>
                    <MaterialIcons name="check" size={18} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomNav}>
             <Text style={styles.alreadyText}>Already have an account? </Text>
             <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Sign In</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!modalType} animationType="fade" transparent={true}>
        {renderModalContent()}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  formSection: { 
    padding: 24, 
    backgroundColor: COLORS.white, 
    margin: 16, 
    borderRadius: 16, 
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
    })
  },
  sectionHeaderContainer: { marginBottom: 24 },
  stepBadge: { backgroundColor: COLORS.primaryContainer, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  stepBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  sectionSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  progressBarBg: { height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginTop: 16 },
  progressBarFilled: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 52 },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputWrapperError: { borderColor: COLORS.error },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },
  
  pickerText: { flex: 1, fontSize: 16, color: COLORS.text },
  
  uploadBox: { borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: COLORS.primaryContainer },
  uploadBoxSuccess: { borderStyle: 'solid', borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  uploadBoxError: { borderColor: COLORS.error, backgroundColor: '#fef2f2' },
  uploadTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  uploadSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subSectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginVertical: 16 },
  skipBtn: { padding: 4 },
  skipText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  checkboxLabel: { marginLeft: 12, fontSize: 14, color: COLORS.textSecondary },
  
  infoBox: { flexDirection: 'row', backgroundColor: COLORS.primaryContainer, padding: 16, borderRadius: 12, marginTop: 8 },
  infoBoxText: { flex: 1, marginLeft: 12, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  
  planCard: { padding: 20, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginBottom: 16, backgroundColor: COLORS.white },
  planCardSelected: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.primaryContainer },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  planPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  planDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  planCheck: { position: 'absolute', top: 12, right: 12 },
  emptyPlans: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, lineHeight: 22 },

  footerActions: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8, gap: 12 },
  backBtn: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  backBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  nextBtn: { flex: 2, height: 56, borderRadius: 16, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  alreadyText: { color: COLORS.textSecondary, fontSize: 15 },
  loginText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    maxHeight: height * 0.7,
    ...Platform.select({
      web: { boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)' }
    })
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, backgroundColor: COLORS.bg },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: COLORS.text, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  emptySearchState: { paddingVertical: 24, alignItems: 'center' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listItemText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
});

export default RegisterScreen;
