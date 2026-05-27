import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaBalanceScale, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { loginUser, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'superadmin') navigate('/dashboard', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, navigate]);

  // Show error toast when auth error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const validationErrors = validate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(validationErrors).length > 0) return;
    const result = await dispatch(loginUser({ email: form.email, password: form.password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      const returnedUser = result.payload?.user
      if (returnedUser?.role === 'superadmin') navigate('/dashboard', { replace: true })
      else navigate('/', { replace: true })
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#000815] to-gray-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#0051D5] opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0051D5] opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-[#0051D5] to-[#0051D5] px-8 py-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <FaBalanceScale className="text-white text-xl" />
              </div>
              <span className="text-white text-2xl font-bold tracking-wide">
                Vote<span className="text-[#e6edfb]">Admin</span>
              </span>
            </div>
            <p className="text-[#e6edfb] text-sm font-medium">Digital Voting Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sign in to your account</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
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
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="admin@voteadmin.com"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0051D5] focus:border-transparent ${
                      touched.email && validationErrors.email
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  />
                </div>
                {touched.email && validationErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0051D5] focus:border-transparent ${
                      touched.password && validationErrors.password
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
                {touched.password && validationErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors.password}</p>
                )}
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-semibold text-[#0051D5] hover:text-[#0051D5] hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0051D5] hover:bg-[#0051D5] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Register link removed - registration disabled */}
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Secure admin panel &mdash; unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
