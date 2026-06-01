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
  FileText,
  Download,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  History,
  Briefcase,
  Flag,
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ActionDropdown from '../components/common/ActionDropdown';
import { 
  fetchNominations, 
  fetchNominationStats,
  approveNomination, 
  rejectNomination,
  suspendNomination,
  deleteNomination,
  selectNominations,
  selectNominationStats,
  selectNominationTotal,
  selectNominationLoading,
  selectNominationActionLoading
} from '../store/slices/nominationSlice';

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
  { value: '', label: 'All Nominations' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

const PER_PAGE = 10;

export default function NominationsPage() {
  const dispatch = useDispatch();
  const nominations = useSelector(selectNominations);
  const statsRaw = useSelector(selectNominationStats);
  const total = useSelector(selectNominationTotal);
  const loading = useSelector(selectNominationLoading);
  const actionLoading = useSelector(selectNominationActionLoading);

  const stats = useMemo(() => statsRaw?.data || statsRaw || {}, [statsRaw]);

  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewNominee, setViewNominee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionTarget, setActionTarget] = useState(null); // { id, type: 'approve' | 'suspend' | 'reject' }

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchNominationStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchNominations({ 
      status: activeTab || undefined, 
      search: search || undefined, 
      page, 
      per_page: PER_PAGE 
    }));
  }, [activeTab, search, page, dispatch]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleApprove(id) {
    try {
      await dispatch(approveNomination(id)).unwrap();
      toast.success('Nomination approved successfully');
      setActionTarget(null);
      dispatch(fetchNominationStats());
    } catch (err) {
      toast.error(err || 'Failed to approve');
    }
  }

  async function handleSuspend(id) {
    try {
      await dispatch(suspendNomination(id)).unwrap();
      toast.success('Nomination suspended');
      setActionTarget(null);
      dispatch(fetchNominationStats());
    } catch (err) {
      toast.error(err || 'Failed to suspend');
    }
  }

  async function handleReject(id) {
    try {
      await dispatch(rejectNomination(id)).unwrap();
      toast.success('Nomination rejected');
      setActionTarget(null);
      dispatch(fetchNominationStats());
    } catch (err) {
      toast.error(err || 'Failed to reject');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteNomination(deleteTarget.id)).unwrap();
      toast.success('Nomination deleted');
      setDeleteTarget(null);
      dispatch(fetchNominationStats());
    } catch (err) {
      toast.error(err || 'Delete failed');
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  const handleDownload = (url, filename) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = (nominee) => {
    if (nominee.image_url) handleDownload(nominee.image_url, `photo_${nominee.full_name}.jpg`);
    if (nominee.signature_url) handleDownload(nominee.signature_url, `signature_${nominee.full_name}.png`);
  };

  return (
    <MainLayout title="Nominated Users">
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Nomination Management</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Nominated Users</h2>
          </div>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <MetricCard 
            title="Total Nominations" 
            value={numberFormat(stats?.total ?? 0)} 
            icon={Users} 
            tone="indigo"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total submitted applications</p>
          </MetricCard>

          <MetricCard 
            title="Pending Review" 
            value={numberFormat(stats?.pending ?? 0)} 
            icon={ShieldAlert} 
            tone="amber"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Awaiting authorization</p>
          </MetricCard>

          <MetricCard 
            title="Approved" 
            value={numberFormat(stats?.approved ?? 0)} 
            icon={UserCheck} 
            tone="emerald"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified & Approved</p>
          </MetricCard>

          <MetricCard 
            title="Suspended" 
            value={numberFormat(stats?.suspended ?? 0)} 
            icon={Ban} 
            tone="blue"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Temporarily on hold</p>
          </MetricCard>

          <MetricCard 
            title="Rejected" 
            value={numberFormat(stats?.rejected ?? 0)} 
            icon={X} 
            tone="red"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Not eligible</p>
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
              placeholder="Search by name, email or phone..."
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

        {/* Nominations List Table */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {loading && nominations.length === 0 ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : nominations.length === 0 ? (
            <div className="px-6 py-32 text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                <Users className="w-12 h-12 text-gray-200" />
              </div>
              <p className="text-gray-900 font-black uppercase tracking-tight text-xl">No Nominations Found</p>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">
                {search ? `Zero matches for "${search}"` : 'No nomination applications found.'}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-visible">
              <div className="overflow-x-auto rounded-t-3xl">
                <table className="w-full min-w-[1100px] border-separate border-spacing-y-2 px-4 pb-4">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      <th className="px-6 py-5 text-left">Name</th>
                      <th className="px-6 py-5 text-left">Contact Info</th>
                      <th className="px-6 py-5 text-left">Area</th>
                      <th className="px-6 py-5 text-left">Date</th>
                      <th className="px-6 py-5 text-left">Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {nominations.map((nominee, idx) => (
                      <tr key={nominee.id} className="group transition-all duration-200">
                        <td className="rounded-l-2xl bg-white border border-r-0 border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 overflow-hidden flex items-center justify-center text-[#1a337e] font-black text-lg border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                              {nominee.image_url ? (
                                <img src={nominee.image_url} alt={nominee.full_name} className="w-full h-full object-cover" />
                              ) : (
                                nominee.full_name?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate text-sm font-black text-gray-900 tracking-tight">
                                {nominee.full_name}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#1a337e] truncate">{nominee.position_name || 'Candidate'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 truncate max-w-[180px]">
                              {nominee.email}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {nominee.phone}
                            </span>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
                              {nominee.target?.name || 'N/A'}
                            </span>
                            <span className="text-[9px] font-black text-[#1a337e] uppercase tracking-tighter">
                              {nominee.district || nominee.village || 'Location Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <span className="text-xs font-bold text-gray-400 tabular-nums">
                            {nominee.created_at ? new Date(nominee.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <Badge status={nominee.status} />
                        </td>
                        <td className="rounded-r-2xl bg-white border border-l-0 border-gray-100 px-6 py-5 text-right group-hover:bg-gray-50 transition-colors">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => setViewNominee(nominee)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1a337e] hover:bg-[#1a337e] hover:text-white transition-all shadow-sm border border-blue-100"
                              title="View Detailed Profile"
                            >
                              <Eye size={16} strokeWidth={2.4} />
                            </button>

                            <ActionDropdown
                              actions={[
                                nominee.status === 'pending' && {
                                  label: 'Approve',
                                  icon: CheckCircle2,
                                  onClick: () => setActionTarget({ id: nominee.id, type: 'approve', name: nominee.full_name }),
                                },
                                nominee.status !== 'suspended' && {
                                  label: 'Suspend',
                                  icon: Ban,
                                  onClick: () => setActionTarget({ id: nominee.id, type: 'suspend', name: nominee.full_name }),
                                },
                                nominee.status !== 'rejected' && {
                                  label: 'Not Eligible',
                                  icon: ShieldAlert,
                                  onClick: () => setActionTarget({ id: nominee.id, type: 'reject', name: nominee.full_name }),
                                },
                                {
                                  label: 'Delete',
                                  icon: Trash2,
                                  danger: true,
                                  onClick: () => setDeleteTarget(nominee),
                                },
                              ]}
                            />
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-6 rounded-b-3xl">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Nomination Details Modal */}
      <Modal isOpen={!!viewNominee} onClose={() => setViewNominee(null)} title="Nominee Information" size="4xl">
        {viewNominee && (
          <div className="space-y-6 py-0.5">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-5 border-b border-gray-100">
               <div className="relative group">
                 <div className="w-24 h-24 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-[#1a337e] text-3xl font-black border-2 border-indigo-100 shadow-inner overflow-hidden transition-transform group-hover:scale-105 duration-500">
                   {viewNominee.image_url ? (
                     <img src={viewNominee.image_url} alt={viewNominee.full_name} className="w-full h-full object-cover" />
                   ) : (
                     viewNominee.full_name?.[0]?.toUpperCase()
                   )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 scale-75 origin-bottom-right">
                    <Badge status={viewNominee.status} />
                 </div>
               </div>
               
               <div className="flex-1 text-center md:text-left space-y-2">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{viewNominee.full_name}</h3>
                    <p className="text-[11px] text-[#1a337e] font-black uppercase tracking-[0.1em]">{viewNominee.position_name || 'Candidate'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Election</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{viewNominee.election?.title || 'General'}</p>
                    </div>
                    <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Unit</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{viewNominee.committee?.name || 'Standard'}</p>
                    </div>
                    <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Voter ID</p>
                      <p className="text-[11px] font-bold text-gray-700">{viewNominee.voter_id_number || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Age/Sex</p>
                      <p className="text-[11px] font-bold text-gray-700 capitalize">{viewNominee.gender?.[0] || 'N/A'} • {viewNominee.date_of_birth || 'N/A'}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-1 rounded-full bg-[#1a337e]" />
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Personal Info</p>
                  </div>
                  <div className="grid gap-2">
                     <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                           <Shield size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">ID Type</p>
                           <p className="text-[11px] font-bold text-gray-700">{viewNominee.kyc_type || 'ID Card'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                           <MapPin size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Location</p>
                           <p className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">{viewNominee.district || 'Not Mapped'}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-1 rounded-full bg-[#1a337e]" />
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider">History</p>
                  </div>
                  <div className="grid gap-2">
                     <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                           <Briefcase size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Past Candidate</p>
                           <p className="text-[11px] font-bold text-gray-700">{viewNominee.held_previously ? 'Yes' : 'No'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                           <Flag size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Legal Status</p>
                           <p className={`text-[11px] font-bold ${viewNominee.is_disciplined ? 'text-red-600' : 'text-emerald-600'}`}>
                             {viewNominee.is_disciplined ? 'Issues' : 'Clean'}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-1 rounded-full bg-[#1a337e]" />
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider">About Me</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-inner min-h-[80px]">
                    <p className="text-[10px] leading-relaxed text-gray-500 font-medium italic">
                      &ldquo;{viewNominee.bio || "No statement."}&rdquo;
                    </p>
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-1 rounded-full bg-[#1a337e]" />
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Documents</p>
                  </div>
                  {(viewNominee.image_url || viewNominee.signature_url) && (
                    <button onClick={() => handleDownloadAll(viewNominee)} className="text-[8px] font-black uppercase text-[#1a337e] hover:underline flex items-center gap-1">
                      <Download size={8} /> Download All
                    </button>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="group relative rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-blue-200">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase text-gray-400">Photo</span>
                        {viewNominee.image_url && (
                          <button onClick={() => window.open(viewNominee.image_url, '_blank')} className="text-gray-400 hover:text-[#1a337e]">
                             <ExternalLink size={12} />
                          </button>
                        )}
                     </div>
                     <div className="aspect-[4/3] rounded-lg bg-gray-50 border border-dashed border-gray-100 overflow-hidden">
                        {viewNominee.image_url ? (
                          <img src={viewNominee.image_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-10"><Users size={20} /></div>
                        )}
                     </div>
                  </div>

                  <div className="group relative rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-purple-200">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase text-gray-400">Signature</span>
                        {viewNominee.signature_url && (
                          <button onClick={() => window.open(viewNominee.signature_url, '_blank')} className="text-gray-400 hover:text-[#1a337e]">
                             <ExternalLink size={12} />
                          </button>
                        )}
                     </div>
                     <div className="aspect-[4/3] rounded-lg bg-gray-50 border border-dashed border-gray-100 overflow-hidden">
                        {viewNominee.signature_url ? (
                          <img src={viewNominee.signature_url} alt="Signature" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-10"><FileText size={20} /></div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t border-gray-100">
              <button onClick={() => setViewNominee(null)} className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all active:scale-95">
                Close
              </button>
              {viewNominee.status === 'pending' && (
                <button onClick={() => { setViewNominee(null); setActionTarget({ id: viewNominee.id, type: 'approve', name: viewNominee.full_name }); }} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-md active:scale-95">
                  Approve
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Modal (Approve/Suspend/Reject) */}
      <Modal isOpen={!!actionTarget} onClose={() => setActionTarget(null)} title="Action Confirmation" size="xl">
        <div className="space-y-6">
          <div className={`flex items-start gap-4 p-5 rounded-2xl border ${
            actionTarget?.type === 'approve' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
            actionTarget?.type === 'suspend' ? 'bg-amber-50 border-amber-100 text-amber-900' :
            'bg-red-50 border-red-100 text-red-900'
          }`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              actionTarget?.type === 'approve' ? 'bg-emerald-100 text-emerald-600' :
              actionTarget?.type === 'suspend' ? 'bg-amber-100 text-amber-600' :
              'bg-red-100 text-red-600'
            }`}>
              {actionTarget?.type === 'approve' ? <CheckCircle2 className="w-6 h-6" /> : 
               actionTarget?.type === 'suspend' ? <Ban className="w-6 h-6" /> : 
               <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Confirm Authorization</p>
              <p className="text-xs font-bold opacity-70 mt-1 leading-relaxed uppercase tracking-wider">
                Are you sure you want to <span className="underline">{actionTarget?.type}</span> the nomination for <span className="font-black italic">{actionTarget?.name}</span>? This action will be logged in the audit trail.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setActionTarget(null)}
              className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (actionTarget.type === 'approve') handleApprove(actionTarget.id);
                else if (actionTarget.type === 'suspend') handleSuspend(actionTarget.id);
                else handleReject(actionTarget.id);
              }}
              className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[140px] ${
                actionTarget?.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20' :
                actionTarget?.type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20' :
                'bg-red-600 hover:bg-red-700 shadow-red-900/20'
              }`}
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                `Confirm ${actionTarget?.type}`
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Nomination" size="sm">
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Irreversible Action</p>
              <p className="text-xs font-bold text-red-600/70 mt-1 leading-relaxed uppercase tracking-wider">
                You are about to <span className="underline">permanently delete</span> the nomination for {deleteTarget?.full_name}. This data cannot be recovered.
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
                'Delete Permanently'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
