import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaBalanceScale, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { registerUser, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../store/slices/authSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    tenant_id: '',
    designation: '',
    street_address: '',
    city: '',
    district: '',
    state: '',
    country: '',
    pincode: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }))
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name) errs.full_name = 'Full name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.phone) errs.phone = 'Phone is required'
    else if (!/^\+?[0-9\s\-()]{7,20}$/.test(form.phone)) errs.phone = 'Enter a valid phone number'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!form.designation) errs.designation = 'Designation is required'
    if (!form.street_address) errs.street_address = 'Street address is required'
    if (!form.city) errs.city = 'City is required'
    if (!form.district) errs.district = 'District is required'
    if (!form.state) errs.state = 'State is required'
    if (!form.country) errs.country = 'Country is required'
    if (!form.pincode) errs.pincode = 'Pincode is required'
    return errs
  }

  const validationErrors = validate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({
      full_name: true,
      email: true,
      phone: true,
      password: true,
      designation: true,
      street_address: true,
      city: true,
      district: true,
      state: true,
      country: true,
      pincode: true,
    })
    if (Object.keys(validationErrors).length > 0) return

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      tenant_id: form.tenant_id ? Number(form.tenant_id) : null,
      designation: form.designation.trim(),
      street_address: form.street_address.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pincode: form.pincode.trim(),
    }

    try {
      await dispatch(registerUser(payload)).unwrap()
      toast.success('Member registration submitted. Please verify your email with the OTP sent.')
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Registration failed', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <FaBalanceScale className="text-white text-xl" />
              </div>
              <span className="text-white text-2xl font-bold tracking-wide">
                Vote<span className="text-indigo-200">Admin</span>
              </span>
            </div>
            <p className="text-indigo-200 text-sm font-medium">Digital Voting Management System</p>
          </div>

          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create a member account</h2>
              <p className="text-gray-500 text-sm mt-1">Internal party members only</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400 text-sm" />
                  </div>
                  <input
                    id="full_name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Jane Doe"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      touched.full_name && validationErrors.full_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  />
                </div>
                {touched.full_name && validationErrors.full_name && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors.full_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
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
                    placeholder="jane@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      touched.email && validationErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  />
                </div>
                {touched.email && validationErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    touched.phone && validationErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                />
                {touched.phone && validationErrors.phone && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-semibold text-gray-700 mb-1.5">Designation</label>
                <input
                  id="designation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="President, Vice President, Secretary"
                  className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    touched.designation && validationErrors.designation ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                />
                {touched.designation && validationErrors.designation && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors.designation}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Create a strong password"
                    className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      touched.password && validationErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
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

              <div>
                <label htmlFor="tenant_id" className="block text-sm font-semibold text-gray-700 mb-1.5">Tenant ID (optional)</label>
                <input
                  id="tenant_id"
                  name="tenant_id"
                  type="number"
                  value={form.tenant_id}
                  onChange={handleChange}
                  className="w-full pr-4 py-2.5 text-sm rounded-lg border border-gray-300 bg-white hover:border-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['street_address', 'Street Address'],
                  ['city', 'City'],
                  ['district', 'District'],
                  ['state', 'State'],
                  ['country', 'Country'],
                  ['pincode', 'Pincode'],
                ].map(([name, label]) => (
                  <div key={name} className={name === 'street_address' ? 'sm:col-span-2' : ''}>
                    <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <input
                      id={name}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        touched[name] && validationErrors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    />
                    {touched[name] && validationErrors[name] && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">{validationErrors[name]}</p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-sm text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">Secure admin panel &mdash; unauthorized access is prohibited</p>
      </div>
    </div>
  )
}
