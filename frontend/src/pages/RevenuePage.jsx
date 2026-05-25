import { useEffect, useState, useCallback } from 'react'
import { 
  FaWallet, 
  FaHistory, 
  FaCog, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationCircle,
  FaKey,
  FaShieldAlt,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import StatsCard from '../components/common/StatsCard'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import paymentService from '../services/paymentService'

export default function RevenuePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  
  // Settings Modal State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [settingsForm, setSettingsOpenForm] = useState({ key_id: '', key_secret: '' })
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentService.getRevenueOverview({ page, page_size: 20 })
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await paymentService.updatePaymentSettings({
        razorpay_key_id: settingsForm.key_id,
        razorpay_key_secret: settingsForm.key_secret
      })
      toast.success('Payment settings updated')
      setSettingsOpen(false)
    } catch (err) {
      toast.error('Failed to update settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const columns = [
    {
      key: 'created_at',
      header: 'Date & Time',
      render: (val) => <span className="text-gray-500 text-xs">{new Date(val).toLocaleString()}</span>
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (val, row) => (
        <span className="font-bold text-gray-900">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: row.currency }).format(val)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const styles = {
          captured: 'bg-green-50 text-green-700 border-green-100',
          pending: 'bg-amber-50 text-amber-700 border-amber-100',
          failed: 'bg-red-50 text-red-700 border-red-100',
          refunded: 'bg-gray-50 text-gray-700 border-gray-100',
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${styles[val] || styles.pending}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'description',
      header: 'Description',
      render: (val) => <span className="text-gray-600 text-sm truncate max-w-[200px]">{val || '—'}</span>
    },
    {
      key: 'razorpay_order_id',
      header: 'Order ID',
      render: (val) => <span className="font-mono text-[10px] text-gray-400">{val || '—'}</span>
    },
  ]

  if (loading && !data) return <MainLayout title="Revenue"><LoadingSpinner /></MainLayout>

  const summary = data?.summary || {}
  const transactions = data?.transactions?.items || []

  return (
    <MainLayout title="Revenue Management">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track your earnings and manage payment gateway settings.</p>
          </div>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FaCog className="text-indigo-500" />
            Razorpay Settings
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard 
            title="Total Revenue" 
            value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.total_revenue)} 
            icon={FaWallet} 
            color="indigo" 
          />
          <StatsCard 
            title="Pending Amount" 
            value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.pending_amount)} 
            icon={FaClock} 
            color="amber" 
          />
          <StatsCard 
            title="Success Rate" 
            value={`${summary.total_transactions > 0 ? Math.round(((summary.total_transactions - summary.failed_transactions) / summary.total_transactions) * 100) : 0}%`} 
            icon={FaCheckCircle} 
            color="green" 
          />
          <StatsCard 
            title="Total Txns" 
            value={summary.total_transactions} 
            icon={FaHistory} 
            color="blue" 
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Transaction History</h3>
            <button onClick={fetchData} className="text-xs font-bold text-indigo-600 hover:underline">Refresh</button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <FaWallet className="mx-auto mb-3 opacity-20 text-4xl" />
              <p>No transactions recorded yet.</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={transactions} 
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Razorpay Settings Modal */}
      <Modal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        title="Razorpay Configuration"
        size="lg"
      >
        <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3">
          <FaShieldAlt className="text-indigo-600 text-xl flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-800 leading-relaxed">
            Your Razorpay credentials are encrypted and used only to process payments for your organization. 
            Keep your <strong>Key Secret</strong> strictly confidential.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4" autoComplete="off">
          {/* Anti-Autofill Honeypot */}
          <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}>
            <input type="text" name="fake_email_autofill" tabIndex="-1" autoComplete="username" defaultValue="ignore" />
            <input type="password" name="fake_pass_autofill" tabIndex="-1" autoComplete="current-password" defaultValue="ignore" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <FaKey className="text-gray-400 text-xs" />
              Razorpay Key ID
            </label>
            <input 
              type="text"
              name={`rzp_key_id_${Math.random().toString(36).substring(7)}`}
              placeholder="rzp_live_..."
              value={settingsForm.key_id}
              onChange={e => setSettingsOpenForm(prev => ({ ...prev, key_id: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <FaShieldAlt className="text-gray-400 text-xs" />
              Razorpay Key Secret
            </label>
            <div className="relative">
              <input 
                type={showSecret ? "text" : "password"}
                name={`rzp_key_secret_${Math.random().toString(36).substring(7)}`}
                placeholder="••••••••••••••••"
                value={settingsForm.key_secret}
                onChange={e => setSettingsOpenForm(prev => ({ ...prev, key_secret: e.target.value }))}
                className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                autoComplete="new-password"
                required
              />
              <button 
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showSecret ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button 
              type="button" 
              onClick={() => setSettingsOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={savingSettings}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  )
}
