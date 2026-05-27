import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaShieldAlt,
  FaCheckCircle,
  FaChevronRight,
  FaKey,
  FaFingerprint,
  FaMobileAlt,
  FaSignOutAlt,
  FaInfoCircle,
  FaLock,
  FaTh,
  FaVoteYea,
  FaChartBar,
  FaUser,
} from 'react-icons/fa';
import { logoutUser } from '../store/slices/authSlice';

function SettingRow({ icon: Icon, iconBg, title, subtitle, right }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="text-gray-600 text-base" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-xs mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-[#1B4FD8]' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function DocRow({ title, date }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="w-1 h-12 bg-green-500 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">Verified: {date}</p>
      </div>
      <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
    </div>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: FaTh, path: '/dashboard' },
  { label: 'Elections', icon: FaVoteYea, path: '/elections' },
  { label: 'Analytics', icon: FaChartBar, path: '/results' },
  { label: 'Account', icon: FaUser, path: '/account' },
];

export default function AccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [biometric, setBiometric] = useState(true);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EV';

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex flex-col pb-20">

      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-[#1B4FD8] text-lg" />
          <span className="font-bold text-[#1066b1] text-base">SecureVote</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center overflow-hidden">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-5">

        {/* Profile hero */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {initials}
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#1B4FD8] rounded-full flex items-center justify-center border-2 border-white">
              <FaCheckCircle className="text-white text-sm" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#1066b1]">
              {user?.full_name ?? 'Verified Voter'}
            </h2>
            <div className="inline-flex items-center gap-1.5 mt-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
              <FaShieldAlt className="text-gray-400 text-xs" />
              SECURE ID: ****-4209
            </div>
          </div>
        </div>

        {/* Identity Details */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identity Details</p>
            <FaInfoCircle className="text-gray-400 text-sm" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-xs text-gray-400">Full Legal Name</p>
                <p className="text-sm font-bold text-[#1066b1] mt-0.5">
                  {user?.full_name ?? 'Eleanor J. Sterling'}
                </p>
              </div>
              <FaLock className="text-gray-300 text-base" />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-xs text-gray-400">Date of Birth</p>
                <p className="text-sm font-bold text-[#1066b1] mt-0.5">October 14, 1982</p>
              </div>
              <FaLock className="text-gray-300 text-base" />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p className="text-xs text-gray-400">Voter Registration ID</p>
                <p className="text-sm font-bold text-[#1066b1] mt-0.5">VTR-990-221-X8</p>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg">
                ACTIVE
              </span>
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Security Settings
          </p>
          <div className="bg-white rounded-2xl shadow-sm">
            <SettingRow
              icon={FaKey}
              iconBg="bg-gray-100"
              title="Change Password"
              subtitle={<span className="text-gray-400">Last changed 4 months ago</span>}
              right={<FaChevronRight className="text-gray-300 text-sm" />}
            />
            <SettingRow
              icon={FaFingerprint}
              iconBg="bg-gray-100"
              title="Biometric Auth"
              subtitle={<span className="text-gray-400">Use FaceID or Fingerprint</span>}
              right={<Toggle on={biometric} onToggle={() => setBiometric((v) => !v)} />}
            />
            <SettingRow
              icon={FaMobileAlt}
              iconBg="bg-gray-100"
              title="Two-Factor Auth"
              subtitle={<span className="text-green-600 font-medium">Enabled via SMS</span>}
              right={<FaChevronRight className="text-gray-300 text-sm" />}
            />
          </div>
        </section>

        {/* Verification Documents */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Verification Documents
          </p>
          <div className="bg-white rounded-2xl shadow-sm">
            <DocRow title="Driver's License" date="01/20/2024" />
            <DocRow title="Passport Scan" date="01/20/2024" />
          </div>
        </section>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-red-400 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm"
        >
          <FaSignOutAlt />
          Log out of SecureVote
        </button>

        <p className="text-center text-xs text-gray-400">
          Version 4.2.0-secure | Built for Civic Integrity
        </p>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = path === '/account';
          return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className={`w-10 h-8 flex items-center justify-center rounded-xl ${active ? 'bg-[#1B4FD8]' : ''}`}>
                <Icon className={`text-lg ${active ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className={active ? 'text-[#1B4FD8] font-semibold' : ''}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
