import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CheckCircle2, Gavel, KeyRound, Palette, Save, ServerCog, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import { changePassword, selectAuthLoading, selectCurrentUser, updateMe } from '../store/slices/authSlice'

const profileFields = [
  { name: 'full_name', label: 'Full Name', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'designation', label: 'Designation' },
  { name: 'email', label: 'Email' },
  { name: 'street_address', label: 'Street Address', span: 2 },
  { name: 'city', label: 'City' },
  { name: 'district', label: 'District' },
  { name: 'state', label: 'State' },
  { name: 'country', label: 'Country' },
  { name: 'pincode', label: 'Pincode' },
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

function TextInput({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#44464f]">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-[#c4c6d0] bg-white px-3 py-2.5 text-sm text-[#1b1b1f] outline-none transition focus:border-[#1A237E] focus:ring-2 focus:ring-[#e8eaf6]"
      />
    </label>
  )
}

function ToggleRow({ title, description, checked = false }) {
  return (
    <div>
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="font-semibold text-[#0d1245]">{title}</span>
        <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#1A237E]' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-5' : 'left-0.5'}`} />
        </span>
      </label>
      <p className="mt-1 text-xs leading-relaxed text-[#44464f]">{description}</p>
    </div>
  )
}

export default function SettingsPage() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const loading = useSelector(selectAuthLoading)
  const [profileForm, setProfileForm] = useState(emptyProfile)
  const [passwordForm, setPasswordForm] = useState(emptyPassword)

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

  return (
    <MainLayout title="Settings">
      <div className="w-full space-y-8">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
 
          <form onSubmit={handleProfileSubmit} className="rounded-lg border border-[#c4c6d0] bg-white p-8 lg:col-span-12">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A237E] text-lg font-bold text-white">{initials || 'U'}</div>
              <div>
                <h3 className="text-xl font-bold text-[#0d1245]">Admin Profile</h3>
                <p className="text-sm text-[#44464f]">{user?.email || 'Signed-in account'}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {profileFields.map((field) => (
                <TextInput
                  key={field.name}
                  label={field.label}
                  value={profileForm[field.name]}
                  required={field.required}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  className={field.span === 2 ? 'md:col-span-2' : ''}
                />
              ))}
            </div>
            <button type="submit" disabled={loading} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1A237E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="rounded-lg border border-[#c4c6d0] bg-white p-8 lg:col-span-12">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-lg bg-[#e8eaf6] p-3 text-[#1A237E]"><KeyRound className="h-8 w-8" /></div>
              <div>
                <h3 className="text-xl font-bold text-[#0d1245]">Access Credential Rotation</h3>
                <p className="text-sm text-[#44464f]">Change your password using the current credential.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput label="Current Password" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))} required autoComplete="current-password" />
              <TextInput label="New Password" type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))} required minLength={8} autoComplete="new-password" />
              <TextInput label="Confirm Password" type="password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))} required minLength={8} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0d1245] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <KeyRound className="h-4 w-4" /> {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>


        </section>
      </div>
    </MainLayout>
  )
}
