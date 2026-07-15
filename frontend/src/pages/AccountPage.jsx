import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Shield,
  CheckCircle2,
  ChevronRight,
  Key,
  Fingerprint,
  Smartphone,
  LogOut,
  Info,
  Lock,
  User,
  BadgeCheck,
  Mail,
  Briefcase,
} from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice';
import MainLayout from '../components/layout/MainLayout';
import toast from 'react-hot-toast';

function SettingRow({ icon: Icon, iconBg, title, subtitle, right }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-sm ${iconBg}`}>
        <Icon className="text-[#1a337e] h-5 w-5" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{title}</p>
        {subtitle && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{subtitle}</p>}
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
      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${on ? 'bg-[#1a337e]' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function AccountPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = (user?.full_name || user?.email || 'User')
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <MainLayout title="Account Settings">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Profile Hero Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <User size={120} className="text-[#1a337e]" />
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-[#1a337e] flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-transform group-hover:scale-105 duration-300">
                {initials}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                <BadgeCheck className="text-white h-5 w-5" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#1a337e] text-[10px] font-black uppercase tracking-widest">
                <Shield className="h-3 w-3" />
                Verified {user?.role || 'Admin'}
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {user?.full_name ?? 'Account User'}
              </h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-4">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              
              <button
                onClick={() => navigate('/settings')}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a337e] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-[#1a337e]/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Account Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="h-1.5 w-6 rounded-full bg-[#1a337e]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Identity Details</h3>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Legal Name</label>
                  <p className="text-sm font-black text-[#1a337e] mt-1 uppercase">{user?.full_name || 'Not Provided'}</p>
                </div>
                <div className="pt-6 border-t border-gray-50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Access Role</label>
                  <p className="text-sm font-black text-[#1a337e] mt-1 uppercase">{user?.role || 'User'}</p>
                </div>
                <div className="pt-6 border-t border-gray-50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Organization / Tenant</label>
                  <p className="text-sm font-black text-[#1a337e] mt-1 uppercase">{user?.tenant_name || 'Global System'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Access */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="h-1.5 w-6 rounded-full bg-[#1a337e]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Security Control</h3>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50">
              <button 
                onClick={() => navigate('/settings?tab=security')}
                className="w-full text-left focus:outline-none"
              >
                <SettingRow
                  icon={Key}
                  iconBg="bg-blue-50"
                  title="Update Password"
                  subtitle="Secure your access credentials"
                  right={<ChevronRight className="text-gray-300 h-5 w-5" />}
                />
              </button>
            </div>
          </section>
        </div>

        {/* Danger Zone */}
        <div className="pt-8">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex items-center justify-center gap-3 w-full py-5 rounded-3xl border-2 border-dashed border-red-100 text-red-500 font-black uppercase tracking-widest text-xs transition-all hover:bg-red-50 hover:border-red-200"
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Logout
          </button>
        </div>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 pb-12">
          Infrastructure Control v4.2.0 • System Secure
        </p>
      </div>
    </MainLayout>
  );
}
