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
  Checkbox,
} from 'react-native';
import { tenantService } from '../services/tenantService';
import { mediaService } from '../services/mediaService';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import Header from '../components/common/Header';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#eff6ff',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: '#cbd5e1',
  error: '#ef4444',
  white: '#ffffff',
  bg: '#f8fafc',
  secondary: '#056e00',
  accent: '#ff8c00',
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
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View
      style={[
        styles.inputWrapper,
        focusedField === name && styles.inputWrapperFocused,
        name && errors[name] && styles.inputWrapperError,
        !editable && { backgroundColor: '#f1f5f9' }
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
        editable={editable}
      />
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

const RadioGroup = ({ label, options, value, onChange }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.radioContainer}>
      {options.map((opt: any) => (
        <TouchableOpacity 
          key={opt.value} 
          style={[styles.radioOption, value === opt.value && styles.radioOptionSelected]}
          onPress={() => onChange(opt.value)}
        >
          <MaterialIcons 
            name={value === opt.value ? "radio-button-checked" : "radio-button-unchecked"} 
            size={20} 
            color={value === opt.value ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[styles.radioText, value === opt.value && styles.radioTextSelected]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const CheckboxItem = ({ label, value, onChange, error }: any) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={() => onChange(!value)} activeOpacity={0.8}>
    <MaterialIcons 
      name={value ? "check-box" : "check-box-outline-blank"} 
      size={24} 
      color={value ? COLORS.primary : COLORS.textSecondary} 
    />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
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

const NominationScreen = ({ navigation, route }: any) => {
  const { election } = route.params || {};
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Step 1: Basic
    election_name: election?.title || '',
    position_id: null as number | null,
    target_id: null as number | null,
    
    // Step 2: Personal
    member_id: user?.id ? `MEM-${user.id.toString().padStart(5, '0')}` : 'N/A',
    full_name: user?.full_name || '',
    profile_photo_url: '',
    phone: user?.phone || '',
    email: user?.email || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    parent_name: user?.parent_name || '',

    // Step 3: Identity & Address
    kyc_type: user?.kyc_type || '',
    voter_id: user?.voter_id || '',
    state: user?.state || '',
    district: user?.district || '',
    taluka: '',
    village: '',
    pincode: user?.pincode || '',

    // Step 4: Eligibility
    willing_to_contest: true,
    held_previously: false,
    prev_position: '',
    prev_duration: '',
    suspended_disciplined: false,
    discipline_details: '',
    pending_complaints: false,

    // Step 5: Declaration
    agree_constitution: false,
    accept_results: false,
    info_correct: false,
    fulfill_criteria: false,
    agree_rules: false,
    understand_rejection: false,
    signature_url: '',
  });

  const [positions, setPositions] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedPositionName, setSelectedPositionName] = useState('');
  const [selectedTargetName, setSelectedTargetName] = useState('');
  const [modalType, setModalType] = useState<string | null>(null);

  useEffect(() => {
    loadPositions();
    loadTargets();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await tenantService.getPublicCommittees();
      setPositions(data);
    } catch (e) { console.error(e); }
  };

  const loadTargets = async () => {
    try {
      const data = await tenantService.getPublicTargets();
      setTargets(data);
    } catch (e) { console.error(e); }
  };

  const pickImage = async (field: 'profile_photo_url' | 'signature_url') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLoading(true);
      try {
        const uploadedUrl = await mediaService.uploadImage(result.assets[0].uri);
        setFormData({ ...formData, [field]: uploadedUrl });
      } catch (error) {
        Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const validateStep1 = () => {
    let newErrors: any = {};
    if (!formData.position_id) newErrors.position_id = 'Please select a position';
    if (!formData.target_id) newErrors.target_id = 'Please select constituency';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    let newErrors: any = {};
    if (!formData.full_name) newErrors.full_name = 'Required';
    if (!formData.profile_photo_url) newErrors.profile_photo_url = 'Photo is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!formData.agree_constitution || !formData.accept_results || !formData.info_correct || !formData.signature_url) {
      Alert.alert("Incomplete", "Please complete all mandatory declarations and upload signature.");
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Your nomination has been submitted successfully for scrutiny.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  const renderModal = () => (
    <Modal visible={!!modalType} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {modalType === 'position' ? 'Position' : 'Constituency'}</Text>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={modalType === 'position' ? positions : targets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  if (modalType === 'position') {
                    setFormData({ ...formData, position_id: item.id });
                    setSelectedPositionName(item.name);
                  } else {
                    setFormData({ ...formData, target_id: item.id });
                    setSelectedTargetName(item.name);
                  }
                  setModalType(null);
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                {(modalType === 'position' ? formData.position_id : formData.target_id) === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Nomination Form" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {step === 1 && (
            <View style={styles.formSection}>
              <SectionHeader title="Application Details" step={1} subtitle="Select the role you wish to contest for." />
              <InputField label="Election" value={formData.election_name} editable={false} icon="calendar-outline" />
              <PickerField label="Position Applying For" value={selectedPositionName} icon="briefcase-outline" onPress={() => setModalType('position')} error={errors.position_id} />
              <PickerField label="Constituency / Committee" value={selectedTargetName} icon="map-outline" onPress={() => setModalType('target')} error={errors.target_id} />
              <TouchableOpacity style={styles.nextBtn} onPress={() => validateStep1() && setStep(2)}>
                 <Text style={styles.nextBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.formSection}>
              <SectionHeader title="Personal Information" step={2} subtitle="Verify your identity and contact data." />
              
              <View style={styles.photoUploadContainer}>
                <TouchableOpacity style={styles.photoBox} onPress={() => pickImage('profile_photo_url')}>
                  {formData.profile_photo_url ? (
                    <Image source={{ uri: formData.profile_photo_url }} style={styles.photoPreview} />
                  ) : (
                    <>
                      <MaterialIcons name="add-a-photo" size={32} color={COLORS.textSecondary} />
                      <Text style={styles.photoLabel}>Profile Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
                {errors.profile_photo_url && <Text style={styles.errorText}>{errors.profile_photo_url}</Text>}
              </View>

              <InputField label="Member ID" value={formData.member_id} editable={false} icon="id-card-outline" />
              <InputField label="Full Name" value={formData.full_name} onChangeText={(t: string) => setFormData({...formData, full_name: t})} icon="person-outline" error={errors.full_name} />
              <InputField label="Mobile" value={formData.phone} icon="call-outline" editable={false} />
              <InputField label="Email" value={formData.email} icon="mail-outline" editable={false} />
              <InputField label="Date of Birth" value={formData.date_of_birth} icon="calendar-outline" />
              <InputField label="Father / Spouse Name" value={formData.parent_name} onChangeText={(t: string) => setFormData({...formData, parent_name: t})} icon="people-outline" />
              
              <View style={styles.row}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtnHalf} onPress={() => validateStep2() && setStep(3)}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.formSection}>
              <SectionHeader title="Identity & Address" step={3} subtitle="Official residential and verification data." />
              <RadioGroup 
                label="ID Proof Type" 
                options={[{label: 'Aadhaar', value: 'Aadhaar'}, {label: 'Voter ID', value: 'Voter ID'}, {label: 'PAN', value: 'PAN'}]} 
                value={formData.kyc_type}
                onChange={(v: string) => setFormData({...formData, kyc_type: v})}
              />
              <InputField label="ID Number" value={formData.voter_id} onChangeText={(t: string) => setFormData({...formData, voter_id: t})} icon="fingerprint" />
              <InputField label="State" value={formData.state} editable={false} icon="map-outline" />
              <InputField label="District" value={formData.district} editable={false} icon="location-outline" />
              <InputField label="Taluka / Block" value={formData.taluka} onChangeText={(t: string) => setFormData({...formData, taluka: t})} icon="location-outline" />
              <InputField label="Village / Area" value={formData.village} onChangeText={(t: string) => setFormData({...formData, village: t})} icon="home-outline" />
              <InputField label="Pincode" value={formData.pincode} keyboardType="numeric" onChangeText={(t: string) => setFormData({...formData, pincode: t})} icon="pin-outline" />

              <View style={styles.row}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtnHalf} onPress={() => setStep(4)}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.formSection}>
              <SectionHeader title="Eligibility Profile" step={4} subtitle="Past history and organizational standing." />
              
              <RadioGroup label="Are you willing to contest this election?" options={[{label: 'Yes', value: true}, {label: 'No', value: false}]} value={formData.willing_to_contest} onChange={(v: boolean) => setFormData({...formData, willing_to_contest: v})} />
              
              <RadioGroup label="Have you held this post previously?" options={[{label: 'Yes', value: true}, {label: 'No', value: false}]} value={formData.held_previously} onChange={(v: boolean) => setFormData({...formData, held_previously: v})} />
              {formData.held_previously && (
                <View style={styles.subForm}>
                  <InputField label="Previous Position" value={formData.prev_position} onChangeText={(t: string) => setFormData({...formData, prev_position: t})} icon="ribbon-outline" />
                  <InputField label="Duration" value={formData.prev_duration} onChangeText={(t: string) => setFormData({...formData, prev_duration: t})} icon="time-outline" />
                </View>
              )}

              <RadioGroup label="Ever been suspended or disciplined by organization?" options={[{label: 'Yes', value: true}, {label: 'No', value: false}]} value={formData.suspended_disciplined} onChange={(v: boolean) => setFormData({...formData, suspended_disciplined: v})} />
              {formData.suspended_disciplined && (
                <InputField label="Details" value={formData.discipline_details} onChangeText={(t: string) => setFormData({...formData, discipline_details: t})} icon="alert-circle-outline" />
              )}

              <RadioGroup label="Do you have any pending complaints or disputes?" options={[{label: 'Yes', value: true}, {label: 'No', value: false}]} value={formData.pending_complaints} onChange={(v: boolean) => setFormData({...formData, pending_complaints: v})} />

              <View style={styles.row}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtnHalf} onPress={() => setStep(5)}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={styles.formSection}>
              <SectionHeader title="Declaration & Signature" step={5} subtitle="Final mandatory confirmation." />
              
              <View style={styles.declarationBox}>
                 <Text style={styles.declarationText}>I, the undersigned, hereby declare that the information provided is true to the best of my knowledge.</Text>
                 
                 <CheckboxItem label="Do you agree to party constitution and election rules?" value={formData.agree_constitution} onChange={(v: boolean) => setFormData({...formData, agree_constitution: v})} />
                 <CheckboxItem label="Do you accept election result as per party rules?" value={formData.accept_results} onChange={(v: boolean) => setFormData({...formData, accept_results: v})} />
                 
                 <View style={styles.divider} />
                 
                 <CheckboxItem label="All information submitted is correct" value={formData.info_correct} onChange={(v: boolean) => setFormData({...formData, info_correct: v})} />
                 <CheckboxItem label="I fulfill eligibility criteria" value={formData.fulfill_criteria} onChange={(v: boolean) => setFormData({...formData, fulfill_criteria: v})} />
                 <CheckboxItem label="I agree to election rules" value={formData.agree_rules} onChange={(v: boolean) => setFormData({...formData, agree_rules: v})} />
                 <CheckboxItem label="I understand nomination can be rejected" value={formData.understand_rejection} onChange={(v: boolean) => setFormData({...formData, understand_rejection: v})} />
              </View>

              <View style={styles.signatureUploadContainer}>
                <Text style={styles.label}>Upload Signature</Text>
                <TouchableOpacity style={styles.signatureBox} onPress={() => pickImage('signature_url')}>
                  {formData.signature_url ? (
                    <Image source={{ uri: formData.signature_url }} style={styles.signaturePreview} resizeMode="contain" />
                  ) : (
                    <>
                      <MaterialIcons name="draw" size={32} color={COLORS.textSecondary} />
                      <Text style={styles.photoLabel}>Add Signature</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(4)}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Nomination</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40 },
  formSection: { padding: 20 },
  
  sectionHeaderContainer: { marginBottom: 30 },
  stepBadge: { backgroundColor: COLORS.primaryContainer, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  stepBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  progressBarBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressBarFilled: { height: '100%', backgroundColor: COLORS.primary },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, height: 56 },
  inputWrapperFocused: { borderColor: COLORS.primary, borderWidth: 2 },
  inputWrapperError: { borderColor: COLORS.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.text, height: '100%' },
  pickerText: { flex: 1, fontSize: 16, color: COLORS.text },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 },

  photoUploadContainer: { alignItems: 'center', marginBottom: 24 },
  photoBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  photoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginTop: 8 },

  radioContainer: { flexDirection: 'row', gap: 12, marginTop: 4 },
  radioOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.white },
  radioOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryContainer },
  radioText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  radioTextSelected: { color: COLORS.primary },

  subForm: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 20 },
  
  checkboxContainer: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16, paddingRight: 20 },
  checkboxLabel: { fontSize: 13, color: COLORS.text, lineHeight: 20, fontWeight: '500' },
  declarationBox: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  declarationText: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 20, lineHeight: 22 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20, opacity: 0.5 },

  signatureUploadContainer: { marginBottom: 30 },
  signatureBox: { height: 120, backgroundColor: '#f1f5f9', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  signaturePreview: { width: '100%', height: '100%' },

  row: { flexDirection: 'row', gap: 12, marginTop: 10 },
  nextBtn: { 
    backgroundColor: COLORS.primary, 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: `0px 4px 8px ${COLORS.primary}33` }
    })
  },
  nextBtnHalf: { flex: 2, backgroundColor: COLORS.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flex: 1, backgroundColor: COLORS.white, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  backBtnText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '800' },
  submitBtn: { flex: 2, backgroundColor: COLORS.accent, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listItemText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
});

export default NominationScreen;
