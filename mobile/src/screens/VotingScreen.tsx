import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { electionService } from '../services/electionService';
import { nominationService } from '../services/nominationService';
import { paymentService } from '../services/paymentService';
import { planService } from '../services/planService';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  primary: '#003d9b',
  primaryContainer: '#0052cc',
  background: '#f4f5f7',
  surface: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434654',
  outlineVariant: '#c3c6d6',
  secondary: '#056e00',
  secondaryContainer: '#8dfc75',
  onSecondaryContainer: '#067500',
  surfaceContainerLow: '#f3f4f6',
  surfaceContainerHighest: '#e1e2e4',
};

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

declare const require: (moduleName: string) => any;

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions & {
      handler: (response: RazorpayCheckoutResult) => void;
      modal?: { ondismiss?: () => void };
    }) => { open: () => void };
  }
}

const loadRazorpayWebCheckout = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Razorpay web checkout is not available in this runtime.'));
  }
  if (window.Razorpay) {
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
      if (!window.Razorpay) {
        reject(new Error('Razorpay checkout failed to initialize.'));
        return;
      }

      const checkout = new window.Razorpay({
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

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const end = new Date(endDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTime({ h: 0, m: 0, s: 0 });
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const Block = ({ label, value }: any) => (
    <View style={styles.timerSegment}>
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
        style={styles.timerValueBox}
      >
        <Text style={styles.timerValueText}>{value.toString().padStart(2, '0')}</Text>
      </LinearGradient>
      <Text style={styles.timerLabelText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.premiumTimerContainer}>
      <Block label="HRS" value={time.h} />
      <View style={styles.timerSeparator}><Text style={styles.timerSeparatorText}>:</Text></View>
      <Block label="MIN" value={time.m} />
      <View style={styles.timerSeparator}><Text style={styles.timerSeparatorText}>:</Text></View>
      <Block label="SEC" value={time.s} />
    </View>
  );
};

const VotingScreen = ({ navigation, route }: any) => {
  const { election: routeElection } = route.params || {};
  const { user, updateProfile } = useAuth();
  const { width } = useWindowDimensions();
  const [selectedElection, setSelectedElection] = useState<any>(routeElection);
  const [elections, setElections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'active' | 'upcoming'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingVote, setExistingVote] = useState<any>(null);
  const [myNomination, setMyNomination] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingNomination, setWithdrawingNomination] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [fetchingPlans, setFetchingPlans] = useState(false);

  const fetchPlans = async () => {
    setFetchingPlans(true);
    try {
      const data = await planService.getPublicPlans();
      const planItems = (data?.items ?? data) || [];
      setPlans(planItems);
      if (user?.membership_plan_id) {
        setSelectedPlanId(user?.membership_plan_id);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      showToast.error("Error", "Failed to load membership plans.");
    } finally {
      setFetchingPlans(false);
    }
  };

  useEffect(() => {
    // We allow setting to null to reset to the election list
    setSelectedElection(routeElection);
  }, [routeElection]);

  useEffect(() => {
    if (selectedElection) {
      fetchElectionDetails(selectedElection.id);
    } else {
      fetchElections();
    }
  }, [selectedElection, currentPage]);

  const fetchElections = async () => {
    try {
      setLoading(true);
      // Fetch all published elections (up to 100) to allow accurate frontend filtering/pagination
      const response = await electionService.getElections(false, 1, 100, 'active');
      // Handle both cases: direct array or standardized envelope with .data
      const electionList = Array.isArray(response) ? response : (response?.data || []);
      setElections(electionList);
      // Total items and pages will be calculated by the filtered list
    } catch (error) {
      console.error("Failed to load elections", error);
      showToast.error("Error", "Failed to load elections.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const now = new Date().getTime();
    let filtered = elections.filter(e => {
      const start = new Date(e.start_date).getTime();
      const end = new Date(e.end_date).getTime();
      
      if (selectedFilter === 'active') {
        return start <= now && end >= now;
      } else {
        return start > now;
      }
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        (e.election_type && e.election_type.toLowerCase().includes(query))
      );
    }
    return filtered;
  };

  const filteredElections = getFilteredData();
  const paginatedElections = filteredElections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const currentTotalItems = filteredElections.length;
  const currentTotalPages = Math.ceil(currentTotalItems / itemsPerPage);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);

  const fetchElectionDetails = async (electionId: number) => {
    try {
      setLoading(true);
      const [cands, voteResponse, nominationResponse] = await Promise.all([
        electionService.getCandidates(electionId),
        electionService.getMyVote(electionId).catch(() => null),
        nominationService.getMyForElection(electionId).catch(() => null),
      ]);
      setCandidates(cands);
      setMyNomination(nominationResponse);
      
      // voteResponse is { has_voted: boolean, vote: any }
      if (voteResponse && voteResponse.has_voted) {
        setExistingVote(voteResponse.vote);
        setSelectedCandidateId(voteResponse.vote.candidate_id);
      } else {
        setExistingVote(null);
        setSelectedCandidateId(null);
      }
    } catch (error) {
      console.error("Failed to load election data", error);
      showToast.error("Error", "Failed to load election details.");
      setMyNomination(null);
    } finally {
      setLoading(false);
    }
  };

  const getNominationStatusMeta = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return {
          label: 'Approved',
          icon: 'check-circle' as const,
          color: '#056e00',
          bg: '#e5f8e1',
          detail: 'Your nomination has been approved for this election.',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: 'cancel' as const,
          color: '#b91c1c',
          bg: '#fee2e2',
          detail: 'Your nomination was rejected during scrutiny.',
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          icon: 'remove-circle-outline' as const,
          color: '#64748b',
          bg: '#f1f5f9',
          detail: 'You have withdrawn your nomination for this election.',
        };
      default:
        return {
          label: 'Pending Scrutiny',
          icon: 'hourglass-empty' as const,
          color: '#b45309',
          bg: '#fef3c7',
          detail: 'Your nomination is submitted and waiting for admin review.',
        };
    }
  };

  const handleWithdrawNomination = () => {
    if (!myNomination?.id || !selectedElection) return;

    const performWithdrawal = async () => {
      setWithdrawingNomination(true);
      try {
        await nominationService.withdraw(myNomination.id);
        showToast.success('Withdrawn', 'Your nomination has been withdrawn.');
        await fetchElectionDetails(selectedElection.id);
      } catch (error: any) {
        showToast.error(
          'Withdrawal Failed',
          error.response?.data?.detail || error.response?.data?.message || 'Could not withdraw nomination.',
        );
      } finally {
        setWithdrawingNomination(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Do you want to withdraw your nomination for this election?')) {
        performWithdrawal();
      }
    } else {
      Alert.alert(
        'Withdraw Nomination',
        'Do you want to withdraw your nomination for this election?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Withdraw',
            style: 'destructive',
            onPress: performWithdrawal,
          },
        ],
      );
    }
  };

  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipModalType, setMembershipModalType] = useState<'select' | 'pay'>('select');

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const recordPaymentFailure = async (membershipPlanId: number, error: any) => {
    try {
      await paymentService.recordPaymentFailure({
        membership_plan_id: membershipPlanId,
        error_message: error.description || error.message || "Payment cancelled or failed",
        razorpay_order_id: error.metadata?.order_id
      });
    } catch (err) {
      console.error('Failed to record payment failure:', err);
    }
  };

  const handleRealPayment = async () => {
    const membershipPlanId = selectedPlanId || user?.membership_plan_id;
    if (!membershipPlanId) {
      showToast.error("Plan Required", "Please select a membership plan first.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      // If the selected plan is different from what's on the user record, update the profile first.
      // This is required by the backend to create an order for that specific plan.
      if (membershipPlanId !== user?.membership_plan_id) {
        await updateProfile({ membership_plan_id: membershipPlanId });
      }

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
        order_id: orderResponse.order_id || orderResponse.razorpay_order_id,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.full_name || ''
        },
        theme: { color: COLORS.primary }
      };

      try {
        const data = await openRazorpayCheckout(options);
        await paymentService.verifyPayment({
          razorpay_order_id: data.razorpay_order_id || orderResponse.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        });
        
        showToast.success("Success", "Payment completed successfully! You can now cast your vote.");
        setShowMembershipModal(false);
      } catch (error: any) {
        // Record failure to backend for audit trail
        await recordPaymentFailure(membershipPlanId, error);

        // Razorpay error (e.g. payment cancelled)
        if (error.code === 2) {
          showToast.info("Payment Cancelled", "The payment process was dismissed.");
        } else {
          showToast.error("Payment Failed", error.description || "The transaction could not be completed.");
        }
      }
    } catch (error: any) {
      showToast.error("System Error", error.response?.data?.detail || "Could not initialize payment gateway.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidateId || !selectedElection) return;
    
    setSubmitting(true);
    try {
      const eligibility = await paymentService.checkVotingEligibility();
      if (!eligibility.membership_selected || !eligibility.payment_completed) {
        setSubmitting(false);
        setShowConfirmModal(false);
        // Show modal first, then fetch plans inside it
        setShowMembershipModal(true);
        fetchPlans();
        setMembershipModalType(eligibility.membership_selected ? 'pay' : 'select');
        return;
      }

      await electionService.castVote(selectedElection.id, selectedCandidateId);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      fetchElectionDetails(selectedElection.id); // Refresh vote status
    } catch (error: any) {
      showToast.error("Voting Failed", error.response?.data?.message || error.response?.data?.detail || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const navigateToDetails = (candidate: any) => {
    navigation.navigate('CandidateDetail', { candidate });
  };

  const handleBack = () => {
    if (routeElection) {
      navigation.goBack();
    } else {
      setSelectedElection(null);
    }
  };

  // --- Real-time Election Status Logic ---
  const calculateElectionStatus = () => {
    if (!selectedElection) return null;
    
    const now = new Date().getTime();
    const start = new Date(selectedElection.start_date).getTime();
    const end = new Date(selectedElection.end_date).getTime();
    const dbStatus = selectedElection.status;

    // 1. Cancelled State
    if (dbStatus === 'cancelled') {
      return {
        label: 'CANCELLED',
        icon: 'cancel' as const,
        color: '#b91c1c',
        bg: '#fee2e2',
        timerLabel: 'SESSION VOID',
        timerDate: null,
        isVotingActive: false
      };
    }

    // 2. Closed State
    if (dbStatus === 'closed' || now >= end) {
      return {
        label: 'CLOSED',
        icon: 'lock' as const,
        color: '#475569',
        bg: '#f1f5f9',
        timerLabel: 'SESSION ENDED',
        timerDate: null,
        isVotingActive: false
      };
    }

    // 3. Scheduled / Upcoming State
    if (dbStatus === 'draft' || now < start) {
      return {
        label: 'SCHEDULED',
        icon: 'event' as const,
        color: '#4f46e5',
        bg: '#eef2ff',
        timerLabel: 'STARTS IN',
        timerDate: selectedElection.start_date,
        isVotingActive: false
      };
    }

    // 4. Active State
    if (dbStatus === 'active' && now >= start && now < end) {
      return {
        label: 'ACTIVE',
        icon: 'sensors' as const,
        color: COLORS.secondary,
        bg: '#e5f8e1',
        timerLabel: 'CLOSES IN',
        timerDate: selectedElection.end_date,
        isVotingActive: true
      };
    }

    return null;
  };

  const statusConfig = calculateElectionStatus();
  const isVotingActive = statusConfig?.isVotingActive || false;

  const handleDisabledVotePress = () => {
    if (statusConfig?.label === 'SCHEDULED') {
      showToast.info("Not Started", "Voting has not started yet for this election.");
    } else {
      showToast.error("Voting Closed", "Voting is currently closed for this election.");
    }
  };
  const nominationStatusMeta = getNominationStatusMeta(myNomination?.status);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      <Header 
        showBack={!!selectedElection} 
        onBack={handleBack} 
        title={selectedElection ? "Election Detail" : "Election Portal"} 
      />
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={{ paddingBottom: selectedElection ? 100 : 20, paddingTop: 0 }} 
        showsVerticalScrollIndicator={false}
      >
        {!selectedElection ? (
          <>
            {/* Premium Hero Header */}
            <LinearGradient
              colors={['#003d9b', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroHeader}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                    <MaterialIcons name="security" size={12} color="#fff" />
                    <Text style={styles.heroBadgeText}>SECURE PORTAL</Text>
                </View>
                <Text style={styles.heroTitlePre}>Secure</Text>
                <Text style={styles.heroTitleMain}>Election Portal</Text>
                <Text style={styles.heroSub}>Access live and upcoming voting sessions for your administrative district.</Text>
                
                {/* Modern Integrated Search */}
                <View style={styles.heroSearchWrapper}>
                    <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.heroSearchInput}
                      placeholder="Search sessions..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      underlineColorAndroid="transparent"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: 16 }}>
              {/* Premium Status Filter Tabs */}
              <View style={styles.premiumFilterContainer}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.premiumFilterTab, selectedFilter === 'active' && styles.premiumFilterTabActive]}
                  onPress={() => setSelectedFilter('active')}
                >
                  <MaterialIcons 
                    name="sensors" 
                    size={20} 
                    color={selectedFilter === 'active' ? '#fff' : COLORS.primary} 
                  />
                  <Text style={[styles.premiumFilterTabText, selectedFilter === 'active' && styles.premiumFilterTabTextActive]}>Active</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.premiumFilterTab, selectedFilter === 'upcoming' && styles.premiumFilterTabActive]}
                  onPress={() => setSelectedFilter('upcoming')}
                >
                  <MaterialIcons 
                    name="event" 
                    size={20} 
                    color={selectedFilter === 'upcoming' ? '#fff' : COLORS.onSurfaceVariant} 
                  />
                  <Text style={[styles.premiumFilterTabText, selectedFilter === 'upcoming' && styles.premiumFilterTabTextActive]}>Upcoming</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modernListContainer}>
                {paginatedElections.length === 0 ? (
                  <View style={styles.emptyCandidatesBox}>
                    <MaterialIcons name="how-to-vote" size={48} color={COLORS.outlineVariant} />
                    <Text style={styles.emptyCandidatesText}>
                      {searchQuery ? "No matching elections found." : `No ${selectedFilter} elections available.`}
                    </Text>
                  </View>
                ) : (
                  paginatedElections.map(elec => {
                    const isLive = new Date(elec.start_date).getTime() <= new Date().getTime();
                    const accentColor = isLive ? COLORS.secondary : '#6366f1';

                    return (
                      <TouchableOpacity 
                        key={elec.id}
                        style={styles.premiumElecCard}
                        onPress={() => setSelectedElection(elec)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.premiumElecLayout}>
                           {/* Left Column: Date & Status */}
                           <View style={styles.premiumElecLeft}>
                              <View style={[styles.premiumDateBlock, { backgroundColor: accentColor + '10' }]}>
                                 <Text style={[styles.premiumDateMonth, { color: accentColor }]}>
                                    {new Date(elec.start_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                                 </Text>
                                 <Text style={[styles.premiumDateDay, { color: COLORS.onSurface }]}>
                                    {new Date(elec.start_date).getDate()}
                                 </Text>
                              </View>
                              <View style={[styles.minimalStatusBadge, { backgroundColor: accentColor + '15', marginTop: 12 }]}>
                                <View style={[styles.liveDotSmall, { backgroundColor: accentColor }]} />
                                <Text style={[styles.statusBadgeTextSmall, { color: accentColor }]}>
                                  {isLive ? 'LIVE' : 'UPCOMING'}
                                </Text>
                              </View>
                           </View>

                           {/* Center Column: Detailed Info */}
                           <View style={styles.premiumElecCenter}>
                              <Text style={styles.premiumElecTitle} numberOfLines={1}>{elec.title}</Text>
                              
                              <View style={styles.premiumDetailRow}>
                                 <MaterialIcons name="location-on" size={14} color={COLORS.onSurfaceVariant} opacity={0.6} />
                                 <Text style={styles.premiumDetailText} numberOfLines={1}>
                                    {elec.target_district || 'Regional'} • {elec.committee_level?.toUpperCase() || 'PRECINCT'}
                                 </Text>
                              </View>

                              {elec.description && (
                                <Text style={styles.premiumDescSnippet} numberOfLines={1}>
                                   {elec.description}
                                </Text>
                              )}

                              <View style={styles.premiumFooterRow}>
                                 <View style={styles.premiumStatItem}>
                                    <MaterialIcons name="people-outline" size={14} color={COLORS.primary} />
                                    <Text style={styles.premiumStatText}>{elec.candidate_count || 0} Candidates</Text>
                                 </View>
                                 <View style={styles.premiumStatDivider} />
                                 <View style={styles.premiumStatItem}>
                                    <MaterialIcons name="schedule" size={14} color={COLORS.primary} />
                                    <Text style={styles.premiumStatText}>
                                       {new Date(elec.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                 </View>
                              </View>
                           </View>

                           {/* Right Column: Action */}
                           <View style={styles.premiumElecRight}>
                              <View style={[styles.premiumArrowBtn, { backgroundColor: accentColor + '15' }]}>
                                 <MaterialIcons name="chevron-right" size={20} color={accentColor} />
                              </View>
                           </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* Pagination Controls */}
            {currentTotalPages > 1 && (
              <View style={styles.paginationWrapper}>
                <View style={styles.resultsInfo}>
                  <Text style={styles.resultsText}>
                    Showing <Text style={{fontWeight: '700'}}>{(currentPage - 1) * itemsPerPage + 1}</Text> to <Text style={{fontWeight: '700'}}>{Math.min(currentPage * itemsPerPage, currentTotalItems)}</Text> of <Text style={{fontWeight: '700'}}>{currentTotalItems}</Text> elections
                  </Text>
                </View>

                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <MaterialIcons name="chevron-left" size={24} color={currentPage === 1 ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.pageNumbersRow}>
                    {Array.from({ length: Math.min(5, currentTotalPages) }, (_, i) => {
                      let pageNum;
                      if (currentTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= currentTotalPages - 2) {
                        pageNum = currentTotalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <TouchableOpacity 
                          key={pageNum}
                          style={[styles.pageNumberBtn, currentPage === pageNum && styles.pageNumberBtnActive]}
                          onPress={() => setCurrentPage(pageNum)}
                        >
                          <Text style={[styles.pageNumberText, currentPage === pageNum && styles.pageNumberTextActive]}>
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === currentTotalPages && styles.pageBtnDisabled]} 
                    onPress={() => setCurrentPage(prev => Math.min(currentTotalPages, prev + 1))}
                    disabled={currentPage === currentTotalPages}
                  >
                    <MaterialIcons name="chevron-right" size={24} color={currentPage === currentTotalPages ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Premium Detail Hero Section */}
            <LinearGradient
              colors={['#003d9b', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailHero}
            >
              <View style={styles.heroContent}>
                <View style={[styles.heroBadge, statusConfig && { backgroundColor: statusConfig.bg, borderColor: 'transparent' }]}>
                    <MaterialIcons name={statusConfig?.icon || "event-upcoming"} size={12} color={statusConfig?.color || "#fff"} />
                    <Text style={[styles.heroBadgeText, statusConfig && { color: statusConfig.color }]}>
                      {statusConfig?.label || 'SCHEDULED'}
                    </Text>
                </View>
                <Text style={styles.heroTitlePre}>
                  {statusConfig?.label === 'ACTIVE' ? 'Voting Session' : 'Election Session'}
                </Text>
                <Text style={styles.heroTitleMain} numberOfLines={2}>{selectedElection.title}</Text>
                
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>{statusConfig?.timerLabel || 'CLOSES IN'}</Text>
                    {statusConfig?.timerDate ? (
                      <CountdownTimer endDate={statusConfig.timerDate} />
                    ) : (
                      <View style={styles.premiumTimerContainer}>
                         <Text style={[styles.timerValueText, { fontSize: 24, color: 'rgba(255,255,255,0.4)' }]}>-- : -- : --</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailMetaDividerVertical} />
                  <View style={styles.detailMetaCol}>
                    <Text style={styles.detailMetaLabel}>TYPE</Text>
                    <View style={styles.heroTypeBadge}>
                      <Text style={styles.heroTypeBadgeText}>{selectedElection.election_type || 'GENERAL'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.detailBodyContainer}>
              {/* Election Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardRow}>
                  <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
                  <Text style={styles.infoCardText}>{selectedElection.target_district || 'Regional Jurisdiction'}</Text>
                </View>
                {selectedElection.description && (
                  <>
                    <View style={styles.cardDivider} />
                    <Text style={styles.infoDescText}>{selectedElection.description}</Text>
                  </>
                )}
              </View>

              {statusConfig?.label === 'SCHEDULED' && (
                <>
                  <TouchableOpacity 
                    style={[styles.nominationActionBtn, !myNomination && styles.nominationActionBtnSolo]}
                    onPress={() => {
                      if (myNomination) {
                        Alert.alert('Nomination Submitted', 'You have already submitted a nomination for this election.');
                        return;
                      }
                      navigation.navigate('Nomination', { election: selectedElection });
                    }}
                  >
                    <LinearGradient
                      colors={myNomination ? ['#64748b', '#475569'] : ['#4f46e5', '#3730a3']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.nominationActionGradient}
                    >
                      <MaterialIcons name="assignment-ind" size={22} color="#fff" />
                      <View style={styles.nominationActionTextWrap}>
                        <Text style={styles.nominationActionTitle}>
                          {myNomination ? 'Nomination Submitted' : 'Nominate Yourself'}
                        </Text>
                        <Text style={styles.nominationActionSub}>
                          {myNomination ? 'Track your application status below' : 'Apply to be a candidate in this session'}
                        </Text>
                      </View>
                      <MaterialIcons name={myNomination ? 'done' : 'chevron-right'} size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
                    </LinearGradient>
                  </TouchableOpacity>

                  {myNomination && (
                    <View style={styles.nominationStatusCard}>
                      <View style={styles.nominationStatusHeader}>
                        <View style={[styles.nominationStatusIcon, { backgroundColor: nominationStatusMeta.bg }]}>
                          <MaterialIcons name={nominationStatusMeta.icon} size={20} color={nominationStatusMeta.color} />
                        </View>
                        <View style={styles.nominationStatusContent}>
                          <Text style={styles.nominationStatusEyebrow}>YOUR NOMINATION</Text>
                          <Text style={styles.nominationStatusTitle}>{nominationStatusMeta.label}</Text>
                        </View>
                        <View style={[styles.nominationStatusBadge, { backgroundColor: nominationStatusMeta.bg }]}>
                          <Text style={[styles.nominationStatusBadgeText, { color: nominationStatusMeta.color }]}>
                            {String(myNomination.status || 'pending').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.nominationStatusDetail}>{nominationStatusMeta.detail}</Text>
                      <View style={styles.nominationStatusMetaRow}>
                        <View style={styles.nominationStatusMetaItem}>
                          <Text style={styles.nominationStatusMetaLabel}>Position</Text>
                          <Text style={styles.nominationStatusMetaValue} numberOfLines={1}>
                            {myNomination.position_name || 'Candidate'}
                          </Text>
                        </View>
                        <View style={styles.nominationStatusMetaItem}>
                          <Text style={styles.nominationStatusMetaLabel}>Submitted</Text>
                          <Text style={styles.nominationStatusMetaValue}>
                            {myNomination.created_at ? new Date(myNomination.created_at).toLocaleDateString() : '-'}
                          </Text>
                        </View>
                      </View>
                      {['pending', 'approved'].includes(String(myNomination.status || '').toLowerCase()) && (
                        <TouchableOpacity
                          style={styles.withdrawNominationBtn}
                          onPress={handleWithdrawNomination}
                          disabled={withdrawingNomination}
                        >
                          {withdrawingNomination ? (
                            <ActivityIndicator size="small" color="#b91c1c" />
                          ) : (
                            <>
                              <MaterialIcons name="delete-outline" size={18} color="#b91c1c" />
                              <Text style={styles.withdrawNominationText}>Withdraw Nomination</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleLabel}>OFFICIAL CANDIDATES</Text>
                <View style={styles.candidateCountBadge}>
                  <Text style={styles.candidateCountText}>{candidates.length}</Text>
                </View>
              </View>

              {/* Candidate List (Single Column) */}
              <View style={styles.premiumCandidatesList}>
                {candidates.length === 0 ? (
                  <View style={styles.emptyCandidatesBox}>
                    <MaterialIcons name="person-off" size={32} color={COLORS.outline} />
                    <Text style={styles.emptyCandidatesText}>No candidates registered yet.</Text>
                  </View>
                ) : (
                  candidates.map(candidate => {
                    const isSelected = selectedCandidateId === candidate.id;
                    const hasVoted = existingVote && existingVote.candidate_id === candidate.id;
                    
                    return (
                      <TouchableOpacity 
                        key={candidate.id}
                        activeOpacity={existingVote || !isVotingActive ? 1 : 0.7}
                        onPress={() => {
                          if (!isVotingActive && !hasVoted) {
                            handleDisabledVotePress();
                            return;
                          }
                          if (!existingVote) setSelectedCandidateId(candidate.id);
                        }}
                        style={[
                          styles.candRowCard,
                          isSelected && styles.candRowCardSelected,
                          hasVoted && styles.candRowCardVoted,
                          !isVotingActive && !hasVoted && { opacity: 0.7, borderColor: COLORS.outlineVariant }
                        ]}
                      >
                        <View style={styles.candRowContent}>
                          <View style={styles.candRowLeft}>
                            <View style={styles.rowAvatarWrapper}>
                              <Image 
                                source={{ uri: candidate.manifesto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=${isSelected ? '4f46e5' : 'dae2ff'}&color=${isSelected ? 'fff' : '003d9b'}&bold=true` }} 
                                style={styles.rowAvatarImg} 
                              />
                              {hasVoted && (
                                <View style={styles.rowVotedBadge}>
                                  <MaterialIcons name="verified" size={14} color="#fff" />
                                </View>
                              )}
                            </View>
                            <View style={styles.candRowInfo}>
                              <Text style={[styles.rowCandName, isSelected && styles.rowCandNameSelected]} numberOfLines={1}>
                                {candidate.full_name}
                              </Text>
                              <View style={[styles.rowPartyBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={[styles.rowPartyText, isSelected && { color: '#fff' }]} numberOfLines={1}>
                                  {candidate.committee?.name?.toUpperCase() || 'INDEPENDENT'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.candRowRight}>
                            {!existingVote ? (
                              <View style={[
                                styles.rowVoteBtn, 
                                isSelected && styles.rowVoteBtnActive,
                                !isVotingActive && { backgroundColor: COLORS.surfaceContainerLow }
                              ]}>
                                <Text style={[
                                  styles.rowVoteBtnText, 
                                  isSelected && styles.rowVoteBtnTextActive,
                                  !isVotingActive && { color: COLORS.onSurfaceVariant, opacity: 0.5 }
                                ]}>
                                  {isSelected ? 'SELECTED' : 'VOTE'}
                                </Text>
                                {isSelected && <MaterialIcons name="check-circle" size={16} color="#fff" />}
                              </View>
                            ) : (
                              <View style={[styles.rowStatusBadge, hasVoted && styles.rowStatusBadgeVoted]}>
                                <Text style={[styles.rowStatusText, hasVoted && styles.rowStatusTextVoted]}>
                                  {hasVoted ? 'YOUR CHOICE' : 'CAST'}
                                </Text>
                              </View>
                            )}
                            <TouchableOpacity 
                              style={styles.rowInfoBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                navigateToDetails(candidate);
                              }}
                            >
                              <MaterialIcons name="info-outline" size={20} color={isSelected ? '#fff' : COLORS.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* Secure Footer Note */}
              <View style={styles.secureFooterNote}>
                <MaterialIcons name="security" size={14} color={COLORS.onSurfaceVariant} opacity={0.5} />
                <Text style={styles.secureFooterText}>
                  End-to-End Encrypted Session • Protocol V4.2
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Action Bar */}
      {selectedElection && !existingVote && (
        <View style={styles.floatingVoteBar}>
          <LinearGradient
            colors={['rgba(244,245,247,0)', 'rgba(244,245,247,1)']}
            style={styles.floatingBarFade}
          />
          <TouchableOpacity 
            onPress={() => {
              if (!isVotingActive) {
                handleDisabledVotePress();
                return;
              }
              handleCastVote();
            }}
            disabled={submitting}
            style={[
              styles.actionCastBtn,
              ((!selectedCandidateId || submitting) && isVotingActive) && styles.actionCastBtnDisabled,
              !isVotingActive && { opacity: 0.8 }
            ]}
          >
            <LinearGradient
              colors={!isVotingActive ? ['#94a3b8', '#64748b'] : (selectedCandidateId ? ['#4f46e5', '#3730a3'] : ['#c3c6d6', '#c3c6d6'])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionCastGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name={isVotingActive ? "verified" : "lock"} size={22} color="#fff" />
                  <Text style={styles.actionCastBtnText}>
                    {isVotingActive ? 'Cast Secure Vote' : 'Voting Unavailable'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconContainer}>
              <MaterialIcons name="check-circle" size={48} color={COLORS.onSecondaryContainer} />
            </View>
            <Text style={styles.successTitle}>Vote Submitted</Text>
            <Text style={styles.successSub}>
              Your choice has been securely recorded on the precinct ledger. Your receipt ID: <Text style={{fontWeight: '700'}}>{existingVote?.receipt_hash?.substring(0, 12) || '#VX-9821-AZ'}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.returnBtn}
              onPress={() => {
                setShowSuccessModal(false);
                handleBack();
              }}
            >
              <Text style={styles.returnBtnText}>Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Membership / Payment Modal */}
      <Modal transparent visible={showMembershipModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.membershipBox}>
            <View style={[styles.membershipIconCircle, { backgroundColor: COLORS.primary + '10' }]}>
               <MaterialIcons 
                name="card-membership" 
                size={40} 
                color={COLORS.primary} 
               />
            </View>
            
            <Text style={styles.membershipTitle}>
              Membership Plan Required
            </Text>
            
            <Text style={styles.membershipSub}>
              To participate in voting, please select a Membership Plan and complete the payment.
            </Text>

            <View style={{ width: '100%', minHeight: 150, maxHeight: 350, marginBottom: 20 }}>
              {fetchingPlans ? (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingPlansText}>Fetching available plans...</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {plans.length > 0 ? (
                    plans.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        activeOpacity={0.8}
                        style={[
                          styles.planSelectCard,
                          selectedPlanId === plan.id && styles.planSelectCardActive
                        ]}
                        onPress={() => setSelectedPlanId(plan.id)}
                      >
                        <View style={styles.planSelectInfo}>
                          <Text style={[styles.planSelectName, selectedPlanId === plan.id && styles.planSelectTextActive]}>
                            {plan.name}
                          </Text>
                          <Text style={[styles.planSelectPrice, selectedPlanId === plan.id && styles.planSelectTextActive, { opacity: 0.8 }]}>
                            ₹{plan.price} / {plan.period || 'one-time'}
                          </Text>
                        </View>
                        <View style={[
                          styles.selectionCheckCircle,
                          selectedPlanId === plan.id && styles.selectionCheckCircleActive
                        ]}>
                          {selectedPlanId === plan.id && (
                            <MaterialIcons name="check" size={16} color={COLORS.primary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyPlansContainer}>
                       <Text style={styles.emptyPlansText}>No membership plans found.</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>

            <View style={styles.membershipActions}>
              <TouchableOpacity 
                style={[
                  styles.membershipMainBtn, 
                  { backgroundColor: COLORS.primary },
                  (!selectedPlanId || isProcessingPayment) && styles.membershipMainBtnDisabled
                ]}
                onPress={() => handleRealPayment()}
                disabled={isProcessingPayment || !selectedPlanId}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.membershipMainBtnText}>
                    Pay & Activate
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.membershipCancelBtn}
                onPress={() => !isProcessingPayment && setShowMembershipModal(false)}
                disabled={isProcessingPayment}
              >
                <Text style={styles.membershipCancelText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Session Detail Header Info
  sessionHeaderInfo: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sessionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.8,
  },

  nominationBtn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#f4511e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  nominationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  nominationBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  instructionBannerMini: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  instructionHeaderSmall: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  instructionDetailSmall: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    opacity: 0.7,
  },

  // Hero Header Styles
  heroHeader: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  heroContent: {
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitlePre: {
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  heroTitleMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: -4,
    letterSpacing: -1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  heroSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: { 
        outlineStyle: 'none' 
      }
    })
  },

  // Premium Filter Tab Styles
  premiumFilterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 6,
    marginBottom: 24,
    gap: 6,
  },
  premiumFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  premiumFilterTabActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  premiumFilterTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  premiumFilterTabTextActive: {
    color: '#fff',
  },

  premiumCandidatesGrid: {
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  gridCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },
  gridCardVoted: {
    borderColor: COLORS.secondary,
  },
  cardInfoTopBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardContent: {
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  gridAvatarWrapper: {
    position: 'relative',
  },
  gridAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  gridCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  votedBadgeAbsolute: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridCardInfo: {
    alignItems: 'center',
    gap: 4,
  },
  gridCandName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  gridCandNameSelected: {
    color: COLORS.primary,
  },
  gridPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gridPartyText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  voteSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  voteSelectBtnActive: {
    backgroundColor: COLORS.primary,
  },
  voteSelectBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  voteSelectBtnTextActive: {
    color: '#fff',
  },
  voteStatusLabel: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
  },
  voteStatusLabelVoted: {
    backgroundColor: COLORS.secondary + '15',
  },
  voteStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
  },
  voteStatusTextVoted: {
    color: COLORS.secondary,
    opacity: 1,
    fontWeight: '900',
  },
  premiumCandidatesList: {
    gap: 12,
    marginTop: 8,
  },
  candRowCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  candRowCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },
  candRowCardVoted: {
    borderColor: COLORS.secondary,
  },
  candRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  candRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowAvatarWrapper: {
    position: 'relative',
  },
  rowAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  rowVotedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candRowInfo: {
    flex: 1,
    gap: 2,
  },
  rowCandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  rowCandNameSelected: {
    color: COLORS.primary,
  },
  rowPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  rowPartyText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  candRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowVoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowVoteBtnActive: {
    backgroundColor: COLORS.primary,
  },
  rowVoteBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  rowVoteBtnTextActive: {
    color: '#fff',
  },
  rowStatusBadge: {
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowStatusBadgeVoted: {
    backgroundColor: COLORS.secondary + '15',
  },
  rowStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
  },
  rowStatusTextVoted: {
    color: COLORS.secondary,
    opacity: 1,
    fontWeight: '900',
  },
  rowInfoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernListContainer: {
    gap: 16,
  },

  // Premium Countdown Timer Styles
  premiumTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timerSegment: {
    alignItems: 'center',
    gap: 4,
  },
  timerValueBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerValueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerLabelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerSeparator: {
    paddingBottom: 14,
  },
  timerSeparatorText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 20,
    fontWeight: '900',
  },

  detailHero: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  detailMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  detailMetaCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailMetaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  detailMetaDividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTypeBadge: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroTypeBadgeText: {
    color: COLORS.onSecondaryContainer,
    fontSize: 10,
    fontWeight: '800',
  },
  detailBodyContainer: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 12,
    opacity: 0.3,
  },
  infoDescText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    opacity: 0.8,
  },
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  instructionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  instructionSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    marginTop: 2,
  },
  nominationActionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },
  nominationActionBtnSolo: {
    marginBottom: 32,
  },
  nominationActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  nominationActionTextWrap: {
    flex: 1,
  },
  nominationActionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nominationActionSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  nominationStatusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  nominationStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nominationStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nominationStatusContent: {
    flex: 1,
    minWidth: 0,
  },
  nominationStatusEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  nominationStatusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  nominationStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nominationStatusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  nominationStatusDetail: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 19,
    marginTop: 12,
  },
  nominationStatusMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  nominationStatusMetaItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
  },
  nominationStatusMetaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  nominationStatusMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 4,
  },
  withdrawNominationBtn: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawNominationText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  candidateCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  candidateCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  premiumCandidatesGrid: {
    gap: 14,
  },
  premiumCandidateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  premiumCandidateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8faff',
  },
  candCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  candAvatarContainer: {
    position: 'relative',
  },
  candAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 2,
    borderColor: '#fff',
  },
  candCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candInfoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candCardBody: {
    marginTop: 12,
    gap: 4,
  },
  candName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  candPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  candPartyText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  candSelectionHighlight: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 5,
    backgroundColor: COLORS.primary,
  },
  secureFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    marginBottom: 20,
  },
  secureFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    opacity: 0.4,
  },
  floatingVoteBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  floatingBarFade: {
    position: 'absolute',
    top: -40, left: 0, right: 0,
    height: 40,
  },
  actionCastBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  actionCastBtnDisabled: {
    opacity: 0.5,
  },
  actionCastGradient: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionCastBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumElecCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }
    })
  },
  premiumElecLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  premiumElecLeft: {
    alignItems: 'center',
    width: 64,
  },
  premiumDateBlock: {
    width: 60,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumDateMonth: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumDateDay: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: -2,
  },
  premiumElecCenter: {
    flex: 1,
    paddingVertical: 2,
    gap: 4,
  },
  premiumElecTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.4,
  },
  premiumDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumDetailText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    opacity: 0.8,
  },
  premiumDescSnippet: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.7,
  },
  premiumFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  premiumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  premiumStatDivider: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.4,
  },
  premiumElecRight: {
    justifyContent: 'center',
  },
  premiumArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyCandidatesBox: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
  },
  emptyCandidatesText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  paginationWrapper: {
    marginTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { 
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)' 
      }
    })
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  pageBtnDisabled: {
    opacity: 0.2,
  },
  pageNumbersRow: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 6,
  },
  pageNumberBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pageNumberBtnActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { 
        boxShadow: `0px 4px 6px ${COLORS.primary}4D` 
      }
    })
  },
  pageNumberText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  pageNumberTextActive: {
    color: '#fff',
  },

  // Missing Candidate Card Styles
  listSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
    opacity: 0.6,
  },
  candidatesGrid: { gap: 16 },
  modernCandidateCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { 
        boxShadow: '0px 6px 12px rgba(0,0,0,0.04)' 
      }
    })
  },
  modernCandidateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f6faff',
  },
  candidateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  candidateAvatarContainer: {
    width: 70,
    height: 70,
    position: 'relative',
  },
  modernCandidateImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 3,
    borderColor: '#fff',
  },
  selectionCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candidateMainInfo: {
    flex: 1,
  },
  modernCandidateName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  modernPartyBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  modernPartyText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  detailsIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: COLORS.primary,
  },
  auditDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  auditText: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 16,
  },
  modernBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  bottomBarFade: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  modernCastBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 },
      web: { 
        boxShadow: `0px 10px 20px ${COLORS.primary}4D` 
      }
    })
  },
  modernCastBtnDisabled: {
    opacity: 0.6,
  },
  castBtnGradient: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modernCastBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successBox: { backgroundColor: '#fff', width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
  successIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  returnBtn: { backgroundColor: COLORS.surfaceContainerHighest, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  returnBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  
  // Membership Modal Styles
  membershipBox: { 
    backgroundColor: '#fff', 
    width: '100%', 
    borderRadius: 28, 
    padding: 24, 
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 10 }
    })
  },
  membershipIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  membershipTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: COLORS.onSurface, 
    marginBottom: 10,
    textAlign: 'center'
  },
  membershipSub: { 
    fontSize: 15, 
    color: COLORS.onSurfaceVariant, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 28,
    opacity: 0.8
  },
  membershipActions: { 
    width: '100%', 
    gap: 12 
  },
  membershipMainBtn: { 
    paddingVertical: 16, 
    borderRadius: 16, 
    width: '100%', 
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  membershipMainBtnText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#fff',
    letterSpacing: 0.5
  },
  membershipCancelBtn: { 
    paddingVertical: 14, 
    width: '100%', 
    alignItems: 'center' 
  },
  membershipCancelText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.onSurfaceVariant 
  },

  planSelectCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  planSelectCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryContainer,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 }
    })
  },
  planSelectInfo: {
    flex: 1,
  },
  planSelectName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.2,
  },
  planSelectPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  planSelectTextActive: {
    color: '#fff',
  },
  selectionCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectionCheckCircleActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  modalLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingPlansText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  emptyPlansContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPlansText: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 14,
  },
  membershipMainBtnDisabled: {
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
  },

  // Premium Nomination Detail Styles
  nominationDeepDetailContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 },
    }),
  },
  nominationStatusHero: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nominationStatusHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  nominationStatusHeroTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  nominationStatusHeroSub: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    opacity: 0.8,
  },
  nominationTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  timelineItem: {
    alignItems: 'center',
    gap: 6,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
    marginTop: -18,
  },
  timelineConnectorActive: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 8,
    marginTop: -18,
  },
  timelineText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
  },
  nominationInfoGrid: {
    padding: 20,
    gap: 20,
  },
  infoGridSection: {
    gap: 12,
  },
  infoGridSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
    opacity: 0.5,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoGridItem: {
    flex: 1,
  },
  infoGridLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    marginBottom: 2,
  },
  infoGridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  premiumWithdrawBtn: {
    margin: 20,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#b91c1c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#b91c1c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  premiumWithdrawBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  nominationFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 20,
    opacity: 0.5,
  },
  nominationFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
});

export default VotingScreen;
