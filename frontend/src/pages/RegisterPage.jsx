import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Registration Disabled</h2>
        <p className="text-gray-600 mb-6">Account creation from the frontend has been disabled. Please contact an administrator to create accounts.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-[#0051D5] text-white rounded-lg hover:bg-[#0051D5] transition-colors"
        >
          Back to login
        </button>
      </div>
    </div>
  )
}
