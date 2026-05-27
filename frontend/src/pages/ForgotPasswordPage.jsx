import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaBalanceScale, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#000815] to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[rgb(16_102_177)] opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[rgb(16_102_177)] opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-[rgb(16_102_177)] to-[rgb(16_102_177)] px-8 py-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <FaBalanceScale className="text-white text-xl" />
              </div>
              <span className="text-white text-2xl font-bold tracking-wide">
                Vote<span className="text-[#e6edfb]">Admin</span>
              </span>
            </div>
            <p className="text-[#e6edfb] text-sm font-medium">Reset your password</p>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your email address and we&apos;ll send you an OTP to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400 text-sm" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@voteadmin.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[rgb(16_102_177)] hover:bg-[rgb(16_102_177)] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[rgb(16_102_177)] transition-colors"
                >
                  <FaArrowLeft className="text-[10px]" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
