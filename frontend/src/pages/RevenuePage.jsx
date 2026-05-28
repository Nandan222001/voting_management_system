import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaCreditCard,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
  FaSave,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import StatsCard from '../components/common/StatsCard';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchPayments } from '../store/slices/paymentSlice';
import paymentService from '../services/paymentService';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RevenuePage() {
  const dispatch = useDispatch();
  const { payments, stats, loading } = useSelector((state) => state.payments);

  const [keyForm, setKeyForm] = useState({ razorpay_key_id: '', razorpay_key_secret: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const [payForm, setPayForm] = useState({ amount: '', name: '', email: '', description: '' });
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    if (!keyForm.razorpay_key_id.trim() || !keyForm.razorpay_key_secret.trim()) {
      toast.error('Both Key ID and Key Secret are required');
      return;
    }
    setKeySaving(true);
    try {
      await paymentService.updatePaymentSettings(keyForm);
      setKeySaved(true);
      toast.success('Razorpay keys saved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save keys');
    } finally {
      setKeySaving(false);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!keyForm.razorpay_key_id.trim()) {
      toast.error('Configure Razorpay Key ID first');
      return;
    }
    const amountPaise = Math.round(parseFloat(payForm.amount) * 100);
    if (!amountPaise || amountPaise < 100) {
      toast.error('Minimum amount is ₹1.00');
      return;
    }
    setPayLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        return;
      }
      const orderRes = await paymentService.createPayment({
        amount: amountPaise,
        description: payForm.description || 'Payment',
      });
      const order = orderRes.data;
      const options = {
        key: keyForm.razorpay_key_id,
        amount: order.amount ?? amountPaise,
        currency: 'INR',
        name: 'SecureVote',
        description: payForm.description || 'Payment',
        order_id: order.order_id ?? order.id,
        prefill: {
          name: payForm.name,
          email: payForm.email,
        },
        theme: { color: 'rgb(16, 102, 177)' },
        handler: () => {
          toast.success('Payment successful');
          setPayForm({ amount: '', name: '', email: '', description: '' });
          dispatch(fetchPayments());
        },
        modal: { ondismiss: () => setPayLoading(false) },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPayLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Transaction ID', render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'amount', label: 'Amount', render: (v) => <span className="font-semibold text-gray-800">₹{(v / 100).toFixed(2)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const map = {
          paid: 'bg-green-100 text-green-700',
          captured: 'bg-green-100 text-green-700',
          failed: 'bg-red-100 text-red-700',
          pending: 'bg-yellow-100 text-yellow-700',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${map[v] ?? 'bg-gray-100 text-gray-700'}`}>
            {v}
          </span>
        );
      },
    },
    { key: 'method', label: 'Method', render: (v) => v || '—' },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  if (loading && payments.length === 0) {
    return (
      <MainLayout title="Revenue">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Revenue & Payments">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`₹${((stats?.total_revenue || 0) / 100).toLocaleString()}`}
            icon={FaCreditCard}
            color="indigo"
          />
          <StatsCard
            title="Successful"
            value={stats?.successful_payments || 0}
            icon={FaArrowUp}
            color="green"
          />
          <StatsCard
            title="Failed / Pending"
            value={stats?.failed_payments || 0}
            icon={FaArrowDown}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Razorpay Configuration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaKey className="text-gray-400" />
                <h3 className="font-bold text-gray-900">Razorpay Configuration</h3>
              </div>
              {keySaved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <FaCheckCircle className="text-green-500" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                  <FaExclamationCircle className="text-gray-400" /> Not Configured
                </span>
              )}
            </div>
            <form onSubmit={handleSaveKeys} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Key ID
                </label>
                <input
                  type="text"
                  value={keyForm.razorpay_key_id}
                  onChange={e => setKeyForm(f => ({ ...f, razorpay_key_id: e.target.value }))}
                  placeholder="rzp_live_xxxxxxxxxxxx"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Key Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={keyForm.razorpay_key_secret}
                    onChange={e => setKeyForm(f => ({ ...f, razorpay_key_secret: e.target.value }))}
                    placeholder="••••••••••••••••••••"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecret ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={keySaving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-[rgb(16_102_177)] rounded-xl hover:bg-[rgb(12_85_148)] font-semibold disabled:opacity-60 transition-colors"
              >
                <FaSave className="text-xs" />
                {keySaving ? 'Saving…' : 'Save Keys'}
              </button>
            </form>
          </div>

          {/* Collect Payment */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <FaCreditCard className="text-gray-400" />
              <h3 className="font-bold text-gray-900">Collect Payment</h3>
            </div>
            <form onSubmit={handleCollectPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Payer Name
                  </label>
                  <input
                    type="text"
                    value={payForm.name}
                    onChange={e => setPayForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Payer Email
                </label>
                <input
                  type="email"
                  value={payForm.email}
                  onChange={e => setPayForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={payForm.description}
                  onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Registration fee"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
                />
              </div>
              <button
                type="submit"
                disabled={payLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white bg-[rgb(16_102_177)] rounded-xl hover:bg-[rgb(12_85_148)] font-semibold disabled:opacity-60 transition-colors"
              >
                <FaCreditCard className="text-xs" />
                {payLoading ? 'Opening Checkout…' : 'Open Razorpay Checkout'}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <FaHistory className="text-gray-400" />
            <h3 className="font-bold text-gray-900">Transaction History</h3>
            {payments.length > 0 && (
              <span className="ml-auto text-xs text-gray-400">{payments.length} records</span>
            )}
          </div>
          <DataTable
            columns={columns}
            data={payments}
            loading={loading}
          />
        </div>
      </div>
    </MainLayout>
  );
}
