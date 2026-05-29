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
  FaPlus,
  FaTrash,
  FaEdit,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import StatsCard from '../components/common/StatsCard';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { fetchPayments, fetchPaymentSettings } from '../store/slices/paymentSlice';
import { fetchPlans, addPlan, updatePlan, deletePlan } from '../store/slices/planSlice';
import paymentService from '../services/paymentService';

export default function RevenuePage() {
  const dispatch = useDispatch();
  const { payments, stats, loading, settings } = useSelector((state) => state.payments);
  const { items: plans, loading: plansLoading, actionLoading: planActionLoading } = useSelector((state) => state.plans);

  const [keyForm, setKeyForm] = useState({ razorpay_key_id: '', razorpay_key_secret: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Plan Form State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    period: 'month',
    description: '',
    features: '',
    is_active: true,
    is_highlighted: false
  });

  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchPlans());
    dispatch(fetchPaymentSettings());
  }, [dispatch]);

  // Sync settings to form when loaded
  useEffect(() => {
    if (settings) {
      setKeyForm({
        razorpay_key_id: settings.razorpay_key_id || '',
        razorpay_key_secret: settings.razorpay_key_secret || '',
      });
    }
  }, [settings]);

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    if (!keyForm.razorpay_key_id.trim() || !keyForm.razorpay_key_secret.trim()) {
      toast.error('Both Key ID and Key Secret are required');
      return;
    }
    setKeySaving(true);
    try {
      await paymentService.updatePaymentSettings(keyForm);
      toast.success('Razorpay configuration updated');
      dispatch(fetchPaymentSettings()); // Refresh Redux
      setShowKeyModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update configuration');
    } finally {
      setKeySaving(false);
    }
  };

  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        price: plan.price,
        period: plan.period,
        description: plan.description || '',
        features: plan.features || '',
        is_active: plan.is_active,
        is_highlighted: plan.is_highlighted
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        price: '',
        period: 'month',
        description: '',
        features: '',
        is_active: true,
        is_highlighted: false
      });
    }
    setShowPlanModal(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await dispatch(updatePlan({ id: editingPlan.id, data: planForm })).unwrap();
        toast.success('Plan updated successfully');
      } else {
        await dispatch(addPlan(planForm)).unwrap();
        toast.success('Plan created successfully');
      }
      setShowPlanModal(false);
      dispatch(fetchPlans()); // Refresh list
    } catch (err) {
      toast.error(err || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await dispatch(deletePlan(id)).unwrap();
        toast.success('Plan deleted successfully');
        dispatch(fetchPlans()); // Refresh list
      } catch (err) {
        toast.error(err || 'Failed to delete plan');
      }
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

  if (loading && (!payments || payments.length === 0)) {
    return (
      <MainLayout title="Revenue">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  const safePayments = payments || [];
  const safePlans = plans || [];

  return (
    <MainLayout title="Revenue">
      <div className="w-full space-y-6">
        <div className="border-b border-[#c4c6d0] pb-5">
          {/* <h2 className="text-2xl font-black text-[#1A237E]">Revenue</h2> */}
          <p className="mt-1 text-sm text-[#44464f]">Track platform revenue, payment configuration, and transaction records.</p>
        </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Razorpay Configuration Summary */}
          <div className="lg:col-span-1 overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#c4c6d0] bg-[#f4f3f7] px-6 py-5">
              <div className="flex items-center gap-2">
                <FaKey className="text-gray-400" />
                <h3 className="font-bold text-[#1b1b1f]">Gateway Config</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(true)}
                className="text-xs font-bold text-[#1A237E] hover:underline"
              >
                Configure
              </button>
            </div>
            <div className="p-6 space-y-4">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Gateway</span>
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                     <span className="text-sm font-semibold text-gray-900">Razorpay Standard</span>
                  </div>
               </div>
               <div className="flex flex-col gap-1 pt-2 border-t border-gray-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Configuration Details</span>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Key ID</span>
                      <p className="text-xs font-mono text-gray-600 truncate">{settings?.razorpay_key_id || 'Not configured'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Key Secret</span>
                      <p className="text-xs font-mono text-gray-600">
                        {settings?.razorpay_key_secret ? '••••••••••••••••' : 'Not configured'}
                      </p>
                    </div>
                  </div>
               </div>
               <p className="text-[11px] leading-relaxed text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  All voter payments are processed through this organization's Razorpay instance. Ensure your keys are from a <strong>Live</strong> account for real transactions.
               </p>
            </div>
          </div>

          {/* Voter Subscription Plans */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <FaCreditCard className="text-[#1A237E]" />
                  <h3 className="font-bold text-[#1b1b1f]">Voter Subscription Plans</h3>
                </div>
                <button
                  onClick={() => handleOpenPlanModal()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#1A237E] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
                >
                  <FaPlus /> Add Plan
                </button>
             </div>
             
             {plansLoading ? (
               <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#c4c6d0] bg-white">
                  <LoadingSpinner />
               </div>
             ) : safePlans.length === 0 ? (
               <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#c4c6d0] bg-white text-gray-400">
                  <FaCreditCard size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No plans defined yet.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safePlans.map((plan) => (
                    <div key={plan.id} className="flex flex-col rounded-xl border border-[#c4c6d0] bg-white p-5 shadow-sm transition hover:shadow-md">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{plan.name}</h4>
                          <p className="text-2xl font-black text-[#1A237E] mt-1">₹{plan.price}<span className="text-xs font-normal text-gray-500">/{plan.period}</span></p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenPlanModal(plan)}
                            className="p-1.5 text-gray-400 hover:text-[#003d9b] transition"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2">{plan.description}</p>
                      <ul className="flex-1 space-y-2 mb-6">
                        {(plan.features || '').split(',').map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-600">
                            <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" />
                            <span>{feature.trim()}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between">
                         <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                           {plan.is_active ? 'Active' : 'Inactive'}
                         </span>
                         {plan.is_highlighted && (
                           <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                             Highlighted
                           </span>
                         )}
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#c4c6d0] bg-[#f4f3f7] px-6 py-5">
            <FaHistory className="text-gray-400" />
            <h3 className="font-bold text-[#1b1b1f]">Transaction History</h3>
            {safePayments.length > 0 && (
              <span className="ml-auto text-xs text-gray-400">{safePayments.length} records</span>
            )}
          </div>
          <DataTable
            columns={columns}
            data={safePayments}
            loading={loading}
          />
        </div>
      </div>

      {/* Gateway Configuration Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Razorpay Gateway Configuration"
      >
        <form onSubmit={handleSaveKeys} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Key ID
            </label>
            <input
              type="text"
              value={keyForm.razorpay_key_id}
              onChange={e => setKeyForm(f => ({ ...f, razorpay_key_id: e.target.value }))}
              placeholder="rzp_live_xxxxxxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-[#1A237E] focus:outline-none focus:ring-2 focus:ring-[#e8eaf6]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Key Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={keyForm.razorpay_key_secret}
                onChange={e => setKeyForm(f => ({ ...f, razorpay_key_secret: e.target.value }))}
                placeholder="••••••••••••••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 font-mono text-sm focus:border-[#1A237E] focus:outline-none focus:ring-2 focus:ring-[#e8eaf6]"
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
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={keySaving}
              className="rounded-lg bg-[#1A237E] px-6 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <FaSave className="inline mr-2" />
              {keySaving ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Plan Management Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Name</label>
            <input
              type="text"
              value={planForm.name}
              onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Basic Citizen"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A237E]/20 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Price (₹)</label>
              <input
                type="number"
                value={planForm.price}
                onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A237E]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Billing Period</label>
              <select
                value={planForm.period}
                onChange={e => setPlanForm(f => ({ ...f, period: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A237E]/20 outline-none"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
            <textarea
              value={planForm.description}
              onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the plan..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A237E]/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Features (Comma separated)</label>
            <textarea
              value={planForm.features}
              onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))}
              placeholder="1 Vote per Election, Standard Access, ..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A237E]/20 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={planForm.is_active}
                onChange={e => setPlanForm(f => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-[#1A237E]"
              />
              <span className="text-xs font-semibold text-gray-600 uppercase">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={planForm.is_highlighted}
                onChange={e => setPlanForm(f => ({ ...f, is_highlighted: e.target.checked }))}
                className="rounded border-gray-300 text-[#1A237E]"
              />
              <span className="text-xs font-semibold text-gray-600 uppercase">Highlight</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPlanModal(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={planActionLoading}
              className="rounded-lg bg-[#1A237E] px-6 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {planActionLoading ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
