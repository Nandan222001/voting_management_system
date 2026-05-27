import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaShieldAlt, FaLock, FaEye, FaEyeSlash, FaIdCard, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { loginUser, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../store/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
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
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center">
          <div className="w-12 h-12 bg-[#1a2b6b] rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold tracking-tight">CI</span>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1066b1]">Civic Integrity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Authorized Voting Portal</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">

        {/* Email/ID */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email/ID</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaIdCard className="text-gray-400 text-sm" />
            </div>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your ID or email"
              className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                touched.email && validationErrors.email
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            />
          </div>
          {touched.email && validationErrors.email && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-800">Password</label>
            <button type="button" className="text-xs font-semibold text-blue-600 hover:underline">
              Forgot Password
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="text-gray-400 text-sm" />
            </div>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              className={`w-full pl-9 pr-11 py-2.5 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                touched.password && validationErrors.password
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
            </button>
          </div>
          {touched.password && validationErrors.password && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
          )}
        </div>

        {/* Secure Login Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#1B4FD8] hover:bg-[#1640B8] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaShieldAlt className="text-base" />
          )}
          {loading ? 'Signing in...' : 'Secure Login'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Request Credentials */}
        <p className="text-center text-sm text-gray-500 mb-3">Need an account or assistance?</p>
        <button
          type="button"
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
        >
          Request Credentials
        </button>
      </div>

      {/* Verified badge */}
      <div className="mt-5 flex items-center gap-2 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full">
        <FaCheckCircle className="text-green-400 text-sm" />
        Verified by SecureVote
      </div>

      {/* Footer links */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <button type="button" className="hover:text-gray-600 transition-colors">Privacy Policy</button>
        <span>·</span>
        <button type="button" className="hover:text-gray-600 transition-colors">Terms of Service</button>
      </div>
    </div>
  );
}
