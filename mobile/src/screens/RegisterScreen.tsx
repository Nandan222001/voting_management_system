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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import RazorpayCheckout from 'react-native-razorpay';
import DatePicker from 'react-native-date-picker';
import { showToast } from '../utils/toast';
import { paymentService, createRegistrationOrder } from '../services/paymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTenantID, BASE_URL } from '../services/api';

import Header from '../components/common/Header';
import { hs, vs, ms, hp } from '../utils/responsive';

const { height } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
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
      <Ionicons name={icon} size={ms(18)} color={COLORS.textSecondary} style={styles.inputIcon} />
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
          <MaterialIcons name={rightIcon} size={ms(20)} color="#64748b" />
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
      <Ionicons name={icon} size={ms(18)} color={COLORS.textSecondary} style={styles.inputIcon} />
      <Text style={[styles.pickerText, !value && { color: '#9ca3af' }]}>
        {value || `Select ${label}`}
      </Text>
      <MaterialIcons name="arrow-drop-down" size={ms(24)} color="#94a3b8" />
    </TouchableOpacity>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const SectionHeader = ({ title, step, subtitle, onSkip }: any) => (
  <View style={styles.sectionHeaderContainer}>
    <View style={[styles.rowBetween, { alignItems: 'center', marginBottom: vs(8) }]}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>Step {step} of 5</Text>
      </View>
      {onSkip && (
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFilled, { width: `${(step / 5) * 100}%` }]} />
    </View>
  </View>
);

const getTargetLabel = (target: any) => {
  if (!target) return '';
  const type = target.type?.toLowerCase();
  if (type === 'country') return 'Working Committee';
  if (type === 'state') return `${target.name} Pradesh Committee`;
  if (type === 'district') return `${target.name} District`;
  if (type === 'block') return `${target.name} Block Committee`;
  if (type === 'booth') return `${target.name} Booth Committee`;
  return target.name;
};

// --- RAZORPAY HELPERS ---

type RazorpayCheckoutOptions = {
  description: string;
  image: string;
  currency: string;
  key: string;
  amount: number;
  name: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
    name: string;
  };
  theme: { color: string };
};

type RazorpayCheckoutResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const loadRazorpayWebCheckout = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Razorpay web checkout is not available in this runtime.'));
  }
  if ((window as any).Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Could not load Razorpay checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
    document.body.appendChild(script);
  });
};

const openRazorpayCheckout = async (
  options: RazorpayCheckoutOptions,
): Promise<RazorpayCheckoutResult> => {
  if (Platform.OS === 'web') {
    await loadRazorpayWebCheckout();

    return new Promise((resolve, reject) => {
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        reject(new Error('Razorpay checkout failed to initialize.'));
        return;
      }

      const checkout = new Razorpay({
        ...options,
        handler: resolve,
        modal: {
          ondismiss: () => reject({ code: 2, description: 'Payment cancelled.' }),
        },
      });
      checkout.open();
    });
  }

  const razorpayModule = require('react-native-razorpay');
  const RazorpayCheckout = razorpayModule.default || razorpayModule;
  return RazorpayCheckout.open(options);
};

// --- MAIN COMPONENT ---

const RegisterScreen = ({ navigation }: any) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    voter_id: '',
    designation: '',

    // Step 3
    house_number: '',
    street_address: '',
    village: '',
    landmark: '',
    pincode: '',
    state: '',
    district: '',
    taluka: '',

    current_street_address: '',
    current_city: '',
    current_district: '',
    current_state: '',
    current_pincode: '',

    // Step 4
    tenant_id: null as number | null,
    target_id: null as number | null,
    committee_id: null as number | null,
    state_id: null as number | null,
    district_id: null as number | null,
    taluka_id: null as number | null,
    village_id: null as number | null,

    // Step 5
    membership_plan_id: null as number | null,
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
  };

  // ... (maintain other states and effects)

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
  const [regTargets, setRegTargets] = useState<any[]>([]);

  const [selectedTenantName, setSelectedTenantName] = useState('');
  const [selectedCommitteeName, setSelectedCommitteeName] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedTalukaName, setSelectedTalukaName] = useState('');
  const [selectedVillageName, setSelectedVillageName] = useState('');

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
      // Prioritize tenant from env var for fixed organization flow
      const envTenantId = process.env.EXPO_PUBLIC_TENANT_ID;
      
      if (envTenantId && envTenantId !== 'undefined') {
        console.log(`[Register] Using environment Tenant ID: ${envTenantId}`);
        await tenantService.selectTenant(envTenantId);
      } else {
        console.warn('[Register] EXPO_PUBLIC_TENANT_ID is missing or undefined. Falling back to public tenant discovery.');
      }

      // 1. Fetch current tenant details based on ID/UUID in header
      const tenant = await tenantService.getCurrentTenant();

      if (tenant) {
        setCurrentTenant(tenant);
        setFormData(prev => ({ ...prev, tenant_id: tenant.id }));
        setSelectedTenantName(tenant.name);

        // 2. Fetch specific data for this tenant (Committees, Plans, Targets)
        if (step === 4) {
           fetchTenantSpecificData();
        }

        // 3. Fetch states
        const statesData = await tenantService.getPublicTargets(undefined, 'state');
        setStates(statesData);
      } else {
        // Fallback: If no tenant is resolved, fetch all public tenants
        fetchTenants();
        fetchStates();
      }
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
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setUploading(field);
      try {
        const asset = result.assets[0];
        const uri = asset.uri;
        if (!uri) return;
        
        const fileName = asset.fileName || `${field}.jpg`;
        const fileType = asset.type || 'image/jpeg';

        let uploadedUrl = '';
        try {
          // Attempt 1: Standard Upload
          uploadedUrl = await mediaService.uploadFile(uri, fileName, fileType);
        } catch (firstError: any) {
          console.warn('Primary upload failed, trying fallback...', firstError);
          // Attempt 2: Fallback to nomination upload (different backend path)
          uploadedUrl = await mediaService.uploadNominationDocument(uri, fileName, fileType);
        }

        handleChange(field, uploadedUrl);
      } catch (error: any) {
        console.error('Final upload error:', error);
        const errorMsg = error.response?.data?.detail || error.message || 'Could not upload the image.';
        Alert.alert('Upload Failed', `${errorMsg}. Please try again.`);
      } finally {
        setUploading(null);
      }
    }
  };

  useEffect(() => {
    if (step === 4) {
      fetchTenantSpecificData();
    }
  }, [step]);

  const fetchTenants = async () => {
    try {
      const data = await tenantService.getPublicTenants();
      setTenants(data);
      
      // Auto-select if only one tenant exists OR if none is selected yet as a fallback
      if (data.length > 0 && !formData.tenant_id) {
        const primaryTenant = data[0];
        console.log(`[Register] Auto-selecting tenant: ${primaryTenant.name} (${primaryTenant.uuid})`);
        await tenantService.selectTenant(primaryTenant.uuid || String(primaryTenant.id));
        setFormData(prev => ({ ...prev, tenant_id: primaryTenant.id }));
        setSelectedTenantName(primaryTenant.name);
        setCurrentTenant(primaryTenant);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    }
  };

  const DEFAULT_PLANS = [
    { id: 'plan_annual', name: 'Annual Fee', price: 50, period: 'year', description: 'Annual membership valid for 1 year.' },
    { id: 'plan_active', name: 'Active (3 Yrs)', price: 500, period: '3 years', description: 'Active membership valid for 3 years.' },
    { id: 'plan_life', name: 'Life Membership', price: 10000, period: 'lifetime', description: 'One-time lifetime membership.' },
  ];

  const fetchTenantSpecificData = async () => {
    try {
      const commData = await tenantService.getPublicCommittees();
      setCommittees(commData);
      
      const planData = await tenantService.getPublicPlans();
      if (planData && planData.length > 0) {
        setPlans(planData);
      }

      // Load targets for Step 4 (Constituency / Committee)
      const targetData = await tenantService.getPublicTargets();
      setRegTargets(targetData);
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
    
    // Full Name
    if (!formData.full_name?.trim()) newErrors.full_name = 'Full Name is required';
    
    // Mobile Number: Exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Mobile Number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }

    // Email: Regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.date_of_birth?.trim()) newErrors.date_of_birth = 'Date of Birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Show the first error in a toast
      const firstError = Object.values(newErrors)[0];
      showToast.error('Validation Error', firstError);
      return false;
    }
    
    return true;
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

  const validateStep3 = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.house_number?.trim()) newErrors.house_number = 'House Number is required';
    if (!formData.street_address?.trim()) newErrors.street_address = 'Street Address is required';
    if (!formData.village?.trim()) newErrors.village = 'Village / Locality is required';
    if (!formData.pincode?.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.district?.trim()) newErrors.district = 'District is required';
    if (!formData.taluka?.trim()) newErrors.taluka = 'Taluka is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.target_id) {
      newErrors.target_id = 'Please select a constituency / committee';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4 && validateStep4()) setStep(5);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCompleteRegistration = async (isSkippingPlan: boolean = false) => {
    setLoading(true);
    try {
      const submissionData = { ...formData };
      if (isSkippingPlan) submissionData.membership_plan_id = null;

      if (sameAsPermanent) {
        submissionData.current_street_address = formData.street_address;
        submissionData.current_city = formData.village || '';
        submissionData.current_district = formData.district;
        submissionData.current_state = formData.state;
        submissionData.current_pincode = formData.pincode;
      }

      const target_id = formData.target_id || formData.village_id || formData.taluka_id || formData.district_id || formData.state_id;
      (submissionData as any).target_id = target_id;
      
      // 1. Conditional Payment Logic
      if (submissionData.membership_plan_id) {
        const selectedPlan = plans.find(p => p.id === submissionData.membership_plan_id);
        
        if (selectedPlan && selectedPlan.price > 0) {
          // A. Create Razorpay Order via backend (Public endpoint)
          const order = await createRegistrationOrder(submissionData.tenant_id, submissionData.membership_plan_id);
          
          // B. Open Razorpay Checkout using the cross-platform helper
          const options: RazorpayCheckoutOptions = {
            description: `Registration: ${selectedPlan?.name}`,
            image: currentTenant?.logo_url || '',
            currency: order.currency,
            key: order.key_id,
            amount: order.amount,
            name: currentTenant?.name || 'Digital Voting System',
            order_id: order.razorpay_order_id,
            prefill: {
              email: submissionData.email,
              contact: submissionData.phone,
              name: submissionData.full_name
            },
            theme: { color: COLORS.primary }
          };

          try {
            const success = await openRazorpayCheckout(options);
            
            // C. Add payment signatures to registration data
            submissionData.razorpay_order_id = success.razorpay_order_id;
            submissionData.razorpay_payment_id = success.razorpay_payment_id;
            submissionData.razorpay_signature = success.razorpay_signature;
            
            showToast.info('Payment Verified', 'Finalizing your registration...');
          } catch (paymentError: any) {
             const errorDesc = paymentError?.description || 'Payment cancelled or failed';
             Alert.alert('Payment Error', `${errorDesc}. You can skip for now or try again.`);
             setLoading(false);
             return; // Stop registration
          }
        }
      }

      // 2. Final Registration API Call (Now contains payment signatures if applicable)
      await register(submissionData);

      // 3. Success Navigation
      showToast.success('Registration Successful', 'Welcome! Please sign in with your credentials.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      
    } catch (error: any) {
      console.error('Full Registration Error:', error);
      const detail = error.response?.data?.detail || error.message || 'An unexpected error occurred during registration.';
      showToast.error('Registration Failed', detail);
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
        if (item.id) {
          await tenantService.selectTenant(String(item.id));
        }
        handleChange('tenant_id', item.id);
        setSelectedTenantName(item.name);
      };
    } else if (modalType === 'committee') {
      title = "Select Constituency / Committee";
      data = committees.length > 0 ? committees : regTargets;
      onSelect = (item) => {
        handleChange('target_id', item.id);
        setSelectedCommitteeName(item.name || getTargetLabel(item));
        setModalSearchQuery('');
        
        // If the committee response contains plans, map them to the plans state
        if (item.plans && Array.isArray(item.plans) && item.plans.length > 0) {
          setPlans(item.plans);
        }
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
            getTargetLabel(item).toLowerCase().includes(modalSearchQuery.trim().toLowerCase()),
          )
        : data;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalDismissArea} 
          activeOpacity={1} 
          onPress={() => {
            setModalSearchQuery('');
            setModalType(null);
          }} 
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => {
                setModalSearchQuery('');
                setModalType(null);
              }}>
              <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {modalType === 'committee' && (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                placeholder="Search by name..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
              {modalSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                  <MaterialIcons name="cancel" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          )}

          <FlatList
            data={searchableData}
            keyExtractor={(item) => (item.id || item.name).toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              modalType === 'committee' ? (
                <View style={styles.emptySearchState}>
                  <Ionicons name="search-outline" size={48} color="#e2e8f0" />
                  <Text style={styles.emptyText}>No committees found matching your search.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = 
                formData.gender === item.id || 
                formData.kyc_type === item.id || 
                formData.tenant_id === item.id || 
                formData.committee_id === item.id || 
                formData.membership_plan_id === item.id || 
                formData.state_id === item.id || 
                formData.district_id === item.id || 
                formData.taluka_id === item.id || 
                formData.village_id === item.id || 
                formData.target_id === item.id;

              return (
                <TouchableOpacity
                  style={[styles.listItem, isSelected && styles.listItemActive]}
                  onPress={() => {
                    onSelect(item);
                    setModalSearchQuery('');
                    setModalType(null);
                  }}
                >
                  <View style={[styles.listIconBox, isSelected && styles.listIconBoxActive]}>
                    <Ionicons 
                      name={modalType === 'committee' ? "business" : "radio-button-off"} 
                      size={18} 
                      color={isSelected ? COLORS.primary : COLORS.textSecondary} 
                    />
                  </View>
                  <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>
                    {modalType === 'committee' ? getTargetLabel(item) : item.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        showBack 
        onBack={() => navigation.goBack()} 
        title="Account Setup"
      />
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
              <PickerField
                label="Date of Birth"
                icon="calendar-outline"
                value={formData.date_of_birth}
                onPress={() => setShowDatePicker(true)}
                error={errors.date_of_birth}
              />
              <DatePicker
                modal
                open={showDatePicker}
                date={formData.date_of_birth ? (function() {
                  const parts = formData.date_of_birth.split('/');
                  if (parts.length === 3) {
                    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    return isNaN(d.getTime()) ? new Date() : d;
                  }
                  return new Date();
                })() : new Date()}
                mode="date"
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  handleChange('date_of_birth', formatDate(date));
                }}
                onCancel={() => {
                  setShowDatePicker(false);
                }}
                maximumDate={new Date()}
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
              <SectionHeader title="Address Details" step={3} onSkip={() => setStep(4)} />

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
                    label="Full Current Address"
                    placeholder="Enter Full Address"
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
              <SectionHeader
                title="Constituency Mapping"
                step={4}
                subtitle="Select the constituency or committee you belong to."
                onSkip={() => setStep(5)}
              />

              <PickerField
                label="Constituency / Committee"
                icon="people-circle-outline"
                value={selectedCommitteeName}
                onPress={() => {
                  setModalType('committee');
                }}
                error={errors.committee_id || errors.target_id}
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
              <SectionHeader
                title="Membership Plan"
                step={5}
                subtitle="Choose a plan that fits your needs."
                onSkip={() => handleCompleteRegistration(true)}
              />

              {Array.isArray(plans) && plans.length > 0 ? (
                <View style={styles.plansContainer}>
                  {plans.map((plan) => {
                    if (!plan) return null;
                    const isSelected = formData.membership_plan_id === plan.id;
                    return (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.planCard,
                          isSelected && styles.planCardSelected
                        ]}
                        onPress={() => {
                          handleChange('membership_plan_id', plan.id);
                          setSelectedPlanName(plan.name);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.planCardContent}>
                          <View style={styles.planCardLeft}>
                             <View style={[styles.planIconCircle, isSelected && styles.planIconCircleActive]}>
                                <FontAwesome5 
                                  name="crown" 
                                  size={16} 
                                  color={isSelected ? COLORS.white : COLORS.primary} 
                                />
                             </View>
                             <View style={styles.planCardInfo}>
                                <Text style={[styles.planName, isSelected && styles.planNameSelected]}>{plan.name}</Text>
                                <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
                             </View>
                          </View>
                          
                          <View style={styles.planCardRight}>
                             <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                               ₹{Number(plan.price).toLocaleString('en-IN')}
                             </Text>
                             <View style={[styles.planSelectionCircle, isSelected && styles.planSelectionCircleActive]}>
                                {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                             </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyPlans}>
                   <Ionicons name="information-circle-outline" size={48} color={COLORS.border} />
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
                onPress={() => handleCompleteRegistration(false)}
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
  scrollContent: { paddingBottom: vs(40) },
  formSection: { 
    padding: hs(24), 
    backgroundColor: COLORS.white, 
    margin: hs(16), 
    borderRadius: ms(16), 
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
    })
  },
  sectionHeaderContainer: { marginBottom: vs(24) },
  stepBadge: { backgroundColor: COLORS.primaryContainer, alignSelf: 'flex-start', paddingHorizontal: hs(12), paddingVertical: vs(4), borderRadius: ms(12), marginBottom: vs(8) },
  stepBadgeText: { color: COLORS.primary, fontSize: ms(12), fontWeight: '700' },
  sectionTitle: { fontSize: ms(22), fontWeight: '700', color: COLORS.text, lineHeight: vs(28) },
  sectionSubtitle: { fontSize: ms(13), color: COLORS.textSecondary, marginTop: vs(4), lineHeight: vs(18) },
  progressBarBg: { height: vs(4), backgroundColor: '#e2e8f0', borderRadius: ms(2), marginTop: vs(12) },
  progressBarFilled: { height: vs(4), backgroundColor: COLORS.primary, borderRadius: ms(2) },
  
  inputGroup: { marginBottom: vs(16) },
  label: { fontSize: ms(13), fontWeight: '600', color: COLORS.text, marginBottom: vs(6) },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: ms(12), paddingHorizontal: hs(16), height: vs(50) },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputWrapperError: { borderColor: COLORS.error },
  inputIcon: { marginRight: hs(12) },
  input: { flex: 1, fontSize: ms(15), color: COLORS.text, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  errorText: { color: COLORS.error, fontSize: ms(11), marginTop: vs(2) },
  
  pickerText: { flex: 1, fontSize: ms(15), color: COLORS.text },
  
  uploadBox: { borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: ms(12), padding: ms(20), alignItems: 'center', marginBottom: vs(16), backgroundColor: COLORS.primaryContainer },
  uploadBoxSuccess: { borderStyle: 'solid', borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  uploadBoxError: { borderColor: COLORS.error, backgroundColor: '#fef2f2' },
  uploadTitle: { fontSize: ms(15), fontWeight: '600', color: COLORS.text, marginTop: vs(10) },
  uploadSubtitle: { fontSize: ms(11), color: COLORS.textSecondary, marginTop: vs(2) },
  
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subSectionTitle: { fontSize: ms(16), fontWeight: '700', color: COLORS.text, marginVertical: vs(12) },
  skipBtn: { paddingVertical: vs(6), paddingHorizontal: hs(12), backgroundColor: COLORS.primaryContainer, borderRadius: ms(8) },
  skipText: { color: COLORS.primary, fontWeight: '700', fontSize: ms(12), textTransform: 'uppercase' },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: vs(16) },
  checkboxLabel: { marginLeft: hs(12), fontSize: ms(14), color: COLORS.textSecondary },
  
  infoBox: { flexDirection: 'row', backgroundColor: COLORS.primaryContainer, padding: hs(16), borderRadius: ms(12), marginTop: vs(8) },
  infoBoxText: { flex: 1, marginLeft: hs(12), fontSize: ms(12), color: COLORS.primary, lineHeight: vs(18) },
  
  planCard: { 
    padding: hs(16), 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    borderRadius: ms(20), 
    marginBottom: vs(12), 
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  planCardSelected: { 
    borderColor: COLORS.primary, 
    backgroundColor: COLORS.primaryContainer 
  },
  planCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: hs(12),
  },
  planIconCircle: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hs(14),
  },
  planIconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  planCardInfo: {
    flex: 1,
  },
  planName: { fontSize: ms(16), fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  planNameSelected: { color: COLORS.primary },
  planPrice: { fontSize: ms(18), fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  planPriceSelected: { color: COLORS.primary },
  planDesc: { fontSize: ms(12), color: COLORS.textSecondary, marginTop: vs(2), lineHeight: vs(16) },
  planCardRight: {
    alignItems: 'flex-end',
    gap: vs(8),
  },
  planSelectionCircle: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  planSelectionCircleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  emptyPlans: { padding: hs(40), alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, lineHeight: vs(22), marginTop: vs(12) },

  footerActions: { flexDirection: 'row', paddingHorizontal: hs(16), marginTop: vs(8), gap: hs(12) },
  backBtn: { flex: 1, height: vs(56), borderRadius: ms(16), borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  backBtnText: { fontSize: ms(16), fontWeight: '600', color: COLORS.textSecondary },
  nextBtn: { flex: 2, height: vs(56), borderRadius: ms(16), backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: hs(8) },
  nextBtnText: { fontSize: ms(16), fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'center', marginTop: vs(32) },
  alreadyText: { color: COLORS.textSecondary, fontSize: ms(15) },
  loginText: { color: COLORS.primary, fontWeight: '700', fontSize: ms(15) },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalContent: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: ms(32), 
    borderTopRightRadius: ms(32), 
    padding: hs(24), 
    paddingTop: vs(8),
    maxHeight: hp(80),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 },
      web: { boxShadow: '0px -10px 40px rgba(0, 0, 0, 0.1)' }
    })
  },
  modalHandle: {
    width: hs(40),
    height: vs(5),
    backgroundColor: '#e2e8f0',
    borderRadius: ms(3),
    alignSelf: 'center',
    marginVertical: vs(12),
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(20) },
  modalTitle: { fontSize: ms(20), fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  modalCloseBtn: { padding: ms(8), backgroundColor: COLORS.bg, borderRadius: ms(12) },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: ms(16), paddingHorizontal: hs(16), marginBottom: vs(16), height: vs(52), borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { marginRight: hs(12) },
  searchInput: { flex: 1, height: vs(48), fontSize: ms(15), color: COLORS.text, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  emptySearchState: { paddingVertical: vs(40), alignItems: 'center' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(14), paddingHorizontal: hs(16), borderRadius: ms(16), marginBottom: vs(4) },
  listItemActive: { backgroundColor: COLORS.primaryContainer },
  listIconBox: { width: ms(36), height: ms(36), borderRadius: ms(10), backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginRight: hs(16) },
  listIconBoxActive: { backgroundColor: COLORS.white },
  listItemText: { flex: 1, fontSize: ms(16), color: COLORS.text, fontWeight: '500' },
  listItemTextActive: { color: COLORS.primary, fontWeight: '700' },
});

export default RegisterScreen;
