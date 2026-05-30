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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import Header from '../components/common/Header';

const { width, height } = Dimensions.get('window');

// --- COLORS ---
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
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data States
  const [formData, setFormData] = useState({
    // Step 1
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    parent_name: user?.parent_name || '',

    // Step 2
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

    // Step 3
    tenant_id: user?.tenant_id || null,
    committee_id: user?.committee_id || null,
    state_id: user?.state_id || null,
    district_id: user?.district_id || null,
    taluka_id: user?.taluka_id || null,
    village_id: user?.village_id || null,

    // Step 4
    membership_plan_id: user?.membership_plan_id || null,
  });

  const [sameAsPermanent, setSameAsPermanent] = useState(true);

  // Selection Data
  const [committees, setCommittees] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [talukas, setTalukas] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedCommitteeName, setSelectedCommitteeName] = useState('');
  const [selectedPlanName, setSelectedPlanName] = useState('');
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedTalukaName, setSelectedTalukaName] = useState('');
  const [selectedVillageName, setSelectedVillageName] = useState('');

  // Modals
  const [modalType, setModalType] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
    // Initialize selected names if user has them
    if (user?.state) setSelectedStateName(user.state);
    if (user?.district) setSelectedDistrictName(user.district);
    if (user?.taluka) setSelectedTalukaName(user.taluka);
    if (user?.village) setSelectedVillageName(user.village);
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch states
      const statesData = await tenantService.getPublicTargets(undefined, 'state');
      setStates(statesData);

      // Fetch specific data for this tenant
      fetchTenantSpecificData();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
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

  const fetchTenantSpecificData = async () => {
    try {
      const commData = await tenantService.getPublicCommittees();
      setCommittees(commData);
      const planData = await tenantService.getPublicPlans();
      setPlans(planData);

      // Find selected names
      if (user?.committee_id) {
        const comm = commData.find((c: any) => c.id === user.committee_id);
        if (comm) setSelectedCommitteeName(comm.name);
      }
      if (user?.membership_plan_id) {
        const p = planData.find((p: any) => p.id === user.membership_plan_id);
        if (p) setSelectedPlanName(p.name);
      }
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
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Required';
    if (!formData.gender) newErrors.gender = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleUpdate = async () => {
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

      const target_id = formData.village_id || formData.taluka_id || formData.district_id || formData.state_id;
      if (target_id) (updateData as any).target_id = target_id;
      
      await updateProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.response?.data?.detail || 'An error occurred');
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
    } else if (modalType === 'committee') {
      title = "Select Committee";
      data = committees;
      onSelect = (item) => {
        handleChange('committee_id', item.id);
        setSelectedCommitteeName(item.name);
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
        handleChange('state', item.name);
        // Clear dependent fields
        handleChange('district_id', null);
        setSelectedDistrictName('');
        handleChange('taluka_id', null);
        setSelectedTalukaName('');
        handleChange('village_id', null);
        setSelectedVillageName('');
        fetchDistricts(item.id);
      };
    } else if (modalType === 'district') {
      title = "Select District";
      data = districts;
      onSelect = (item) => {
        handleChange('district_id', item.id);
        setSelectedDistrictName(item.name);
        handleChange('district', item.name);
        // Clear dependent fields
        handleChange('taluka_id', null);
        setSelectedTalukaName('');
        handleChange('village_id', null);
        setSelectedVillageName('');
        fetchTalukas(item.id);
      };
    } else if (modalType === 'taluka') {
      title = "Select Taluka / Block";
      data = talukas;
      onSelect = (item) => {
        handleChange('taluka_id', item.id);
        setSelectedTalukaName(item.name);
        handleChange('taluka', item.name);
        // Clear dependent fields
        handleChange('village_id', null);
        setSelectedVillageName('');
        fetchVillages(item.id);
      };
    } else if (modalType === 'village') {
      title = "Select Village / City";
      data = villages;
      onSelect = (item) => {
        handleChange('village_id', item.id);
        setSelectedVillageName(item.name);
        handleChange('village', item.name);
      };
    }

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => (item.id || item.name).toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  onSelect(item);
                  setModalType(null);
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                {(formData.gender === item.id || formData.committee_id === item.id || formData.membership_plan_id === item.id || formData.state_id === item.id || formData.district_id === item.id || formData.taluka_id === item.id || formData.village_id === item.id) && (
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
      <Header title="Edit Profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <View style={styles.formSection}>
              <SectionHeader title="Personal Information" step={1} subtitle="Update your identity details." />
              <InputField
                name="full_name"
                icon="person-outline"
                label="Full Name"
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
                value={formData.email}
                editable={false}
                icon="lock-closed-outline"
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
            </View>
          )}

          {/* Step 2: Address Details */}
          {step === 2 && (
            <View style={styles.formSection}>
              <SectionHeader title="Address Details" step={2} subtitle="Update your residential info." />

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
                </>
              )}
            </View>
          )}

          {/* Step 3: Organization Mapping */}
          {step === 3 && (
            <View style={styles.formSection}>
              <SectionHeader title="Organization Mapping" step={3} subtitle="Update your committee details." />

              <PickerField
                label="State"
                icon="map-outline"
                value={selectedStateName}
                onPress={() => setModalType('state')}
              />

              <PickerField
                label="District"
                icon="locate-outline"
                value={selectedDistrictName}
                onPress={() => {
                  if (!formData.state_id) Alert.alert("Select State First");
                  else setModalType('district');
                }}
              />

              <PickerField
                label="Taluka / Block"
                icon="trail-sign-outline"
                value={selectedTalukaName}
                onPress={() => {
                  if (!formData.district_id) Alert.alert("Select District First");
                  else setModalType('taluka');
                }}
              />

              <PickerField
                label="Village / City"
                icon="business-outline"
                value={selectedVillageName}
                onPress={() => {
                  if (!formData.taluka_id) Alert.alert("Select Taluka First");
                  else setModalType('village');
                }}
              />

              <PickerField
                label="Committee"
                icon="people-circle-outline"
                value={selectedCommitteeName}
                onPress={() => setModalType('committee')}
              />
            </View>
          )}

          {/* Step 4: Membership Plan */}
          {step === 4 && (
            <View style={styles.formSection}>
              <SectionHeader title="Membership Plan" step={4} subtitle="Choose a plan that fits your needs." />

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
                   <Text style={styles.emptyText}>No special plans available.</Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
            </TouchableOpacity>
            
            {step < 4 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, loading && styles.btnDisabled]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Text style={styles.nextBtnText}>Update Profile</Text>
                    <MaterialIcons name="check" size={18} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
            )}
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
  
  row: { flexDirection: 'row' },
  subSectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginVertical: 16 },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  checkboxLabel: { marginLeft: 12, fontSize: 14, color: COLORS.textSecondary },
  
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
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listItemText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
});

export default EditProfileScreen;
