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
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { electionService } from '../services/electionService';
import { nominationService } from '../services/nominationService';
import { paymentService } from '../services/paymentService';
import { planService } from '../services/planService';
import { showToast } from '../utils/toast';
import Header from '../components/common/Header';
import { useAuth } from '../context/AuthContext';
import { hs, vs, ms, hp, wp } from '../utils/responsive';

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
  const [refreshing, setRefreshing] = useState(false);
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
    setSelectedElection(routeElection);
  }, [routeElection]);

  useEffect(() => {
    if (selectedElection) {
      fetchElectionDetails(selectedElection.id);
    } else {
      fetchElections();
    }
  }, [selectedElection, currentPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedElection) {
      await fetchElectionDetails(selectedElection.id, true);
    } else {
      await fetchElections(true);
    }
    setRefreshing(false);
  };

  const fetchElections = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await electionService.getElections(false, 1, 100, 'active');
      const electionList = Array.isArray(response) ? response : (response?.data || []);
      setElections(electionList);
    } catch (error) {
      console.error("Failed to load elections", error);
      showToast.error("Error", "Failed to load elections.");
    } finally {
      if (!silent) setLoading(false);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);

  const fetchElectionDetails = async (electionId: number, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [cands, voteResponse, nominationResponse] = await Promise.all([
        electionService.getCandidates(electionId),
        electionService.getMyVote(electionId).catch(() => null),
        nominationService.getMyForElection(electionId).catch(() => null),
      ]);
      setCandidates(cands);
      setMyNomination(nominationResponse);
      
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
      if (!silent) setLoading(false);
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
        await recordPaymentFailure(membershipPlanId, error);
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
        setShowMembershipModal(true);
        fetchPlans();
        setMembershipModalType(eligibility.membership_selected ? 'pay' : 'select');
        return;
      }

      await electionService.castVote(selectedElection.id, selectedCandidateId);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      fetchElectionDetails(selectedElection.id);
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

  const calculateElectionStatus = () => {
    if (!selectedElection) return null;
    
    const now = new Date().getTime();
    const start = new Date(selectedElection.start_date).getTime();
    const end = new Date(selectedElection.end_date).getTime();
    const dbStatus = selectedElection.status;

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

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        showBack={!!selectedElection} 
        onBack={handleBack} 
        title={selectedElection ? "Election Detail" : "Election Portal"} 
      />
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={{ paddingBottom: selectedElection ? vs(100) : vs(20), paddingTop: 0 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {!selectedElection ? (
          <>
            <LinearGradient
              colors={['#003d9b', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroHeader}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                    <MaterialIcons name="security" size={ms(12)} color="#fff" />
                    <Text style={styles.heroBadgeText}>SECURE PORTAL</Text>
                </View>
                <Text style={styles.heroTitlePre}>Secure</Text>
                <Text style={styles.heroTitleMain}>Election Portal</Text>
                <Text style={styles.heroSub}>Access live and upcoming voting sessions for your administrative district.</Text>
                
                <View style={styles.heroSearchWrapper}>
                    <MaterialIcons name="search" size={ms(20)} color="rgba(255,255,255,0.7)" style={{ marginRight: hs(8) }} />
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
                        <MaterialIcons name="close" size={ms(18)} color="#fff" />
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            </LinearGradient>

            <View style={{ paddingHorizontal: hs(16) }}>
              <View style={styles.premiumFilterContainer}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.premiumFilterTab, selectedFilter === 'active' && styles.premiumFilterTabActive]}
                  onPress={() => setSelectedFilter('active')}
                >
                  <MaterialIcons 
                    name="sensors" 
                    size={ms(20)} 
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
                    size={ms(20)} 
                    color={selectedFilter === 'upcoming' ? '#fff' : COLORS.onSurfaceVariant} 
                  />
                  <Text style={[styles.premiumFilterTabText, selectedFilter === 'upcoming' && styles.premiumFilterTabTextActive]}>Upcoming</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modernListContainer}>
                {paginatedElections.length === 0 ? (
                  <View style={styles.emptyCandidatesBox}>
                    <MaterialIcons name="how-to-vote" size={ms(48)} color={COLORS.outlineVariant} />
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
                           <View style={styles.premiumElecLeft}>
                              <View style={[styles.premiumDateBlock, { backgroundColor: accentColor + '10' }]}>
                                 <Text style={[styles.premiumDateMonth, { color: accentColor }]}>
                                    {new Date(elec.start_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                                 </Text>
                                 <Text style={[styles.premiumDateDay, { color: COLORS.onSurface }]}>
                                    {new Date(elec.start_date).getDate()}
                                 </Text>
                              </View>
                              <View style={[styles.minimalStatusBadge, { backgroundColor: accentColor + '15', marginTop: vs(12) }]}>
                                <View style={[styles.liveDotSmall, { backgroundColor: accentColor }]} />
                                <Text style={[styles.statusBadgeTextSmall, { color: accentColor }]}>
                                  {isLive ? 'LIVE' : 'UPCOMING'}
                                </Text>
                              </View>
                           </View>

                           <View style={styles.premiumElecCenter}>
                              <Text style={styles.premiumElecTitle} numberOfLines={1}>{elec.title}</Text>
                              
                              <View style={styles.premiumDetailRow}>
                                 <MaterialIcons name="location-on" size={ms(14)} color={COLORS.onSurfaceVariant} opacity={0.6} />
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
                                    <MaterialIcons name="people-outline" size={ms(14)} color={COLORS.primary} />
                                    <Text style={styles.premiumStatText}>{elec.candidate_count || 0} Candidates</Text>
                                 </View>
                                 <View style={styles.premiumStatDivider} />
                                 <View style={styles.premiumStatItem}>
                                    <MaterialIcons name="schedule" size={ms(14)} color={COLORS.primary} />
                                    <Text style={styles.premiumStatText}>
                                       {new Date(elec.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                 </View>
                              </View>
                           </View>

                           <View style={styles.premiumElecRight}>
                              <View style={[styles.premiumArrowBtn, { backgroundColor: accentColor + '15' }]}>
                                 <MaterialIcons name="chevron-right" size={ms(20)} color={accentColor} />
                              </View>
                           </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

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
                    <MaterialIcons name="chevron-left" size={ms(24)} color={currentPage === 1 ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
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
                    <MaterialIcons name="chevron-right" size={ms(24)} color={currentPage === currentTotalPages ? COLORS.onSurfaceVariant + '40' : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <LinearGradient
              colors={['#003d9b', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailHero}
            >
              <View style={styles.heroContent}>
                <View style={[styles.heroBadge, statusConfig && { backgroundColor: statusConfig.bg, borderColor: 'transparent' }]}>
                    <MaterialIcons name={statusConfig?.icon || "event-upcoming"} size={ms(12)} color={statusConfig?.color || "#fff"} />
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
                         <Text style={[styles.timerValueText, { fontSize: ms(24), color: 'rgba(255,255,255,0.4)' }]}>-- : -- : --</Text>
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
              <View style={styles.infoCard}>
                <View style={styles.infoCardRow}>
                  <MaterialIcons name="location-on" size={ms(18)} color={COLORS.primary} />
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
                      <MaterialIcons name="assignment-ind" size={ms(22)} color="#fff" />
                      <View style={styles.nominationActionTextWrap}>
                        <Text style={styles.nominationActionTitle}>
                          {myNomination ? 'Nomination Submitted' : 'Nominate Yourself'}
                        </Text>
                        <Text style={styles.nominationActionSub}>
                          {myNomination ? 'Track your application status below' : 'Apply to be a candidate in this session'}
                        </Text>
                      </View>
                      <MaterialIcons name={myNomination ? 'done' : 'chevron-right'} size={ms(20)} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
                    </LinearGradient>
                  </TouchableOpacity>

                  {myNomination && (
                    <View style={styles.nominationStatusCard}>
                      <View style={styles.nominationStatusHeader}>
                        <View style={[styles.nominationStatusIcon, { backgroundColor: nominationStatusMeta.bg }]}>
                          <MaterialIcons name={nominationStatusMeta.icon} size={ms(20)} color={nominationStatusMeta.color} />
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
                              <MaterialIcons name="delete-outline" size={ms(18)} color="#b91c1c" />
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

              <View style={styles.premiumCandidatesList}>
                {candidates.length === 0 ? (
                  <View style={styles.emptyCandidatesBox}>
                    <MaterialIcons name="person-off" size={ms(32)} color={COLORS.outline} />
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
                                  <MaterialIcons name="verified" size={ms(14)} color="#fff" />
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
                                {isSelected && <MaterialIcons name="check-circle" size={ms(16)} color="#fff" />}
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
                              <MaterialIcons name="info-outline" size={ms(20)} color={isSelected ? '#fff' : COLORS.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              <View style={styles.secureFooterNote}>
                <MaterialIcons name="security" size={ms(14)} color={COLORS.onSurfaceVariant} opacity={0.5} />
                <Text style={styles.secureFooterText}>
                  End-to-End Encrypted Session • Protocol V4.2
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

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
                  <MaterialIcons name={isVotingActive ? "verified" : "lock"} size={ms(22)} color="#fff" />
                  <Text style={styles.actionCastBtnText}>
                    {isVotingActive ? 'Cast Secure Vote' : 'Voting Unavailable'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => {
              setShowSuccessModal(false);
              handleBack();
            }} 
          />
          <View style={styles.modalPopup}>
            <View style={styles.modalHandle} />
            <View style={[styles.modalIconBg, { backgroundColor: COLORS.secondary + '10' }]}>
              <MaterialIcons name="verified" size={ms(40)} color={COLORS.secondary} />
            </View>
            <Text style={styles.modalTitle}>Vote Recorded</Text>
            <Text style={styles.modalMessage}>
              Your choice has been securely recorded on the precinct ledger. Your unique receipt ID is below.
            </Text>
            
            <View style={styles.receiptCard}>
              <Text style={styles.receiptLabel}>RECEIPT HASH</Text>
              <Text style={styles.receiptValue}>{existingVote?.receipt_hash?.substring(0, 24) || '#VX-9821-AZ-0021-9921-VBA'}</Text>
            </View>

            <TouchableOpacity 
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowSuccessModal(false);
                handleBack();
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, '#1e40af']}
                style={styles.modalPrimaryBtnGradient}
              >
                <Text style={styles.modalPrimaryBtnText}>Return to Portal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showMembershipModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => !isProcessingPayment && setShowMembershipModal(false)} 
          />
          <View style={styles.modalPopup}>
            <View style={styles.modalHandle} />
            <View style={[styles.modalIconBg, { backgroundColor: COLORS.primary + '10' }]}>
               <MaterialIcons 
                name="card-membership" 
                size={ms(40)} 
                color={COLORS.primary} 
               />
            </View>
            
            <Text style={styles.modalTitle}>Membership Required</Text>
            <Text style={styles.modalMessage}>To participate in this election, please select an active plan and complete the registration fee.</Text>

            <View style={styles.planScrollContainer}>
              {fetchingPlans ? (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingPlansText}>Fetching available plans...</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(10) }}>
                  {plans.length > 0 ? (
                    plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <TouchableOpacity
                          key={plan.id}
                          activeOpacity={0.8}
                          style={[
                            styles.planSelectCard,
                            isSelected && styles.planSelectCardActive
                          ]}
                          onPress={() => setSelectedPlanId(plan.id)}
                        >
                          <View style={styles.planCardContent}>
                            <View style={styles.planCardLeft}>
                               <View style={[styles.planIconCircle, isSelected && styles.planIconCircleActive]}>
                                  <MaterialIcons 
                                    name="stars" 
                                    size={ms(18)} 
                                    color={isSelected ? COLORS.white : COLORS.primary} 
                                  />
                               </View>
                               <View style={styles.planCardInfo}>
                                  <Text style={[styles.planSelectName, isSelected && styles.planSelectTextActive]}>{plan.name}</Text>
                                  <Text style={[styles.planSelectDesc, isSelected && styles.planSelectTextActive]} numberOfLines={1}>{plan.period || 'one-time access'}</Text>
                               </View>
                            </View>
                            
                            <View style={styles.planCardRight}>
                               <Text style={[styles.planSelectPrice, isSelected && styles.planSelectTextActive]}>
                                 ₹{plan.price}
                               </Text>
                               <View style={[styles.selectionCheckCircle, isSelected && styles.selectionCheckCircleActive]}>
                                  {isSelected && <Ionicons name="checkmark" size={ms(14)} color={COLORS.primary} />}
                               </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyPlansContainer}>
                       <Text style={styles.emptyPlansText}>No membership plans found for your region.</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalSecondaryBtn}
                onPress={() => !isProcessingPayment && setShowMembershipModal(false)}
                disabled={isProcessingPayment}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.modalPrimaryBtn, 
                  { flex: 2 },
                  (!selectedPlanId || isProcessingPayment) && { opacity: 0.5 }
                ]}
                onPress={() => handleRealPayment()}
                disabled={isProcessingPayment || !selectedPlanId}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#1e40af']}
                  style={styles.modalPrimaryBtnGradient}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>Activate Now</Text>
                  )}
                </LinearGradient>
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
  scrollContent: { flex: 1 },
  
  heroHeader: {
    paddingTop: vs(20),
    paddingBottom: vs(40),
    paddingHorizontal: hs(20),
    borderBottomLeftRadius: ms(32),
    borderBottomRightRadius: ms(32),
    marginBottom: vs(24),
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  heroContent: {
    gap: vs(8),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: ms(10),
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitlePre: {
    fontSize: ms(20),
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  heroTitleMain: {
    fontSize: ms(32),
    fontWeight: '900',
    color: '#fff',
    marginTop: vs(-4),
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: ms(14),
    color: 'rgba(255,255,255,0.8)',
    lineHeight: vs(20),
    fontWeight: '500',
    marginBottom: vs(12),
  },
  heroSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: ms(16),
    height: vs(54),
    paddingHorizontal: hs(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: ms(16),
    fontWeight: '600',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },

  premiumFilterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: ms(18),
    padding: ms(6),
    marginBottom: vs(24),
    gap: hs(6),
  },
  premiumFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
    paddingVertical: vs(12),
    borderRadius: ms(14),
  },
  premiumFilterTabActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  premiumFilterTabText: {
    fontSize: ms(14),
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  premiumFilterTabTextActive: {
    color: '#fff',
  },

  modernListContainer: {
    gap: vs(16),
  },
  premiumElecCard: {
    backgroundColor: '#fff',
    borderRadius: ms(24),
    padding: hs(14),
    marginBottom: vs(16),
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
    gap: hs(16),
  },
  premiumElecLeft: {
    alignItems: 'center',
    width: hs(64),
  },
  premiumDateBlock: {
    width: hs(60),
    height: vs(68),
    borderRadius: ms(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumDateMonth: {
    fontSize: ms(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumDateDay: {
    fontSize: ms(24),
    fontWeight: '900',
    marginTop: vs(-2),
  },
  minimalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(5),
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  statusBadgeTextSmall: {
    fontSize: ms(9),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveDotSmall: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  premiumElecCenter: {
    flex: 1,
    paddingVertical: vs(2),
    gap: vs(4),
  },
  premiumElecTitle: {
    fontSize: ms(18),
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: -0.4,
  },
  premiumDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
  },
  premiumDetailText: {
    fontSize: ms(12),
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    opacity: 0.8,
  },
  premiumDescSnippet: {
    fontSize: ms(12),
    color: COLORS.onSurfaceVariant,
    lineHeight: vs(18),
    marginTop: vs(4),
    opacity: 0.7,
  },
  premiumFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(8),
    gap: hs(12),
  },
  premiumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(6),
  },
  premiumStatText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: COLORS.primary,
  },
  premiumStatDivider: {
    width: 1,
    height: vs(10),
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.4,
  },
  premiumElecRight: {
    justifyContent: 'center',
  },
  premiumArrowBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    justifyContent: 'center',
    alignItems: 'center',
  },

  paginationWrapper: {
    marginTop: vs(32),
    paddingBottom: vs(40),
    alignItems: 'center',
  },
  resultsInfo: {
    marginBottom: vs(16),
  },
  resultsText: {
    fontSize: ms(13),
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: ms(6),
    borderRadius: ms(30),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)' }
    })
  },
  pageBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  pageBtnDisabled: { opacity: 0.2 },
  pageNumbersRow: {
    flexDirection: 'row',
    marginHorizontal: hs(8),
    gap: hs(6),
  },
  pageNumberBtn: {
    minWidth: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: hs(12),
  },
  pageNumberBtnActive: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { boxShadow: `0px 4px 6px ${COLORS.primary}4D` }
    })
  },
  pageNumberText: {
    fontSize: ms(15),
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  pageNumberTextActive: { color: '#fff' },

  detailHero: {
    paddingTop: vs(20),
    paddingBottom: vs(40),
    paddingHorizontal: hs(20),
    borderBottomLeftRadius: ms(32),
    borderBottomRightRadius: ms(32),
    marginBottom: vs(24),
    ...Platform.select({
      ios: { shadowColor: '#003d9b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
      android: { elevation: 8 }
    })
  },
  detailMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: ms(20),
    padding: hs(16),
    marginTop: vs(20),
    gap: hs(12),
  },
  detailMetaCol: { flex: 1, alignItems: 'center' },
  detailMetaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: ms(9),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: vs(6),
  },
  detailMetaDividerVertical: {
    width: 1,
    height: vs(30),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTypeBadge: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(8),
  },
  heroTypeBadgeText: {
    color: COLORS.onSecondaryContainer,
    fontSize: ms(10),
    fontWeight: '800',
  },
  detailBodyContainer: { paddingHorizontal: hs(16) },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    padding: hs(16),
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  infoCardRow: { flexDirection: 'row', alignItems: 'center', gap: hs(10) },
  infoCardText: { fontSize: ms(14), fontWeight: '700', color: COLORS.onSurface },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: vs(12),
    opacity: 0.3,
  },
  infoDescText: {
    fontSize: ms(13),
    color: COLORS.onSurfaceVariant,
    lineHeight: vs(20),
    opacity: 0.8,
  },
  nominationActionBtn: {
    borderRadius: ms(20),
    overflow: 'hidden',
    marginBottom: vs(12),
    ...Platform.select({
      ios: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },
  nominationActionBtnSolo: { marginBottom: vs(32) },
  nominationActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hs(20),
    gap: hs(16),
  },
  nominationActionTextWrap: { flex: 1 },
  nominationActionTitle: { color: '#fff', fontSize: ms(18), fontWeight: '800', letterSpacing: -0.2 },
  nominationActionSub: { color: 'rgba(255,255,255,0.7)', fontSize: ms(12), fontWeight: '600', marginTop: vs(2) },
  nominationStatusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: ms(18),
    padding: hs(16),
    marginBottom: vs(32),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  nominationStatusHeader: { flexDirection: 'row', alignItems: 'center', gap: hs(12) },
  nominationStatusIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nominationStatusContent: { flex: 1, minWidth: 0 },
  nominationStatusEyebrow: { fontSize: ms(10), fontWeight: '900', color: COLORS.onSurfaceVariant, letterSpacing: 0.8 },
  nominationStatusTitle: { fontSize: ms(16), fontWeight: '800', color: COLORS.onSurface, marginTop: vs(2) },
  nominationStatusBadge: { borderRadius: ms(999), paddingHorizontal: hs(10), paddingVertical: vs(5) },
  nominationStatusBadgeText: { fontSize: ms(10), fontWeight: '900' },
  nominationStatusDetail: { fontSize: ms(13), color: COLORS.onSurfaceVariant, lineHeight: vs(19), marginTop: vs(12) },
  nominationStatusMetaRow: { flexDirection: 'row', gap: hs(12), marginTop: vs(14) },
  nominationStatusMetaItem: { flex: 1, backgroundColor: COLORS.surfaceContainerLow, borderRadius: ms(12), padding: hs(12) },
  nominationStatusMetaLabel: { fontSize: ms(10), fontWeight: '800', color: COLORS.onSurfaceVariant, textTransform: 'uppercase' },
  nominationStatusMetaValue: { fontSize: ms(13), fontWeight: '800', color: COLORS.onSurface, marginTop: vs(4) },
  withdrawNominationBtn: {
    marginTop: vs(14),
    minHeight: vs(44),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
  },
  withdrawNominationText: { color: '#b91c1c', fontSize: ms(13), fontWeight: '800' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(16),
    paddingHorizontal: hs(4),
  },
  sectionTitleLabel: { fontSize: ms(11), fontWeight: '900', color: COLORS.onSurfaceVariant, letterSpacing: 1 },
  candidateCountBadge: { backgroundColor: COLORS.primary, paddingHorizontal: hs(8), paddingVertical: vs(2), borderRadius: ms(10) },
  candidateCountText: { color: '#fff', fontSize: ms(10), fontWeight: '800' },

  premiumCandidatesList: { gap: vs(12), marginTop: vs(8) },
  candRowCard: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  candRowCardSelected: { borderColor: COLORS.primary, backgroundColor: '#f8faff' },
  candRowCardVoted: { borderColor: COLORS.secondary },
  candRowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: hs(12) },
  candRowLeft: { flexDirection: 'row', alignItems: 'center', gap: hs(12), flex: 1 },
  rowAvatarWrapper: { position: 'relative' },
  rowAvatarImg: { width: ms(52), height: ms(52), borderRadius: ms(26), backgroundColor: COLORS.surfaceContainerLow },
  rowVotedBadge: {
    position: 'absolute',
    bottom: vs(-2),
    right: hs(-2),
    backgroundColor: COLORS.secondary,
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  candRowInfo: { flex: 1, gap: vs(2) },
  rowCandName: { fontSize: ms(16), fontWeight: '800', color: COLORS.onSurface },
  rowCandNameSelected: { color: COLORS.primary },
  rowPartyBadge: { backgroundColor: COLORS.surfaceContainerHighest, paddingHorizontal: hs(8), paddingVertical: vs(2), borderRadius: ms(6), alignSelf: 'flex-start' },
  rowPartyText: { fontSize: ms(8), fontWeight: '900', color: COLORS.onSurfaceVariant, letterSpacing: 0.5 },
  candRowRight: { flexDirection: 'row', alignItems: 'center', gap: hs(8) },
  rowVoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(4),
    backgroundColor: COLORS.primary + '10',
    paddingVertical: vs(6),
    paddingHorizontal: hs(12),
    borderRadius: ms(10),
  },
  rowVoteBtnActive: { backgroundColor: COLORS.primary },
  rowVoteBtnText: { fontSize: ms(11), fontWeight: '900', color: COLORS.primary },
  rowVoteBtnTextActive: { color: '#fff' },
  rowStatusBadge: { backgroundColor: COLORS.surfaceContainerLow, paddingVertical: vs(6), paddingHorizontal: hs(12), borderRadius: ms(10) },
  rowStatusBadgeVoted: { backgroundColor: COLORS.secondary + '15' },
  rowStatusText: { fontSize: ms(10), fontWeight: '800', color: COLORS.onSurfaceVariant, opacity: 0.5 },
  rowStatusTextVoted: { color: COLORS.secondary, opacity: 1, fontWeight: '900' },
  rowInfoBtn: { width: ms(32), height: ms(32), borderRadius: ms(16), backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },

  secureFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(6),
    marginTop: vs(32),
    marginBottom: vs(20),
  },
  secureFooterText: { fontSize: ms(10), fontWeight: '700', color: COLORS.onSurfaceVariant, opacity: 0.4 },

  floatingVoteBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: hs(20),
    paddingBottom: Platform.OS === 'ios' ? vs(36) : vs(20),
  },
  floatingBarFade: { position: 'absolute', top: vs(-40), left: 0, right: 0, height: vs(40) },
  actionCastBtn: {
    borderRadius: ms(20),
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 }
    })
  },
  actionCastBtnDisabled: { opacity: 0.5 },
  actionCastGradient: { height: vs(60), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: hs(10) },
  actionCastBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '800', letterSpacing: 0.5 },

  premiumTimerContainer: { flexDirection: 'row', alignItems: 'center', gap: hs(8), marginTop: vs(8) },
  timerSegment: { alignItems: 'center', gap: vs(4) },
  timerValueBox: { width: ms(42), height: ms(42), borderRadius: ms(12), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  timerValueText: { color: '#fff', fontSize: ms(18), fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  timerLabelText: { color: 'rgba(255,255,255,0.5)', fontSize: ms(8), fontWeight: '800', letterSpacing: 0.5 },
  timerSeparator: { paddingBottom: vs(14) },
  timerSeparatorText: { color: 'rgba(255,255,255,0.3)', fontSize: ms(20), fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  modalPopup: { 
    backgroundColor: '#fff', 
    width: '100%', 
    borderTopLeftRadius: ms(32), 
    borderTopRightRadius: ms(32), 
    padding: hs(24), 
    paddingTop: vs(8),
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 20 }
    })
  },
  modalHandle: { width: hs(40), height: vs(5), backgroundColor: '#e2e8f0', borderRadius: ms(3), alignSelf: 'center', marginVertical: vs(12), marginBottom: vs(20) },
  modalIconBg: { width: ms(72), height: ms(72), borderRadius: ms(24), justifyContent: 'center', alignItems: 'center', marginBottom: vs(20) },
  modalTitle: { fontSize: ms(22), fontWeight: '900', color: COLORS.onSurface, marginBottom: vs(10), letterSpacing: -0.5 },
  modalMessage: { fontSize: ms(15), color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: vs(22), marginBottom: vs(24), opacity: 0.8 },
  receiptCard: { backgroundColor: '#f8fafc', width: '100%', padding: hs(16), borderRadius: ms(16), borderWidth: 1, borderColor: '#e2e8f0', marginBottom: vs(24), alignItems: 'center' },
  receiptLabel: { fontSize: ms(10), fontWeight: '800', color: COLORS.onSurfaceVariant, letterSpacing: 1, marginBottom: vs(6) },
  receiptValue: { fontSize: ms(13), fontWeight: '700', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center' },
  modalPrimaryBtn: { width: '100%', height: vs(56), borderRadius: ms(16), overflow: 'hidden' },
  modalPrimaryBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '800', letterSpacing: 0.5 },
  modalSecondaryBtn: { flex: 1, height: vs(56), borderRadius: ms(16), backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalSecondaryBtnText: { fontSize: ms(15), fontWeight: '800', color: COLORS.onSurfaceVariant },
  modalActions: { flexDirection: 'row', gap: hs(12), width: '100%', marginTop: vs(8), marginBottom: vs(12) },
  planScrollContainer: { width: '100%', maxHeight: vs(300), marginBottom: vs(20) },
  planSelectCard: { width: '100%', padding: hs(16), borderRadius: ms(20), backgroundColor: '#f8fafc', marginBottom: vs(10), borderWidth: 1.5, borderColor: '#e2e8f0' },
  planSelectCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 }
    })
  },
  planCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: hs(10) },
  planIconCircle: { width: ms(36), height: ms(36), borderRadius: ms(10), backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: hs(12) },
  planIconCircleActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  planCardInfo: { flex: 1 },
  planSelectName: { fontSize: ms(16), fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.2 },
  planSelectDesc: { fontSize: ms(11), color: COLORS.onSurfaceVariant, marginTop: vs(2), fontWeight: '600' },
  planSelectPrice: { fontSize: ms(18), fontWeight: '900', color: COLORS.onSurface, letterSpacing: -0.5 },
  planSelectTextActive: { color: '#fff' },
  planCardRight: { alignItems: 'flex-end', gap: vs(6) },
  selectionCheckCircle: { width: ms(24), height: ms(24), borderRadius: ms(12), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  selectionCheckCircleActive: { backgroundColor: '#fff', borderColor: '#fff' },
  modalLoaderContainer: { paddingVertical: vs(40), alignItems: 'center' },
  loadingPlansText: { marginTop: vs(12), fontSize: ms(14), color: COLORS.onSurfaceVariant, fontWeight: '600' },
  emptyPlansContainer: { padding: hs(40), alignItems: 'center' },
  emptyPlansText: { color: COLORS.onSurfaceVariant, textAlign: 'center', fontSize: ms(14) },
});

export default VotingScreen;
