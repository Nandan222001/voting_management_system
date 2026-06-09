import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaShieldAlt, FaArrowRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import authService from '../services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('OTP sent to your email');
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a337e] text-white mb-4 shadow-lg shadow-indigo-200">
            <FaShieldAlt size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">SecureVote</h1>
          <p className="text-gray-500 mt-2 font-medium">Reset your account password</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Forgot Password?</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your email address and we&apos;ll send you an OTP to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a337e] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#1a337e]/5 focus:border-[#1a337e] transition-all font-medium"
                  placeholder="admin@securevote.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#1a337e] hover:bg-[rgb(12_85_148)] disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 group active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Send Reset OTP
                  <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1a337e] hover:underline transition-colors"
              >
                <FaArrowLeft className="text-xs" />
                Back to Login
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center mt-8 text-sm text-gray-400 font-medium">
          Protected by end-to-end encryption and blockchain verification.
        </p>
      </div>
    </div>
  );
}
