<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaUser, 
  FaCalendarAlt, 
  FaIdBadge, 
  FaEnvelope, 
  FaPhone, 
  FaLock, 
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaRocket,
  FaGem
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import planService from '../services/planService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AppLogo from '../components/common/AppLogo';

const getPlanIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('elite') || n.includes('gold') || n.includes('premium')) return FaGem;
  if (n.includes('active') || n.includes('pro') || n.includes('silver')) return FaRocket;
  return AppLogo;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    voterId: '',
    membership_plan_id: null,
  });
  
  const [paymentData, setPaymentData] = useState({
    razorpay_order_id: '',
    razorpay_payment_id: '',
    razorpay_signature: '',
  });

  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (step === 2) {
      fetchPlans();
    }
  }, [step]);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const response = await planService.getPublicPlans();
      setPlans(response.data.data.items || []);
    } catch (error) {
      toast.error('Failed to load membership plans.');
    } finally {
      setPlansLoading(false);
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName) errs.fullName = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.phone) errs.phone = 'Phone number is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (!form.voterId) errs.voterId = 'Voter ID is required';
    return errs;
  };

  const errors = validateStep1();

  const handleNext = (e) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, password: true, voterId: true });
    if (Object.keys(errors).length === 0) {
      setStep(2);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentAndRegister = async (plan) => {
    if (plan.price > 0) {
      setLoading(true);
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Razorpay SDK failed to load. Check your connection.');
          return;
        }

        // 1. Create Order
        const orderRes = await authService.createRegistrationPaymentOrder({
          membership_plan_id: plan.id
        });
        const order = orderRes.data;

        // 2. Open Razorpay
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'VBA Connect',
          description: `Registration for ${plan.name}`,
          order_id: order.razorpay_order_id,
          handler: async (response) => {
            await finalizeRegistration({
              ...form,
              membership_plan_id: plan.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: form.fullName,
            email: form.email,
            contact: form.phone
          },
          theme: { color: '#1a337e' },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.error('Payment cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        setLoading(false);
        toast.error(error.response?.data?.detail || 'Failed to initiate payment.');
      }
    } else {
      // Free plan
      await finalizeRegistration({
        ...form,
        membership_plan_id: plan.id
      });
    }
  };

  const finalizeRegistration = async (payload) => {
    setLoading(true);
    try {
      // Convert camelCase to snake_case for API
      const apiPayload = {
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        date_of_birth: payload.dateOfBirth,
        voter_id: payload.voterId,
        membership_plan_id: payload.membership_plan_id,
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
      };

      await authService.register(apiPayload);
      toast.success('Registration successful! Please verify your OTP.');
      navigate('/otp', { state: { email: payload.email } });
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a337e] focus:border-transparent ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-gray-300 bg-white'
    }`;

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <AppLogo className="w-8 h-8" />
          <span className="font-bold text-[#1a337e] text-base">VBA Connect</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1a337e] flex items-center justify-center">
          <span className="text-white text-sm font-bold">CV</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {/* Heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#1a337e]">Voter Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? 'Step 1 of 2: Create your secure identity profile.' : 'Step 2 of 2: Select your membership plan.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-6">
          <div 
            className="h-full bg-[#1a337e] rounded-full transition-all duration-300" 
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 text-sm" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Legal name as on ID"
                  className={inputClass('fullName')}
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 text-sm" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="name@example.com"
                  className={inputClass('email')}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400 text-sm" />
                </div>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+91 98765 43210"
                  className={inputClass('phone')}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 text-sm" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min. 8 characters"
                  className={inputClass('password')}
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* National ID / Voter ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                National ID / Voter ID Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdBadge className="text-gray-400 text-sm" />
                </div>
                <input
                  name="voterId"
                  type="text"
                  value={form.voterId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter registration number"
                  className={inputClass('voterId')}
                />
              </div>
              {touched.voterId && errors.voterId && (
                <p className="mt-1 text-xs text-red-500">{errors.voterId}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1a337e] hover:bg-[rgb(12_85_148)] text-white font-semibold rounded-xl transition-colors text-sm shadow-sm mt-2 flex items-center justify-center gap-2"
            >
              Continue to Plans
              <FaArrowRight size={14} />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1a337e] hover:underline mb-2"
            >
              <FaArrowLeft size={10} />
              Back to Profile
            </button>

            {plansLoading ? (
              <div className="py-20 flex justify-center"><LoadingSpinner /></div>
            ) : plans.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-400 font-medium">No plans available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {plans.map((plan) => {
                  const Icon = getPlanIcon(plan.name);
                  return (
                    <button
                      key={plan.id}
                      disabled={loading}
                      onClick={() => handlePaymentAndRegister(plan)}
                      className={`relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#1a337e] hover:shadow-md active:scale-[0.98]'
                      } border-gray-200 bg-white`}
                    >
                      <div className="flex w-full justify-between items-start mb-3">
                        <div className="p-2.5 bg-blue-50 text-[#1a337e] rounded-xl">
                          <Icon size={18} />
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-gray-900">₹{plan.price}</span>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{plan.period || 'one-time'}</p>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{plan.description}</p>
                      
                      <div className="w-full flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                        <span className="text-[10px] font-black text-[#1a337e] uppercase tracking-widest">
                          {plan.price > 0 ? 'Secure Payment' : 'Free Access'}
                        </span>
                        <FaChevronRight size={10} className="text-gray-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {loading && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                  <LoadingSpinner />
                  <p className="text-sm font-bold text-[#1a337e] animate-pulse">Initializing Secure Gateway...</p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1a337e] font-semibold hover:underline">
            Login
          </Link>
        </p>

        {/* Protocol badge */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2 border border-green-500 text-green-600 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full">
            <FaShieldAlt className="text-green-500" />
            Sovereign Identity Protocol Active
          </div>
        </div>
      </div>
    </div>
  );
}

function FaChevronRight({ size, className }) {
  return (
    <svg 
      stroke="currentColor" 
      fill="currentColor" 
      strokeWidth="0" 
      viewBox="0 0 320 512" 
      height={size} 
      width={size} 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path>
    </svg>
  );
}
=======
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaUser, 
  FaCalendarAlt, 
  FaIdBadge, 
  FaEnvelope, 
  FaPhone, 
  FaLock, 
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaRocket,
  FaGem
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import planService from '../services/planService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AppLogo from '../components/common/AppLogo';

const getPlanIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('elite') || n.includes('gold') || n.includes('premium')) return FaGem;
  if (n.includes('active') || n.includes('pro') || n.includes('silver')) return FaRocket;
  return AppLogo;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    voterId: '',
    membership_plan_id: null,
  });
  
  const [paymentData, setPaymentData] = useState({
    razorpay_order_id: '',
    razorpay_payment_id: '',
    razorpay_signature: '',
  });

  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (step === 2) {
      fetchPlans();
    }
  }, [step]);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const response = await planService.getPublicPlans();
      setPlans(response.data.data.items || []);
    } catch (error) {
      toast.error('Failed to load membership plans.');
    } finally {
      setPlansLoading(false);
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName) errs.fullName = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.phone) errs.phone = 'Phone number is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (!form.voterId) errs.voterId = 'Voter ID is required';
    return errs;
  };

  const errors = validateStep1();

  const handleNext = (e) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, password: true, voterId: true });
    if (Object.keys(errors).length === 0) {
      setStep(2);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentAndRegister = async (plan) => {
    if (plan.price > 0) {
      setLoading(true);
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Razorpay SDK failed to load. Check your connection.');
          return;
        }

        // 1. Create Order
        const orderRes = await authService.createRegistrationPaymentOrder({
          membership_plan_id: plan.id
        });
        const order = orderRes.data;

        // 2. Open Razorpay
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'VBA Connect',
          description: `Registration for ${plan.name}`,
          order_id: order.razorpay_order_id,
          handler: async (response) => {
            await finalizeRegistration({
              ...form,
              membership_plan_id: plan.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          prefill: {
            name: form.fullName,
            email: form.email,
            contact: form.phone
          },
          theme: { color: '#1a337e' },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.error('Payment cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        setLoading(false);
        toast.error(error.response?.data?.detail || 'Failed to initiate payment.');
      }
    } else {
      // Free plan
      await finalizeRegistration({
        ...form,
        membership_plan_id: plan.id
      });
    }
  };

  const finalizeRegistration = async (payload) => {
    setLoading(true);
    try {
      // Convert camelCase to snake_case for API
      const apiPayload = {
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        date_of_birth: payload.dateOfBirth,
        voter_id: payload.voterId,
        membership_plan_id: payload.membership_plan_id,
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
      };

      await authService.register(apiPayload);
      toast.success('Registration successful! Please verify your OTP.');
      navigate('/otp', { state: { email: payload.email } });
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a337e] focus:border-transparent ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-gray-300 bg-white'
    }`;

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <AppLogo className="w-8 h-8" />
          <span className="font-bold text-[#1a337e] text-base">VBA Connect</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1a337e] flex items-center justify-center">
          <span className="text-white text-sm font-bold">CV</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {/* Heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#1a337e]">Voter Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? 'Step 1 of 2: Create your secure identity profile.' : 'Step 2 of 2: Select your membership plan.'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-6">
          <div 
            className="h-full bg-[#1a337e] rounded-full transition-all duration-300" 
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 text-sm" />
                </div>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Legal name as on ID"
                  className={inputClass('fullName')}
                />
              </div>
              {touched.fullName && errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 text-sm" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="name@example.com"
                  className={inputClass('email')}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400 text-sm" />
                </div>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+91 98765 43210"
                  className={inputClass('phone')}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 text-sm" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min. 8 characters"
                  className={inputClass('password')}
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* National ID / Voter ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                National ID / Voter ID Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdBadge className="text-gray-400 text-sm" />
                </div>
                <input
                  name="voterId"
                  type="text"
                  value={form.voterId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter registration number"
                  className={inputClass('voterId')}
                />
              </div>
              {touched.voterId && errors.voterId && (
                <p className="mt-1 text-xs text-red-500">{errors.voterId}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1a337e] hover:bg-[rgb(12_85_148)] text-white font-semibold rounded-xl transition-colors text-sm shadow-sm mt-2 flex items-center justify-center gap-2"
            >
              Continue to Plans
              <FaArrowRight size={14} />
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1a337e] hover:underline mb-2"
            >
              <FaArrowLeft size={10} />
              Back to Profile
            </button>

            {plansLoading ? (
              <div className="py-20 flex justify-center"><LoadingSpinner /></div>
            ) : plans.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-400 font-medium">No plans available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {plans.map((plan) => {
                  const Icon = getPlanIcon(plan.name);
                  return (
                    <button
                      key={plan.id}
                      disabled={loading}
                      onClick={() => handlePaymentAndRegister(plan)}
                      className={`relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#1a337e] hover:shadow-md active:scale-[0.98]'
                      } border-gray-200 bg-white`}
                    >
                      <div className="flex w-full justify-between items-start mb-3">
                        <div className="p-2.5 bg-blue-50 text-[#1a337e] rounded-xl">
                          <Icon size={18} />
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-gray-900">₹{plan.price}</span>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{plan.period || 'one-time'}</p>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{plan.description}</p>
                      
                      <div className="w-full flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                        <span className="text-[10px] font-black text-[#1a337e] uppercase tracking-widest">
                          {plan.price > 0 ? 'Secure Payment' : 'Free Access'}
                        </span>
                        <FaChevronRight size={10} className="text-gray-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {loading && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                  <LoadingSpinner />
                  <p className="text-sm font-bold text-[#1a337e] animate-pulse">Initializing Secure Gateway...</p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1a337e] font-semibold hover:underline">
            Login
          </Link>
        </p>

        {/* Protocol badge */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2 border border-green-500 text-green-600 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full">
            <FaShieldAlt className="text-green-500" />
            Sovereign Identity Protocol Active
          </div>
        </div>
      </div>
    </div>
  );
}

function FaChevronRight({ size, className }) {
  return (
    <svg 
      stroke="currentColor" 
      fill="currentColor" 
      strokeWidth="0" 
      viewBox="0 0 320 512" 
      height={size} 
      width={size} 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path>
    </svg>
  );
}
>>>>>>> fa346d3c9268015db5f8ecd6de67a3eff14d52ab
