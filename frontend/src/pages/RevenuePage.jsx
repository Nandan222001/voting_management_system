import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  History as HistoryIcon,
  Key as KeyIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save as SaveIcon,
  DollarSign,
  Search,
  X,
  ShieldCheck,
  TrendingUp,
  Receipt,
  ArrowRight,
  Lock,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { fetchPayments, fetchPaymentSettings } from '../store/slices/paymentSlice';
import paymentService from '../services/paymentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numberFormat(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function MetricCard({ title, value, children, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: { icon: 'text-[#1a337e] bg-blue-50 border-blue-100', text: 'text-[#1a337e]' },
    amber: { icon: 'text-amber-600 bg-amber-50 border-amber-100', text: 'text-amber-600' },
    emerald: { icon: 'text-emerald-600 bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
    indigo: { icon: 'text-[#1a337e] bg-indigo-50 border-indigo-100', text: 'text-[#1a337e]' },
    red: { icon: 'text-red-600 bg-red-50 border-red-100', text: 'text-red-600' },
  };

  const style = toneMap[tone] || toneMap.blue;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110 ${style.icon}`}>
          <Icon className="h-6 w-6" strokeWidth={2.4} />
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">{title}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-gray-900 tracking-tight">{value}</span>
      </div>
      <div className="mt-4 border-t border-gray-50 pt-4">
        {children}
      </div>
    </div>
  );
}

// ─── Constant Data ──────────────────────────────────────────────────────────

const FIXED_PLANS = [
  {
    id: 'active',
    name: 'Active Member',
    price: 200,
    period: 'year',
    description: 'Annual membership for active participation in jurisdictional elections.',
    features: ['1 Year Validity', 'Standard Voting Access', 'Result Notifications'],
    is_highlighted: true,
    tone: 'indigo'
  },
  {
    id: 'life',
    name: 'Life Member',
    price: 5000,
    period: 'one-time',
    description: 'Lifetime membership with full access and elite status.',
    features: ['Lifetime Validity', 'VIP Verified Badge', 'Priority Support', 'Unlimited Analytics'],
    is_highlighted: false,
    tone: 'emerald'
  }
];

export default function RevenuePage() {
  const dispatch = useDispatch();
  const { payments, total, stats, loading, settings } = useSelector((state) => state.payments);

  const [keyForm, setKeyForm] = useState({ razorpay_key_id: '', razorpay_key_secret: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const perPage = 10;

  useEffect(() => {
    dispatch(fetchPayments({ page, page_size: perPage }));
    dispatch(fetchPaymentSettings());
  }, [dispatch, page]);

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
      dispatch(fetchPaymentSettings());
      setShowKeyModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update configuration');
    } finally {
      setKeySaving(false);
    }
  };

  const handleDownloadStatement = async () => {
    setDownloading(true);
    try {
      const response = await paymentService.downloadStatement();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_statement_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Statement downloaded successfully');
    } catch (err) {
      toast.error('Failed to download statement');
    } finally {
      setDownloading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const logs = Array.isArray(payments) ? payments : payments?.data || [];
    if (!search) return logs;
    const s = search.toLowerCase();
    return logs.filter(p => 
      (p.user_name || '').toLowerCase().includes(s) || 
      (p.plan_name || '').toLowerCase().includes(s) || 
      (p.razorpay_order_id || '').toLowerCase().includes(s) || 
      (p.status || '').toLowerCase().includes(s)
    );
  }, [payments, search]);

  const totalPages = Math.ceil((total || 0) / perPage);

  return (
    <MainLayout title="Revenue Stream">
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Financial Operations</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Revenue Registry</h2>
            <p className="mt-2 text-sm font-medium text-gray-500 max-w-2xl">Monitor membership subscriptions, gateway health, and transactional audit trails.</p>
          </div>
          <button
            onClick={handleDownloadStatement}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-gray-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-gray-50 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {downloading ? (
              <span className="w-4 h-4 border-2 border-[#1a337e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download Statement
          </button>
        </header>

        {/* Metrics Section */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard 
            title="Total Revenue" 
            value={numberFormat(stats?.total_revenue || 0)} 
            icon={DollarSign} 
            tone="indigo"
          >
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                <TrendingUp size={12} />
                <span>Gross platform income</span>
             </div>
          </MetricCard>

          <MetricCard 
            title="Registry Friction" 
            value={stats?.failed_transactions || 0} 
            icon={AlertCircle} 
            tone="red"
          >
             <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Failed attempts recorded</p>
             </div>
          </MetricCard>

          <MetricCard 
            title="Pending Volume" 
            value={numberFormat(stats?.pending_amount || 0)} 
            icon={HistoryIcon} 
            tone="amber"
          >
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-600">
                <span>Awaiting verification</span>
             </div>
          </MetricCard>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Gateway Config */}
           <div className="lg:col-span-4 space-y-8">
              <section className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                    <KeyIcon size={160} className="text-[#1a337e]" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black tracking-tight text-gray-900">Gateway</h3>
                       <button 
                        onClick={() => setShowKeyModal(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#1a337e] hover:text-[#1a337e] transition-colors"
                       >
                         Configure
                       </button>
                    </div>
                    
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#1a337e] border border-indigo-100 shadow-sm">
                             <ShieldCheck size={24} strokeWidth={2.4} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Protocol</p>
                             <p className="text-sm font-black text-gray-900">Razorpay Production</p>
                          </div>
                       </div>

                       <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Key ID</p>
                             <p className="text-xs font-mono text-gray-600 truncate bg-white p-2 rounded-lg border border-gray-100 shadow-inner">
                                {settings?.razorpay_key_id || 'NOT_CONFIGURED'}
                             </p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                             <div className="flex items-center gap-2">
                                <div className={`h-1.5 w-1.5 rounded-full ${settings?.razorpay_key_id ? 'bg-emerald-500 sa-pulse-green' : 'bg-red-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${settings?.razorpay_key_id ? 'text-emerald-600' : 'text-red-600'}`}>
                                   {settings?.razorpay_key_id ? 'Operational' : 'Input Required'}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* <section className="rounded-[2.5rem] bg-[#1a337e] p-8 text-white shadow-2xl shadow-[#1a337e]/30">
                 <h3 className="text-xl font-black tracking-tight mb-2">Platform Health</h3>
                 <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-6">Gateway Synchronization</p>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span>Transaction Success</span>
                       <span>98.2%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1a337e] rounded-full overflow-hidden">
                       <div className="h-full bg-white transition-all duration-1000" style={{ width: '98.2%' }} />
                    </div>
                 </div>
                 <p className="mt-6 text-[10px] font-bold text-[#1a337e] leading-relaxed uppercase tracking-wider">
                    All payment routes are currently responding within optimal latency parameters.
                 </p>
              </section> */}
           </div>

           {/* Plans and History */}
           <div className="lg:col-span-12 space-y-8">
              <section className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-[#1a337e] rounded-full" />
                    <h3 className="text-xl font-black tracking-tight text-gray-900">Voter Subscription Plans</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {FIXED_PLANS.map((plan) => (
                      <div key={plan.id} className="group relative flex flex-col rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
                        {plan.is_highlighted && (
                          <div className="absolute -right-8 top-6 bg-amber-400 text-white font-black text-[8px] uppercase tracking-widest py-1 w-32 text-center transform rotate-45 shadow-sm">
                            Most Popular
                          </div>
                        )}
                        <div className="mb-6 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{plan.period} tier</p>
                              <h4 className="text-xl font-black text-gray-900 tracking-tight">{plan.name}</h4>
                           </div>
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${plan.tone === 'indigo' ? 'bg-indigo-50 text-[#1a337e] border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              <CreditCard size={24} strokeWidth={2.4} />
                           </div>
                        </div>
                        <div className="mb-6">
                           <span className="text-4xl font-black text-gray-900 tracking-tighter">₹{plan.price}</span>
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">/ {plan.period}</span>
                        </div>
                        <ul className="flex-1 space-y-3 mb-8">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-2">
                           <span className="flex-1 h-px bg-gray-50" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Active Node</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-1 h-5 bg-[#1a337e] rounded-full" />
                       <h3 className="text-xl font-black tracking-tight text-gray-900">Payment Logs</h3>
                    </div>
                    <div className="relative w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                       <input 
                         type="text" 
                         placeholder="Search logs..." 
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1a337e]/5 focus:border-[#1a337e] transition-all"
                       />
                    </div>
                 </div>

                 <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
                    {loading ? (
                       <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : filteredPayments.length === 0 ? (
                       <div className="py-20 text-center">
                          <Receipt className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                          <p className="text-gray-900 font-black uppercase tracking-tight">No Records Found</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Transactions will appear here once processed.</p>
                       </div>
                    ) : (
                       <div className="w-full overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                                   <th className="px-6 py-5">User & Plan</th>
                                   <th className="px-6 py-5">Amount</th>
                                   <th className="px-6 py-5">Status</th>
                                   <th className="px-6 py-5">Order Reference</th>
                                   <th className="px-6 py-5 text-right">Date</th>
                                </tr>
                             </thead>
                             <tbody>
                                {filteredPayments.map((p) => (
                                   <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                      <td className="px-6 py-5">
                                         <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 tracking-tight">{p.user_name || 'System User'}</span>
                                            <span className="text-[10px] font-bold text-[#1a337e] uppercase tracking-widest">{p.plan_name || 'Membership'}</span>
                                         </div>
                                      </td>
                                      <td className="px-6 py-5">
                                         <span className="text-sm font-black text-gray-900">₹{p.amount}</span>
                                      </td>
                                      <td className="px-6 py-5">
                                         <span className={`inline-flex rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                                            p.status === 'captured' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : p.status === 'failed' 
                                            ? 'bg-red-50 text-red-600 border-red-100' 
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                         }`}>
                                            {p.status}
                                         </span>
                                      </td>
                                      <td className="px-6 py-5">
                                         <span className="font-mono text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">
                                            {p.razorpay_order_id || 'N/A'}
                                         </span>
                                      </td>
                                      <td className="px-6 py-5 text-right">
                                         <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-gray-900">{new Date(p.created_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                               {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                         </div>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    )}
                    {totalPages > 1 && (
                       <div className="border-t border-gray-50 p-4 bg-gray-50/30">
                          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                       </div>
                    )}
                 </div>
              </section>
           </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Gateway Configuration"
        size="md"
      >
        <form onSubmit={handleSaveKeys} className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
             <ShieldCheck className="w-6 h-6 text-[#1a337e] shrink-0 mt-0.5" strokeWidth={2.4} />
             <div>
                <p className="text-sm font-black text-[#1a337e] uppercase tracking-tight">Security Protocol</p>
                <p className="text-[10px] font-bold text-[#1a337e]/70 mt-1 uppercase tracking-wider leading-relaxed">
                   API keys are encrypted at rest and only decrypted during transaction initialization.
                </p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Key ID</label>
                <div className="relative group">
                   <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a337e] transition-colors" size={16} strokeWidth={2.4} />
                   <input
                    type="text"
                    value={keyForm.razorpay_key_id}
                    onChange={e => setKeyForm(f => ({ ...f, razorpay_key_id: e.target.value }))}
                    placeholder="rzp_live_xxxxxxxxxxxx"
                    className="w-full pl-12 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl text-sm font-mono font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1a337e]/5 focus:border-[#1a337e] transition-all shadow-inner"
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Key Secret</label>
                <div className="relative group">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a337e] transition-colors" size={16} strokeWidth={2.4} />
                   <input
                    type={showSecret ? 'text' : 'password'}
                    value={keyForm.razorpay_key_secret}
                    onChange={e => setKeyForm(f => ({ ...f, razorpay_key_secret: e.target.value }))}
                    placeholder="••••••••••••••••••••"
                    className="w-full pl-12 pr-12 py-3 border border-gray-100 bg-gray-50 rounded-2xl text-sm font-mono font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1a337e]/5 focus:border-[#1a337e] transition-all shadow-inner"
                   />
                   <button
                    type="button"
                    onClick={() => setShowSecret(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a337e] transition-colors"
                   >
                    {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={keySaving}
              className="px-10 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#1a337e] rounded-xl hover:brightness-110 shadow-xl shadow-[#1a337e]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {keySaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <SaveIcon size={14} strokeWidth={2.4} />
                  Save Registry
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
