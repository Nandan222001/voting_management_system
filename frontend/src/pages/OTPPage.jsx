import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaShieldAlt, FaClock, FaArrowRight } from 'react-icons/fa';
import AppLogo from '../components/common/AppLogo';
import toast from 'react-hot-toast';
import { verifyOTP, clearError } from '../store/slices/authSlice';

const OTP_LENGTH = 6;

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const email = location.state?.email;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(178); // 02:58
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    e.preventDefault();
  };

  const handleResend = () => setSeconds(178);

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === OTP_LENGTH) {
      dispatch(verifyOTP({ email, otp: otpCode }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col">

      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <AppLogo className="w-8 h-8" />
          <span className="font-bold text-[#1a337e] text-base">VBA Connect</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-700 text-sm font-bold">JD</span>
        </div>
      </nav>

      {/* Encrypted banner */}
      <div className="bg-green-50 border-b border-green-100 px-5 py-2.5 flex items-center justify-center gap-2">
        <FaShieldAlt className="text-green-600 text-sm" />
        <span className="text-green-700 text-xs font-semibold">Encrypted Connection Active</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">

        {/* Heading */}
        <h1 className="text-2xl font-bold text-[#1a337e] text-center mb-2">Identity Verification</h1>
        <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
          We&apos;ve sent a 6-digit verification code to your registered device ending in{' '}
          <span className="font-semibold text-gray-700">••••4209</span>.
        </p>

        {/* OTP Inputs */}
        <div className="flex gap-2.5 justify-center mb-5" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold text-[#1a337e] border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#1a337e] focus:ring-2 focus:ring-blue-200 transition-all"
            />
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <FaClock className="text-gray-400 text-sm" />
          <span className="text-sm text-gray-600">
            Code expires in{' '}
            <span className={`font-semibold ${seconds < 30 ? 'text-red-500' : 'text-gray-800'}`}>
              {formatTime(seconds)}
            </span>
          </span>
        </div>
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-semibold text-[#1a337e] hover:underline"
          >
            Resend Code
          </button>
        </div>

        {/* Security image */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-36 bg-gray-900 flex items-end">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #0d1b2a 0%, #1b2f4b 40%, #0d1b2a 100%)',
            }}
          />
          {/* Simulated server rack dots */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              ))}
            </div>
          </div>
          <div className="relative z-10 px-4 pb-3 flex items-center gap-2">
            <FaShieldAlt className="text-white text-sm" />
            <span className="text-white text-sm font-semibold">256-bit AES Encryption</span>
          </div>
        </div>

        {/* Verify button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={otp.join('').length < OTP_LENGTH}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1a337e] hover:bg-[rgb(12_85_148)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
        >
          Verify &amp; Continue
          <FaArrowRight className="text-sm" />
        </button>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Back to Login
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 tracking-widest uppercase mt-8">
          Official Election Authority System
        </p>
      </div>
    </div>
  );
}
