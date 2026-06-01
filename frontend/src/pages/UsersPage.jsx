import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Ban, 
  Search, 
  X, 
  Eye, 
  Trash2, 
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import { 
  fetchUsers, 
  approveUser, 
  blockUser, 
  deleteUser, 
  fetchUserStats,
  selectUsers,
  selectUserStats,
  selectUserTotal,
  selectUserLoading,
  selectUserActionLoading
} from '../store/slices/userSlice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numberFormat(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
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

// ─── Status Filter Constants ──────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'All Users' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

const PER_PAGE = 10;

export default function UsersPage() {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const stats = useSelector(selectUserStats);
  const total = useSelector(selectUserTotal);
  const loading = useSelector(selectUserLoading);
  const actionLoading = useSelector(selectUserActionLoading);

  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewUser, setViewUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchUserStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchUsers({ 
      status: activeTab || undefined, 
      search: search || undefined, 
      page, 
      per_page: PER_PAGE 
    }));
  }, [activeTab, search, page, dispatch]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleApprove(user) {
    try {
      await dispatch(approveUser(user.id)).unwrap();
      toast.success(`${user.full_name} approved successfully`);
      dispatch(fetchUserStats());
    } catch (err) {
      toast.error(err || 'Failed to approve');
    }
  }

  async function handleBlock(user) {
    try {
      await dispatch(blockUser(user.id)).unwrap();
      toast.success(`${user.full_name} ${user.status === 'blocked' ? 'unblocked' : 'blocked'}`);
      dispatch(fetchUserStats());
    } catch (err) {
      toast.error(err || 'Operation failed');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteUser(deleteTarget.id)).unwrap();
      toast.success('User purged from registry');
      setDeleteTarget(null);
      dispatch(fetchUserStats());
    } catch (err) {
      toast.error(err || 'Delete failed');
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  const filteredUsers = useMemo(() => {
     // Search filtering is handled by API usually, but if not we can add local filter here.
     // In this case, useEffect calls fetchUsers with search param, so it's server-side.
     return users;
  }, [users]);

  return (
    <MainLayout title="User Directory">
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Registry Management</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">User Directory</h2>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard 
            title="Total Registry" 
            value={numberFormat(stats?.total_users ?? 0)} 
            icon={Users} 
            tone="indigo"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total registered identities</p>
          </MetricCard>

          <MetricCard 
            title="Active Voters" 
            value={numberFormat(stats?.active_voters ?? 0)} 
            icon={UserCheck} 
            tone="emerald"
          >
             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats?.total_voters ? (stats.active_voters / stats.total_voters) * 100 : 0}%` }} />
             </div>
          </MetricCard>

          <MetricCard 
            title="Pending Review" 
            value={numberFormat(stats?.pending_users ?? 0)} 
            icon={ShieldAlert} 
            tone="amber"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Awaiting authorization</p>
          </MetricCard>

          <MetricCard 
            title="Blocked Access" 
            value={numberFormat(stats?.blocked_users ?? 0)} 
            icon={Ban} 
            tone="red"
          >
             <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Restricted from protocol</p>
             </div>
          </MetricCard>
        </section>

        {/* Filter & Search Bar */}
        <section className="flex flex-col items-center justify-between gap-6 md:flex-row bg-gray-50 border border-gray-200 p-6 rounded-3xl shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-12 pr-10 text-sm font-bold text-gray-900 placeholder-gray-400 focus:border-[#1a337e] focus:ring-4 focus:ring-[#1a337e]/5 outline-none transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a337e]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-white border border-gray-100 p-1 shadow-sm overflow-x-auto max-w-full">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setActiveTab(value); setPage(1); }}
                className={`whitespace-nowrap rounded-lg px-5 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${activeTab === value
                    ? 'bg-[#1a337e] text-white shadow-lg shadow-[#1a337e]/20'
                    : 'text-gray-500 hover:text-[#1a337e] hover:bg-blue-50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* User List Table */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {loading && filteredUsers.length === 0 ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-32 text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                <Users className="w-12 h-12 text-gray-200" />
              </div>
              <p className="text-gray-900 font-black uppercase tracking-tight text-xl">No Identities Found</p>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">
                {search ? `Zero matches for "${search}"` : 'The registry is currently empty.'}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] border-separate border-spacing-y-2 px-4 pb-4">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <th className="px-6 py-5 text-left">User Identity</th>
                    <th className="px-6 py-5 text-left">Jurisdiction</th>
                    <th className="px-6 py-5 text-left">System Access</th>
                    <th className="px-6 py-5 text-left">Verification</th>
                    <th className="px-6 py-5 text-left">Joined</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {filteredUsers.map((user) => {
                    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
                    return (
                      <tr key={user.id} className="group transition-all duration-200">
                        <td className="rounded-l-2xl bg-white border border-r-0 border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#1a337e] font-black text-lg border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                              {user.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate text-sm font-black text-gray-900 tracking-tight">
                                {user.full_name}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
                              {user.target ? user.target.name : 'Unassigned'}
                            </span>
                            {user.target?.type && (
                              <span className="text-[9px] font-black text-[#1a337e] uppercase tracking-tighter">
                                {user.target.type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isAdmin
                                ? 'bg-[#e8eaf6] text-[#1a337e] border border-blue-100'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                {user.role}
                              </span>
                              <Badge status={user.status} />
                            </div>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.is_verified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {user.is_verified ? 'Verified' : 'Pending'}
                              </span>
                           </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <span className="text-xs font-bold text-gray-400 tabular-nums">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="rounded-r-2xl bg-white border border-l-0 border-gray-100 px-6 py-5 text-right group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => setViewUser(user)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1a337e] hover:bg-[#1a337e] hover:text-white transition-all shadow-sm border border-blue-100"
                              title="View Profile"
                            >
                              <Eye size={16} strokeWidth={2.4} />
                            </button>
                            
                            {user.status === 'pending' && (
                              <button 
                                onClick={() => handleApprove(user)} 
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                title="Authorize User"
                              >
                                <CheckCircle2 size={16} strokeWidth={2.4} />
                              </button>
                            )}

                            {!isAdmin && (
                              <button 
                                onClick={() => handleBlock(user)} 
                                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-sm border ${
                                  user.status === 'blocked' 
                                  ? 'bg-blue-50 text-[#1a337e] hover:bg-[#1a337e] hover:text-white border-blue-100' 
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border-amber-100'
                                }`}
                                title={user.status === 'blocked' ? 'Restore Access' : 'Restrict Access'}
                              >
                                <Ban size={16} strokeWidth={2.4} />
                              </button>
                            )}

                            {!isAdmin && (
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                title="Purge Identity"
                              >
                                <Trash2 size={16} strokeWidth={2.4} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-6 rounded-b-3xl">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="2xl">
        {viewUser && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
               <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-[#1a337e] text-4xl font-black border border-indigo-100 shadow-inner">
                 {viewUser.full_name?.[0]?.toUpperCase()}
               </div>
               <div className="min-w-0">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate">{viewUser.full_name}</h3>
                  <p className="text-sm text-[#1a337e] font-black uppercase tracking-widest mt-1">{viewUser.role} Account</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge status={viewUser.status} />
                    {viewUser.is_verified && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-600 border border-emerald-100">
                        <CheckCircle2 size={10} strokeWidth={3} />
                        Verified
                      </span>
                    )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Info</p>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                           <Mail size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                           <p className="text-sm font-bold text-gray-700">{viewUser.email}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                           <Phone size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                           <p className="text-sm font-bold text-gray-700">{viewUser.phone || '—'}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Account Details</p>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                           <MapPin size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                           <p className="text-sm font-bold text-gray-700">{viewUser.target ? `${viewUser.target.name} (${viewUser.target.type})` : 'Unassigned'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                           <Calendar size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Date</p>
                           <p className="text-sm font-bold text-gray-700">{viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : '—'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-gray-100">
              <button 
                onClick={() => setViewUser(null)} 
                className="px-10 py-3 text-xs font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Decommission Identity" size="sm">
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">Final Warning</p>
              <p className="text-xs font-bold text-red-600/70 mt-1 leading-relaxed uppercase tracking-wider">
                You are about to <span className="underline">permanently purge</span> {deleteTarget?.full_name}. This identity and all associated voting history will be erased from the registry.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center min-w-[140px]"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Purge Identity'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
