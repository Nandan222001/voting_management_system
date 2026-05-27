import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { KeyRound, Save, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import { changePassword, selectAuthLoading, selectCurrentUser, updateMe } from '../store/slices/authSlice'

const profileFields = [
  { name: 'full_name', label: 'Full Name', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'designation', label: 'Designation' },
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
      <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[rgb(16_102_177)] focus:ring-2 focus:ring-[#e6edfb]"
      />
    </label>
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
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [user])

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()

    try {
      const payload = Object.fromEntries(
        Object.entries(profileForm).map(([key, value]) => [key, value.trim() || null])
      )
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
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
              {initials || 'U'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">User Settings</h1>
              <p className="truncate text-sm text-gray-500">{user?.email || 'Signed-in account'}</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase text-gray-500">
            {user?.role || 'user'}
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <UserRound className="h-5 w-5 text-[rgb(16_102_177)]" />
            <div>
              <h2 className="font-semibold text-gray-900">Profile Details</h2>
              <p className="text-sm text-gray-500">Update your visible account and contact information.</p>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            {profileFields.map((field) => (
              <TextInput
                key={field.name}
                label={field.label}
                value={profileForm[field.name]}
                required={field.required}
                onChange={(event) => handleProfileChange(field.name, event.target.value)}
                className={field.span === 2 ? 'md:col-span-2' : ''}
              />
            ))}
          </div>

          <div className="flex justify-end border-t border-gray-100 px-5 py-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[rgb(16_102_177)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[rgb(16_102_177)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <KeyRound className="h-5 w-5 text-[rgb(16_102_177)]" />
            <div>
              <h2 className="font-semibold text-gray-900">Password</h2>
              <p className="text-sm text-gray-500">Change your password using your current password.</p>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-3">
            <TextInput
              label="Current Password"
              type="password"
              value={passwordForm.current_password}
              onChange={(event) => handlePasswordChange('current_password', event.target.value)}
              required
              autoComplete="current-password"
            />
            <TextInput
              label="New Password"
              type="password"
              value={passwordForm.new_password}
              onChange={(event) => handlePasswordChange('new_password', event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <TextInput
              label="Confirm Password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(event) => handlePasswordChange('confirm_password', event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end border-t border-gray-100 px-5 py-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
