import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  CheckCircle2, 
  Gavel, 
  KeyRound, 
  Palette, 
  Save as SaveIcon, 
  ServerCog, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  ChevronRight,
  Shield,
  Bell,
  Fingerprint,
  Globe,
  Hash,
  Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import { changePassword, selectAuthLoading, selectCurrentUser, updateMe } from '../store/slices/authSlice'

// ─── Field Components ────────────────────────────────────────────────────────

function Field({ label, required, children, hint, error }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] font-black text-red-600 ml-1">{error}</p>}
      {hint && !error && <p className="text-[10px] font-bold text-gray-300 ml-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled, required, hasError, icon: Icon, ...props }) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a337e] transition-colors">
          <Icon size={16} strokeWidth={2.4} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`block w-full ${Icon ? 'pl-11' : 'px-4'} py-3 border rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1a337e]/5 focus:border-[#1a337e] disabled:bg-gray-50 disabled:text-gray-400 transition-all shadow-inner ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white'
        }`}
        {...props}
      />
    </div>
  );
}

const profileFields = [
  { name: 'full_name', label: 'Full Name', required: true, icon: User },
  { name: 'phone', label: 'Phone', icon: Phone },
  { name: 'designation', label: 'Designation', icon: Briefcase },
  { name: 'email', label: 'Email', icon: Mail, disabled: true },
  { name: 'street_address', label: 'Street Address', span: 2, icon: MapPin },
  { name: 'city', label: 'City', icon: MapPin },
  { name: 'district', label: 'District', icon: MapPin },
  { name: 'state', label: 'State', icon: MapPin },
  { name: 'country', label: 'Country', icon: Globe },
  { name: 'pincode', label: 'Pincode', icon: Hash },
]

const emptyProfile = {
  full_name: '',
  phone: '',
  designation: '',
  email: '',
  street_address: '',
  city: '',
  district: '',
  state: '',
  country: '',
  pincode: '',
}

const emptyPassword = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}

export default function SettingsPage() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const loading = useSelector(selectAuthLoading)
  const [profileForm, setProfileForm] = useState(emptyProfile)
  const [passwordForm, setPasswordForm] = useState(emptyPassword)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!user) return
    setProfileForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      designation: user.designation || '',
      email: user.email || '',
      street_address: user.street_address || '',
      city: user.city || '',
      district: user.district || '',
      state: user.state || '',
      country: user.country || '',
      pincode: user.pincode || '',
    })
  }, [user])

  const initials = useMemo(() => {
    const name = user?.full_name || user?.name || 'User'
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  }, [user])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = Object.fromEntries(Object.entries(profileForm).map(([key, value]) => [key, value.trim() || null]))
      await dispatch(updateMe(payload)).unwrap()
      toast.success('Settings updated')
    } catch (error) {
      toast.error(error || 'Failed to update settings')
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New password and confirmation do not match')
      return
    }
    try {
      await dispatch(changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })).unwrap()
      setPasswordForm(emptyPassword)
      toast.success('Password updated')
    } catch (error) {
      toast.error(error || 'Failed to change password')
    }
  }

  const TABS = [
    { id: 'profile', label: 'My Profile', icon: User, description: 'Personal details and contact info' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Change account password' },
  ]

  return (
    <MainLayout title="Settings">
      <div className="w-full space-y-8">
        <header>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">User Preferences</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-gray-900">Account Settings</h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tabs Sidebar */}
          <aside className="lg:col-span-4 space-y-3">
             {TABS.map(tab => (
               <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-5 rounded-3xl border transition-all duration-300 group ${
                  activeTab === tab.id 
                    ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-100/50 scale-[1.02]' 
                    : 'bg-transparent border-transparent hover:bg-white hover:border-gray-100 text-gray-400'
                }`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-[#1a337e] text-white border-[#1a337e] shadow-lg shadow-indigo-200' 
                        : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-white group-hover:text-[#1a337e]'
                    }`}>
                       <tab.icon size={20} strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className={`text-sm font-black tracking-tight ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-500'}`}>{tab.label}</p>
                       <p className="text-[10px] font-bold text-gray-400 mt-0.5 truncate uppercase tracking-widest">{tab.description}</p>
                    </div>
                    <ChevronRight size={14} className={`transition-transform duration-300 ${activeTab === tab.id ? 'text-[#1a337e] translate-x-0' : 'text-gray-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                 </div>
               </button>
             ))}
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden min-h-[600px] flex flex-col transition-all">
             {activeTab === 'profile' && (
               <form onSubmit={handleProfileSubmit} className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                       <div className="h-20 w-20 rounded-3xl bg-[#1a337e] text-3xl font-black text-white flex items-center justify-center shadow-2xl shadow-indigo-200 border-4 border-white">
                          {initials || 'U'}
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{profileForm.full_name || 'Administrator'}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 sa-pulse-green" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified Profile</span>
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-10 space-y-8 flex-1">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Personal Information</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {profileFields.slice(0, 4).map(field => (
                           <Field key={field.name} label={field.label} required={field.required}>
                             <Input 
                                value={profileForm[field.name]}
                                onChange={(e) => setProfileForm(p => ({ ...p, [field.name]: e.target.value }))}
                                placeholder={`Enter ${field.label}...`}
                                disabled={field.disabled}
                                icon={field.icon}
                             />
                           </Field>
                         ))}
                       </div>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-gray-50">
                       <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Address & Location</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {profileFields.slice(4).map(field => (
                           <Field key={field.name} label={field.label} className={field.span === 2 ? 'md:col-span-2' : ''}>
                             <Input 
                                value={profileForm[field.name]}
                                onChange={(e) => setProfileForm(p => ({ ...p, [field.name]: e.target.value }))}
                                placeholder={`Enter ${field.label}...`}
                                icon={field.icon}
                             />
                           </Field>
                         ))}
                       </div>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-12 py-4 bg-[#1a337e] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#1a337e]/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SaveIcon size={16} strokeWidth={2.4} />}
                      Update Profile
                    </button>
                  </div>
               </form>
             )}

             {activeTab === 'security' && (
               <form onSubmit={handlePasswordSubmit} className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-10 space-y-10 flex-1">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">Change Password</h3>
                      <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed max-w-lg">
                        Update your security credentials. We recommend using a strong, unique password to protect your account.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-8 max-w-md">
                        <Field label="Old Password" required>
                           <Input 
                            type="password" 
                            value={passwordForm.current_password} 
                            onChange={(e) => setPasswordForm(p => ({ ...p, current_password: e.target.value }))} 
                            icon={Lock}
                            placeholder="••••••••"
                           />
                        </Field>
                        
                        <div className="h-px bg-gray-100 w-full" />

                        <Field label="New Password" required hint="Minimum 8 characters">
                           <Input 
                            type="password" 
                            value={passwordForm.new_password} 
                            onChange={(e) => setPasswordForm(p => ({ ...p, new_password: e.target.value }))} 
                            icon={Fingerprint}
                            placeholder="••••••••"
                           />
                        </Field>
                        <Field label="Confirm New Password" required>
                           <Input 
                            type="password" 
                            value={passwordForm.confirm_password} 
                            onChange={(e) => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))} 
                            icon={KeyRound}
                            placeholder="••••••••"
                           />
                        </Field>
                      </div>

                      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4 mt-8">
                         <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.4} />
                         <div>
                            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Security Alert</p>
                            <p className="text-xs font-bold text-amber-600/70 mt-1 uppercase tracking-wider leading-relaxed">
                               Changing your password will sign you out of all other active sessions for security.
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-12 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-black active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound size={16} strokeWidth={2.4} />}
                      Update Password
                    </button>
                  </div>
               </form>
             )}
          </main>
        </div>
      </div>
    </MainLayout>
  )
}

