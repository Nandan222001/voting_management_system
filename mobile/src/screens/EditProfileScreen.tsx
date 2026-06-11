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
  useWindowDimensions,
} from 'react-native';
import { tenantService } from '../services/tenantService';
import { mediaService } from '../services/mediaService';
import { planService } from '../services/planService';
import { paymentService } from '../services/paymentService';
import { openRazorpayCheckout } from '../utils/payment';
import { useAuth } from '../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';
import { hs, vs, ms, hp } from '../utils/responsive';

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
  focusedField,
  setFocusedField,
  errors = {},
  onChangeText,
  editable = true,
}: any) => {
  const fieldError = (name && errors && typeof errors === 'object') ? errors[name] : null;
  const hasError = Boolean(fieldError);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          (name && focusedField === name) && styles.inputWrapperFocused,
          hasError && styles.inputWrapperError,
          !editable && { backgroundColor: '#f1f5f9' }
        ]}>
        <Ionicons name={icon} size={ms(18)} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            if (name && setFocusedField) setFocusedField(name);
          }}
          onBlur={() => {
            if (setFocusedField) setFocusedField(null);
          }}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          editable={editable}
        />
      </View>
      {hasError && <Text style={styles.errorText}>{fieldError}</Text>}
    </View>
  );
};

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

const SectionHeader = ({ title, step, subtitle }: any) => (
  <View style={styles.sectionHeaderContainer}>
    <View style={styles.stepBadge}>
      <Text style={styles.stepBadgeText}>Step {step} of 4</Text>
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFilled, { width: `${(step / 4) * 100}%` }]} />
    </View>
  </View>
);

// --- MAIN COMPONENT ---

const EditProfileScreen = ({ navigation }: any) => {
  const { user, updateProfile } = useAuth();
  const { height } = useWindowDimensions();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
  };

  // Data States
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    parent_name: user?.parent_name || '',
    voter_id: user?.voter_id || '',
    designation: user?.designation || '',
    image_url: user?.image_url || '',
    house_number: user?.house_number || '',
    street_address: user?.street_address || '',
    village: user?.village || '',
    landmark: user?.landmark || '',
    pincode: user?.pincode || '',
    state: user?.state || '',
    district: user?.district || '',
    taluka: user?.taluka || '',
    current_street_address: user?.current_street_address || '',
    current_city: user?.current_city || '',
    current_district: user?.current_district || '',
    current_state: user?.current_state || '',
    current_pincode: user?.current_pincode || '',
    tenant_id: user?.tenant_id || null,
    target_id: user?.target_id || null,
    committee_id: user?.committee_id || null,
    membership_plan_id: user?.membership_plan_id || null,
  });

  const [sameAsPermanent, setSameAsPermanent] = useState(true);
  const [committees, setCommittees] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchingCommittees, setFetchingCommittees] = useState(false);
  const [selectedCommitteeName, setSelectedCommitteeName] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (modalType) setModalSearchQuery('');
  }, [modalType]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        parent_name: user.parent_name || '',
        voter_id: user.voter_id || '',
        designation: user.designation || '',
        house_number: user.house_number || '',
        street_address: user.street_address || '',
        village: user.village || '',
        landmark: user.landmark || '',
        pincode: user.pincode || '',
        state: user.state || '',
        district: user.district || '',
        taluka: user.taluka || '',
        current_street_address: user.current_street_address || '',
        current_city: user.current_city || '',
        current_district: user.current_district || '',
        current_state: user.current_state || '',
        current_pincode: user.current_pincode || '',
        tenant_id: user.tenant_id || null,
        target_id: user.target_id || null,
        committee_id: user.committee_id || null,
        membership_plan_id: user.membership_plan_id || null,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchDynamicData();
  }, []);

  const fetchDynamicData = async () => {
    setFetchingCommittees(true);
    try {
      const targetData = await tenantService.getPublicTargets();
      setCommittees(targetData);
      const planData = await planService.getPublicPlans();
      const planItems = (planData?.items ?? planData) || [];
      setPlans(planItems);
      if (user?.target_id) {
        const target = targetData.find((t: any) => t.id === user.target_id);
        if (target) setSelectedCommitteeName(target.name);
      }
      if (user?.membership_plan_id) {
        const p = planItems.find((p: any) => p.id === user.membership_plan_id);
        if (p) setSelectedPlanName(p.name);
      }
    } catch (error) {
      console.error('Failed to fetch dynamic dropdown data:', error);
      showToast.error('Fetch Error', 'Failed to load committees or plans.');
    } finally {
      setFetchingCommittees(false);
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
    if (!formData.full_name?.trim()) newErrors.full_name = 'Full Name is required';
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Mobile Number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.date_of_birth?.trim()) newErrors.date_of_birth = 'Date of Birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.parent_name?.trim()) newErrors.parent_name = "Father's / Husband's Name is required";
    if (!formData.voter_id?.trim()) newErrors.voter_id = 'Voter ID / Member ID is required';
    if (!formData.designation?.trim()) newErrors.designation = 'Designation is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showToast.error('Validation Error', firstError);
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    let newErrors: Record<string, string> = {};
    if (!formData.target_id) newErrors.target_id = 'Committee is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast.error('Validation Error', 'Please select a committee.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (validateStep3()) setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleUpdate = async () => {
    if (!validateStep1() || !validateStep3()) {
      if (!validateStep1()) setStep(1);
      else if (!validateStep3()) setStep(3);
      return;
    }
    setLoading(true);
    try {
      const updateData = { ...formData };
      if (sameAsPermanent) {
        updateData.current_street_address = formData.street_address;
        updateData.current_city = formData.village || '';
        updateData.current_district = formData.district;
        updateData.current_state = formData.state;
        updateData.current_pincode = formData.pincode;
      }
      const hasPlanChanged = formData.membership_plan_id !== user?.membership_plan_id;
      if (hasPlanChanged) {
        setLoading(false);
        const targetPlan = plans.find(p => p.id === formData.membership_plan_id);
        const planName = targetPlan?.name || "Membership Plan";
        Alert.alert(
          'Payment Required',
          `You have selected the "${planName}" plan. Payment is required to update your membership. Would you like to proceed to payment?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Pay Now', onPress: () => handlePlanUpdateWithPayment(updateData) }
          ]
        );
        return;
      }
      await updateProfile(updateData);
      showToast.success('Success', 'Profile updated successfully.');
      navigation.navigate('ProfileMain');
    } catch (error: any) {
      console.error('Profile update failed:', error);
      let errorMessage = 'An error occurred while updating your profile.';
      if (error.response?.data?.detail) errorMessage = error.response.data.detail;
      else if (error.message) errorMessage = error.message;
      showToast.error('Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdateWithPayment = async (updateData: any) => {
    const membershipPlanId = updateData.membership_plan_id;
    const originalPlanId = user?.membership_plan_id;
    setIsProcessingPayment(true);
    
    try {
      // 1. Update the profile with the new plan ID so the backend allows order creation
      await updateProfile({ membership_plan_id: membershipPlanId });

      // 2. Create Order
      const targetPlan = plans.find(p => p.id === membershipPlanId);
      const planName = targetPlan?.name || "Membership Plan";
      const orderResponse = await paymentService.createMembershipOrder(membershipPlanId);
      
      const options = {
        description: `${planName} Activation`,
        image: 'https://ui-avatars.com/api/?name=Voting+System&background=003d9b&color=fff',
        currency: orderResponse.currency,
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        name: 'Digital Voting System',
        order_id: orderResponse.razorpay_order_id || (orderResponse as any).order_id,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.full_name || ''
        },
        theme: { color: COLORS.primary }
      };

      try {
        // 3. Open Checkout
        const data = await openRazorpayCheckout(options);
        
        // 4. Verify Payment
        await paymentService.verifyPayment({
          razorpay_order_id: data.razorpay_order_id || orderResponse.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        });

        // 5. Update Profile with full data and Payment Details
        const finalUpdateData = {
          ...updateData,
          razorpay_order_id: data.razorpay_order_id || orderResponse.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        };

        await updateProfile(finalUpdateData);
        showToast.success("Success", "Plan updated and profile saved successfully!");
        navigation.navigate('ProfileMain');
      } catch (error: any) {
        console.error('Payment checkout/verification failed:', error);
        
        // REVERT: If payment failed, change the plan back to the original
        if (originalPlanId !== undefined) {
          try {
            await updateProfile({ membership_plan_id: originalPlanId });
          } catch (revertErr) {
            console.error('Failed to revert plan ID:', revertErr);
          }
        }

        try {
          await paymentService.recordPaymentFailure({
            membership_plan_id: membershipPlanId,
            error_message: error.description || error.message || "Payment cancelled or failed",
            razorpay_order_id: error.metadata?.order_id || orderResponse.razorpay_order_id
          });
        } catch (failErr) { console.error('Failed to record failure:', failErr); }
        
        if (error.code === 2) {
          showToast.info("Payment Cancelled", "Membership update requires payment. Your plan was not changed.");
        } else {
          showToast.error("Payment Failed", error.description || "The transaction could not be completed.");
        }
      }
    } catch (error: any) {
      console.error('Plan update initialization failed:', error);
      
      // REVERT: If we couldn't even create the order, ensure the plan is back to original
      if (originalPlanId !== undefined) {
        try {
          await updateProfile({ membership_plan_id: originalPlanId });
        } catch (revertErr) { /* ignore */ }
      }

      showToast.error("System Error", error.response?.data?.detail || error.message || "Could not initialize payment flow.");
    } finally {
      setIsProcessingPayment(false);
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
    } else if (modalType === 'committee') {
      title = "Select Committee";
      data = committees;
      onSelect = (item) => {
        handleChange('target_id', item.id);
        setSelectedCommitteeName(item.name);
      };
    } else if (modalType === 'plan') {
      title = "Select Membership Plan";
      data = plans;
      onSelect = (item) => {
        handleChange('membership_plan_id', item.id);
        setSelectedPlanName(item.name);
      };
    }
    const searchableData = 
      modalType === 'committee' && modalSearchQuery.trim()
        ? data.filter((item) => item.name.toLowerCase().includes(modalSearchQuery.trim().toLowerCase()))
        : data;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={() => { setModalSearchQuery(''); setModalType(null); }} />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setModalSearchQuery(''); setModalType(null); }}>
              <MaterialIcons name="close" size={ms(20)} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {modalType === 'committee' && (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={ms(18)} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                placeholder="Search by name..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
              {modalSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                  <MaterialIcons name="cancel" size={ms(18)} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          )}
          <FlatList
            data={searchableData}
            keyExtractor={(item) => (item.id || item.name).toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: vs(20) }}
            ListEmptyComponent={
              modalType === 'committee' ? (
                <View style={styles.emptySearchState}>
                  <Ionicons name="search-outline" size={ms(48)} color="#e2e8f0" />
                  <Text style={styles.emptyText}>No results found.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected = formData.gender === item.id || formData.target_id === item.id || formData.membership_plan_id === item.id;
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
                    <Ionicons name={modalType === 'committee' ? "business" : "radio-button-off"} size={ms(18)} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>{item.name}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={ms(22)} color={COLORS.primary} />}
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
        title="Edit Profile" 
        showBack 
        onBack={() => navigation.goBack()} 
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#003d9b', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroHeader}>
            <View style={styles.heroContent}>
               <View style={styles.heroBadge}>
                  <MaterialIcons name="edit" size={ms(12)} color="#fff" />
                  <Text style={styles.heroBadgeText}>SETTINGS</Text>
               </View>
               <Text style={styles.heroTitle}>Modify Profile</Text>
               <Text style={styles.heroSub}>Update your personal, address, and membership details securely.</Text>
            </View>
          </LinearGradient>
          {step === 1 && (
            <View style={styles.formSection}>
              <SectionHeader title="Personal Information" step={1} subtitle="Update your identity details." />
              <InputField name="full_name" icon="person-outline" label="Full Name" placeholder="Enter full name" value={formData.full_name} onChangeText={(val: string) => handleChange('full_name', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <InputField name="phone" icon="call-outline" label="Mobile Number" placeholder="+91" value={formData.phone} onChangeText={(val: string) => handleChange('phone', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} keyboardType="phone-pad" />
              <InputField name="email" icon="mail-outline" label="Email Id" value={formData.email} editable={false} />
              <PickerField label="Date of Birth" icon="calendar-outline" value={formData.date_of_birth} onPress={() => setShowDatePicker(true)} error={errors.date_of_birth} />
              <DatePicker
                modal open={showDatePicker}
                date={formData.date_of_birth ? (function() {
                  const parts = formData.date_of_birth.split('/');
                  if (parts.length === 3) {
                    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    return isNaN(d.getTime()) ? new Date() : d;
                  }
                  return new Date();
                })() : new Date()}
                mode="date" onConfirm={(date) => { setShowDatePicker(false); handleChange('date_of_birth', formatDate(date)); }}
                onCancel={() => setShowDatePicker(false)} maximumDate={new Date()}
              />
              <PickerField label="Gender" icon="people-outline" value={formData.gender} onPress={() => setModalType('gender')} error={errors.gender} />
              <InputField name="parent_name" icon="people-circle-outline" label="Father's / Husband's Name" placeholder="Enter name" value={formData.parent_name} onChangeText={(val: string) => handleChange('parent_name', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <InputField name="voter_id" icon="fingerprint" label="Voter ID / Member ID" placeholder="Enter Voter ID" value={formData.voter_id} onChangeText={(val: string) => handleChange('voter_id', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <InputField name="designation" icon="briefcase-outline" label="Designation" placeholder="Enter designation" value={formData.designation} onChangeText={(val: string) => handleChange('designation', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
            </View>
          )}
          {step === 2 && (
            <View style={styles.formSection}>
              <SectionHeader title="Address Details" step={2} subtitle="Update your residential info." />
              <Text style={styles.subSectionTitle}>Permanent Address</Text>
              <InputField name="house_number" icon="home-outline" label="House / Flat Number" placeholder="Enter house no." value={formData.house_number} onChangeText={(val: string) => handleChange('house_number', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <InputField name="street_address" icon="location-outline" label="Street / Area" placeholder="Enter street" value={formData.street_address} onChangeText={(val: string) => handleChange('street_address', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <InputField name="village" icon="business-outline" label="Village / Locality" placeholder="Enter village" value={formData.village} onChangeText={(val: string) => handleChange('village', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <InputField name="landmark" icon="navigate-outline" label="Landmark" placeholder="Enter landmark" value={formData.landmark} onChangeText={(val: string) => handleChange('landmark', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: hs(8) }}>
                  <InputField name="pincode" icon="pin-outline" label="Pincode" placeholder="6 digits" value={formData.pincode} onChangeText={(val: string) => handleChange('pincode', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1, marginLeft: hs(8) }}>
                  <InputField name="state" icon="map-outline" label="State" placeholder="Enter state" value={formData.state} onChangeText={(val: string) => handleChange('state', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: hs(8) }}>
                  <InputField name="district" icon="locate-outline" label="District" placeholder="Enter district" value={formData.district} onChangeText={(val: string) => handleChange('district', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
                </View>
                <View style={{ flex: 1, marginLeft: hs(8) }}>
                  <InputField name="taluka" icon="trail-sign-outline" label="Taluka / Block" placeholder="Enter taluka" value={formData.taluka} onChangeText={(val: string) => handleChange('taluka', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
                </View>
              </View>
              <View style={styles.checkboxRow}>
                <Switch value={sameAsPermanent} onValueChange={setSameAsPermanent} trackColor={{ false: "#767577", true: COLORS.primary }} thumbColor={sameAsPermanent ? "#fff" : "#f4f3f4"} />
                <Text style={styles.checkboxLabel}>Current Address is same as Permanent</Text>
              </View>
              {!sameAsPermanent && (
                <>
                  <Text style={styles.subSectionTitle}>Current Address</Text>
                  <InputField name="current_street_address" icon="location-outline" label="Full Current Address" placeholder="Enter Full Address" value={formData.current_street_address} onChangeText={(val: string) => handleChange('current_street_address', val)} errors={errors} focusedField={focusedField} setFocusedField={setFocusedField} />
                </>
              )}
            </View>
          )}
          {step === 3 && (
            <View style={styles.formSection}>
              <SectionHeader title="Organization Mapping" step={3} subtitle="Update your committee details." />
              <PickerField label="Committee" icon="people-circle-outline" value={selectedCommitteeName} onPress={() => setModalType('committee')} error={errors.committee_id} />
            </View>
          )}
          {step === 4 && (
            <View style={styles.formSection}>
              <SectionHeader title="Membership Plan" step={4} subtitle="Choose a plan that fits your needs." />
              {plans.length > 0 ? (
                <View style={styles.plansContainer}>
                  {plans.map((plan) => {
                    const isSelected = formData.membership_plan_id === plan.id;
                    return (
                      <TouchableOpacity key={plan.id} style={[styles.planCard, isSelected && styles.planCardSelected]} onPress={() => { handleChange('membership_plan_id', plan.id); setSelectedPlanName(plan.name); }} activeOpacity={0.7}>
                        <View style={styles.planCardContent}>
                          <View style={styles.planCardLeft}>
                             <View style={[styles.planIconCircle, isSelected && styles.planIconCircleActive]}>
                                <Ionicons name="ribbon" size={ms(18)} color={isSelected ? COLORS.white : COLORS.primary} />
                             </View>
                             <View style={styles.planCardInfo}>
                                <Text style={[styles.planName, isSelected && styles.planNameSelected]}>{plan.name}</Text>
                                <Text style={styles.planDesc} numberOfLines={1}>{plan.description}</Text>
                             </View>
                          </View>
                          <View style={styles.planCardRight}>
                             <Text style={[styles.planPriceAmount, isSelected && styles.planPriceSelected]}>₹{plan.price}</Text>
                             <View style={[styles.planSelectionCircle, isSelected && styles.planSelectionCircleActive]}>
                                {isSelected && <Ionicons name="checkmark" size={ms(14)} color={COLORS.white} />}
                             </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyPlans}>
                  <Ionicons name="alert-circle-outline" size={ms(48)} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No subscription plans found for this tenant.</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
            </TouchableOpacity>
            {step < 4 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={ms(18)} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.nextBtn, loading && styles.btnDisabled]} onPress={handleUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Text style={styles.nextBtnText}>Update Profile</Text>
                    <MaterialIcons name="check" size={ms(18)} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={!!modalType} animationType="fade" transparent={true}>{renderModalContent()}</Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: vs(40) },
  formSection: { 
    padding: hs(24), backgroundColor: COLORS.white, margin: hs(16), borderRadius: ms(16), 
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
    })
  },
  sectionHeaderContainer: { marginBottom: vs(24) },
  stepBadge: { backgroundColor: COLORS.primaryContainer, alignSelf: 'flex-start', paddingHorizontal: hs(12), paddingVertical: vs(4), borderRadius: ms(12), marginBottom: vs(8) },
  stepBadgeText: { color: COLORS.primary, fontSize: ms(12), fontWeight: '700' },
  sectionTitle: { fontSize: ms(24), fontWeight: '700', color: COLORS.text },
  sectionSubtitle: { fontSize: ms(14), color: COLORS.textSecondary, marginTop: vs(4) },
  progressBarBg: { height: vs(4), backgroundColor: '#e2e8f0', borderRadius: ms(2), marginTop: vs(16) },
  progressBarFilled: { height: vs(4), backgroundColor: COLORS.primary, borderRadius: ms(2) },
  inputGroup: { marginBottom: vs(20) },
  label: { fontSize: ms(14), fontWeight: '600', color: COLORS.text, marginBottom: vs(8) },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: ms(12), paddingHorizontal: hs(16), height: vs(52) },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputWrapperError: { borderColor: COLORS.error },
  inputIcon: { marginRight: hs(12) },
  input: { flex: 1, fontSize: ms(16), color: COLORS.text, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  errorText: { color: COLORS.error, fontSize: ms(12), marginTop: vs(4) },
  pickerText: { flex: 1, fontSize: ms(16), color: COLORS.text },
  row: { flexDirection: 'row' },
  subSectionTitle: { fontSize: ms(18), fontWeight: '700', color: COLORS.text, marginVertical: vs(16) },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: vs(16) },
  checkboxLabel: { marginLeft: hs(12), fontSize: ms(14), color: COLORS.textSecondary },
  planCard: { 
    padding: hs(16), borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: ms(20), marginBottom: vs(12), backgroundColor: COLORS.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  planCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryContainer },
  planCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: hs(12) },
  planIconCircle: { width: ms(40), height: ms(40), borderRadius: ms(12), backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginRight: hs(14) },
  planIconCircleActive: { backgroundColor: COLORS.primary },
  planCardInfo: { flex: 1 },
  planName: { fontSize: ms(16), fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  planNameSelected: { color: COLORS.primary },
  planPriceAmount: { fontSize: ms(18), fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  planPriceSelected: { color: COLORS.primary },
  planDesc: { fontSize: ms(12), color: COLORS.textSecondary, marginTop: vs(2), lineHeight: vs(16) },
  planCardRight: { alignItems: 'flex-end', gap: vs(8) },
  planSelectionCircle: { width: ms(24), height: ms(24), borderRadius: ms(12), borderWidth: 1.5, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  planSelectionCircleActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  emptyPlans: { padding: hs(40), alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, lineHeight: vs(22) },
  footerActions: { flexDirection: 'row', paddingHorizontal: hs(16), marginTop: vs(8), gap: hs(12) },
  backBtn: { flex: 1, height: vs(56), borderRadius: ms(16), borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  backBtnText: { fontSize: ms(16), fontWeight: '600', color: COLORS.textSecondary },
  nextBtn: { flex: 2, height: vs(56), borderRadius: ms(16), backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: hs(8) },
  nextBtnText: { fontSize: ms(16), fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalContent: { 
    backgroundColor: COLORS.white, borderTopLeftRadius: ms(32), borderTopRightRadius: ms(32), padding: hs(24), paddingTop: vs(8), maxHeight: '80%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 },
      web: { boxShadow: '0px -10px 40px rgba(0, 0, 0, 0.1)' }
    })
  },
  modalHandle: { width: hs(40), height: vs(5), backgroundColor: '#e2e8f0', borderRadius: ms(3), alignSelf: 'center', marginVertical: vs(12) },
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
  heroHeader: {
    paddingTop: vs(20), paddingBottom: vs(40), paddingHorizontal: hs(20), borderBottomLeftRadius: ms(32), borderBottomRightRadius: ms(32), marginBottom: vs(8),
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  heroContent: { gap: vs(8) },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: hs(6), backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: hs(10), paddingVertical: vs(4), borderRadius: ms(8), borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroBadgeText: { color: '#fff', fontSize: ms(10), fontWeight: '900', letterSpacing: 1 },
  heroTitle: { fontSize: ms(32), fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroSub: { fontSize: ms(14), color: 'rgba(255,255,255,0.8)', lineHeight: vs(20), fontWeight: '500', marginBottom: vs(12) },
  plansContainer: { gap: vs(12) },
});

export default EditProfileScreen;
