import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaUser, FaCalendarAlt, FaIdBadge, FaEnvelope } from 'react-icons/fa';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    voterId: '',
    email: '',
  });
  const [touched, setTouched] = useState({});

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  const validate = () => {
    const errs = {};
    if (!form.fullName) errs.fullName = 'Full name is required';
    if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!form.voterId) errs.voterId = 'Voter ID is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    return errs;
  };

  const errors = validate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ fullName: true, dateOfBirth: true, voterId: true, email: true });
    if (Object.keys(errors).length === 0) navigate('/otp');
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-gray-300 bg-white'
    }`;

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col">

      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-[#1B4FD8] text-lg" />
          <span className="font-bold text-[#1066b1] text-base">SecureVote</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1B4FD8] flex items-center justify-center">
          <span className="text-white text-sm font-bold">CV</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">

        {/* Heading */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#1066b1]">Voter Registration</h1>
          <p className="text-sm text-gray-500 mt-1">Step 1 of 2: Create your secure identity profile.</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-6">
          <div className="h-full w-1/2 bg-[#1B4FD8] rounded-full" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

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

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Date of Birth</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendarAlt className="text-gray-400 text-sm" />
              </div>
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass('dateOfBirth')}
              />
            </div>
            {touched.dateOfBirth && errors.dateOfBirth && (
              <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
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

          <button
            type="submit"
            className="w-full py-3 bg-[#1B4FD8] hover:bg-[#1640B8] text-white font-semibold rounded-xl transition-colors text-sm shadow-sm mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1B4FD8] font-semibold hover:underline">
            Login
          </Link>
        </p>

        {/* Protocol badge */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 border border-green-500 text-green-600 text-xs font-semibold px-4 py-2 rounded-full">
            <FaShieldAlt className="text-green-500" />
            SOVEREIGN IDENTITY PROTOCOL ACTIVE
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
          By creating an account, you agree to our Terms of Democratic Participation and Privacy
          Policy. Your vote remains anonymous and private.
        </p>
      </div>
    </div>
  );
}
