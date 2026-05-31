import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Filter,
  MapPinned,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  StopCircle,
  Trophy,
  BarChart,
  Trash2,
  Users,
  Vote,
  Globe,
  Landmark,
  Check,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser, selectCurrentUser } from '../store/slices/authSlice';
import {
  fetchElections,
  createElection,
  updateElection,
  deleteElection,
  activateElection,
  closeElection,
  selectElections,
  selectElectionLoading,
  selectElectionActionLoading,
} from '../store/slices/electionSlice';
import { fetchTargets } from '../store/slices/targetSlice';
import { fetchTenants, selectTenants } from '../store/slices/tenantSlice';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import MainLayout from '../components/layout/MainLayout';
import ActionDropdown from '../components/common/ActionDropdown';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Select from '../components/common/Select';
import SearchableSelect from '../components/common/SearchableSelect';
import MultiSearchableSelect from '../components/common/MultiSearchableSelect';
import { format, parseISO } from 'date-fns';

const LIMIT = 10;

const STATUS_FILTERS = [
  { value: '', label: 'All Elections' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

const ELECTION_TYPE_OPTIONS = [
  { value: 'internal', label: 'Internal party election' }
];

const JURISDICTION_TYPES = [
  { value: 'country', label: 'Working - India', levels: [] },
  { value: 'state', label: 'Pradesh', levels: ['state'] },
  { value: 'district', label: 'District', levels: ['state', 'district'] },
  { value: 'block', label: 'Block', levels: ['state', 'district', 'block'] },
  { value: 'booth', label: 'Booth', levels: ['state', 'district', 'block', 'booth'] },
];

function safeFormat(dateStr) {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr || '—';
  }
}

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

function compactNumber(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

function getCandidateCount(election) {
  return election.candidate_count ?? election.candidateCount ?? election.candidates_count ?? election.candidatesCount ?? 0;
}

function getScopeLabel(target, targets = []) {
  if (targets && targets.length > 0) {
    if (targets.length === 1) return `${targets[0].name} (${targets[0].type})`;
    return `${targets.length} Areas Selected`;
  }
  return target ? `${target.name} (${target.type})` : 'All regions';
}

function getLifecycle(election) {
  const status = election?.status?.toLowerCase();
  if (status === 'closed') return { progress: '100%', current: 3, label: 'Closed' };
  if (status === 'active') return { progress: '66%', current: 2, label: 'Active' };
  return { progress: '33%', current: 1, label: 'Draft' };
}

const emptyForm = {
  title: '',
  description: '',
  election_type: 'internal',
  nomination_start_date: '',
  nomination_end_date: '',
  voting_start_date: '',
  voting_end_date: '',
  jurisdiction_type: 'state',
  tenant_id: '',
  selections: {
    state: '',
    district: [], 
    block: [],
    booth: []
  }
};

// ─── Field Components ────────────────────────────────────────────────────────

function Field({ label, required, children, hint, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled, required, hasError, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`block w-full px-3 py-2 border rounded-lg text-sm text-[#1a337e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a337e] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
      }`}
      {...props}
    />
  );
}

function Textarea({ value, onChange, placeholder, disabled, required, hasError, rows = 3, ...props }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      rows={rows}
      className={`block w-full px-3 py-2 border rounded-lg text-sm text-[#1a337e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a337e] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors resize-none ${
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
      }`}
      {...props}
    />
  );
}

export default function ElectionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const elections = useSelector(selectElections);
  const loading = useSelector(selectElectionLoading);
  const actionLoading = useSelector(selectElectionActionLoading);
  const { targets } = useSelector(s => s.targets);
  const tenants = useSelector(selectTenants);
  const currentUser = useSelector(selectCurrentUser);
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal / dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const [deleteDialog, setDeleteDialog] = useState({ open: false, target: null });
  const [activateDialog, setActivateDialog] = useState({ open: false, target: null });
  const [closeDialog, setCloseDialog] = useState({ open: false, target: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadElections = useCallback(() => {
    const params = { page, limit: LIMIT };
    if (statusFilter) params.status = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    dispatch(fetchElections(params));
    dispatch(fetchTargets());
    if (isSuperAdmin) {
      dispatch(fetchTenants({ page: 1, per_page: 100 }));
    }
  }, [dispatch, page, statusFilter, debouncedSearch, isSuperAdmin]);

  useEffect(() => {
    loadElections();
  }, [loadElections]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const country = useMemo(() => targets.find(t => t.type === 'country'), [targets]);

  const openCreateModal = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleLevelChange = (level, value) => {
    setForm(prev => {
      const nextSels = { ...prev.selections, [level]: value };
      if (level === 'state') { nextSels.district = []; nextSels.block = []; nextSels.booth = []; }
      if (level === 'district') { nextSels.block = []; nextSels.booth = []; }
      if (level === 'block') { nextSels.booth = []; }
      return { ...prev, selections: nextSels };
    });
  };

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.nomination_start_date) errs.nomination_start_date = 'Required';
    if (!form.nomination_end_date) errs.nomination_end_date = 'Required';
    if (!form.voting_start_date) errs.voting_start_date = 'Required';
    if (!form.voting_end_date) errs.voting_end_date = 'Required';

    if (isSuperAdmin && !form.tenant_id) {
      errs.tenant_id = 'Tenant is required';
    }

    if (form.nomination_start_date && form.nomination_end_date) {
      if (new Date(form.nomination_end_date) < new Date(form.nomination_start_date)) {
        errs.nomination_end_date = 'Must be after start';
      }
    }

    if (form.voting_start_date && form.voting_end_date) {
      if (new Date(form.voting_end_date) < new Date(form.voting_start_date)) {
        errs.voting_end_date = 'Must be after start';
      }
    }

    if (form.nomination_end_date && form.voting_start_date) {
      if (new Date(form.voting_start_date) < new Date(form.nomination_end_date)) {
        errs.voting_start_date = 'Must be after nomination';
      }
    }
    
    const activeJuris = JURISDICTION_TYPES.find(j => j.value === form.jurisdiction_type);
    if (activeJuris && activeJuris.levels.length > 0) {
      const deepestLevel = activeJuris.levels[activeJuris.levels.length - 1];
      const val = form.selections[deepestLevel];
      if (Array.isArray(val)) {
        if (val.length === 0) errs.jurisdiction = 'Select at least one area';
      } else {
        if (!val) errs.jurisdiction = 'Selection required';
      }
    }
    
    return errs;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      toast.error('Please complete all required fields and jurisdiction hierarchy.');
      return;
    }

    const activeJuris = JURISDICTION_TYPES.find(j => j.value === form.jurisdiction_type);
    let targetIds = [];
    if (form.jurisdiction_type === 'country') targetIds = country ? [country.id] : [];
    else if (form.jurisdiction_type === 'state') targetIds = [form.selections.state];
    else {
      const deepestLevel = activeJuris.levels[activeJuris.levels.length - 1];
      targetIds = form.selections[deepestLevel];
    }

    const payload = {
      title: form.title,
      description: form.description,
      nomination_start_date: `${form.nomination_start_date}T00:00:00`,
      nomination_end_date: `${form.nomination_end_date}T23:59:59`,
      start_date: `${form.voting_start_date}T00:00:00`,
      end_date: `${form.voting_end_date}T23:59:59`,
      committee_level: form.jurisdiction_type,
      target_ids: targetIds.map(id => parseInt(id)),
      status: 'draft'
    };

    const result = await dispatch(createElection({ 
      payload, 
      params: isSuperAdmin ? { tenant_id: form.tenant_id } : {} 
    }));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Election created in Draft mode');
      setModalOpen(false);
      loadElections();
    } else {
      toast.error(result.payload || 'Failed to initialize election');
    }
  };

  const handleRowAction = (election) => {
    const status = election.status?.toLowerCase();
    if (status === 'draft') {
      setActivateDialog({ open: true, target: election });
    } else if (status === 'active') {
      setCloseDialog({ open: true, target: election });
    }
  };

  const getActionLabel = (election) => {
    const status = election.status?.toLowerCase();
    if (status === 'draft') return 'Activate';
    if (status === 'active') return 'Close';
    return null;
  };

  const dataWithAction = elections.map((e) => ({
    ...e,
    id: e._id || e.id,
    _actionLabel: getActionLabel(e),
  }));

  const totalPages = Math.ceil(elections.length / LIMIT);
  const featuredElection = dataWithAction.find((e) => e.status?.toLowerCase() === 'active') || dataWithAction[0];
  const lifecycle = getLifecycle(featuredElection);
  const activeCount = dataWithAction.filter((e) => e.status?.toLowerCase() === 'active').length;
  const draftCount = dataWithAction.filter((e) => e.status?.toLowerCase() === 'draft').length;
  const closedCount = dataWithAction.filter((e) => e.status?.toLowerCase() === 'closed').length;
  const totalCandidates = dataWithAction.reduce((sum, election) => sum + Number(getCandidateCount(election) || 0), 0);
  const winnerCount = dataWithAction.filter((e) => e.winner_declared && e.winner).length;
  
  const activeConfig = JURISDICTION_TYPES.find(j => j.value === form.jurisdiction_type);

  return (
    <MainLayout title="Election Monitoring">
      <div className="mx-auto w-full space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">
                Network Protocol Registry
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">
              {featuredElection?.title || 'Elections Dashboard'}
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-2 max-w-2xl leading-relaxed">
              Monitor election lifecycle, candidate readiness, and jurisdictional scope across the multi-tenant cluster.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-600 transition hover:bg-gray-50 active:scale-95"
            >
              <FileText className="h-4 w-4" />
              View Results
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1a337e] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#1a337e] shadow-xl shadow-[#1a337e]/20 active:scale-95"
              type="button"
            >
              <Plus size={16} />
              Initialize Election
            </button>
          </div>
        </section>

        {/* Lifecycle Progression Section */}
        <section className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
          <div className="mb-10 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Active Lifecycle Progression</h3>
             </div>
             <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 sa-pulse-green" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Cluster: Optimal</span>
              </div>
          </div>
          <div className="relative overflow-x-auto pb-4 px-2">
            <div className="absolute left-8 right-8 top-6 z-0 h-0.5 bg-gray-100 rounded-full" />
            <div className="absolute left-8 top-6 z-0 h-0.5 bg-[#1a337e] rounded-full transition-all duration-1000" style={{ width: `calc(${lifecycle.progress} - 64px)` }} />
            <div className="relative z-10 flex justify-between min-w-[700px]">
              {[
                { label: 'Draft Setup', sub: `${draftCount} Units`, icon: FileText },
                { label: 'Activation', sub: lifecycle.current === 1 ? 'Current' : `${activeCount} Active`, icon: PlayCircle },
                { label: 'Voting Phase', sub: activeCount ? 'Live' : 'Awaiting', icon: Vote },
                { label: 'Results', sub: `${closedCount} Closed`, icon: ShieldCheck },
              ].map(({ label, sub, icon: Icon }, index) => {
                const step = index + 1;
                const isComplete = lifecycle.current > step;
                const isCurrent = lifecycle.current === step;
                return (
                  <div key={label} className="flex flex-col items-center text-center group">
                    <div
                      className={`flex items-center justify-center rounded-2xl shadow-lg transition-all duration-500 ${
                        isCurrent
                          ? 'h-14 w-14 border-4 border-white bg-[#1a337e] text-white ring-4 ring-indigo-100 scale-110'
                          : isComplete
                            ? 'h-12 w-12 bg-[#1a337e] text-white'
                            : 'h-12 w-12 bg-gray-50 text-gray-300 border border-gray-100'
                      }`}
                    >
                      <Icon className={isCurrent ? 'h-6 w-6' : 'h-5 w-5'} strokeWidth={2.4} />
                    </div>
                    <span className={`mt-5 text-[11px] font-black uppercase tracking-widest ${isComplete || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.1em] mt-1.5 ${isCurrent ? 'text-[#1a337e]' : 'text-gray-300'}`}>
                      {sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Stats */}
          <div className="space-y-6 lg:col-span-4 order-2 lg:order-1">
            <MetricCard
              title="Participation Scope"
              icon={Users}
              tone="indigo"
              value={
                <>
                  <span className="text-4xl font-black text-gray-900 tracking-tight">{compactNumber(totalCandidates)}</span>
                  <span className="mb-1 flex items-center text-xs font-bold text-[#1a337e] ml-2">
                    Candidates
                  </span>
                </>
              }
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Registry Saturation</span>
                    <span className="text-gray-900">{Math.min(100, dataWithAction.length * 10)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-[#1a337e] transition-all duration-1000" style={{ width: `${Math.min(100, dataWithAction.length * 10)}%` }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="w-full rounded-2xl py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1a337e] bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-95"
                >
                  Inspect Voter registry
                </button>
              </div>
            </MetricCard>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { label: 'All Elections', value: dataWithAction.length, icon: Globe, tone: 'blue' },
                { label: 'Winner Declared', value: winnerCount, icon: Trophy, tone: 'amber' },
                { label: 'Draft Mode', value: draftCount, icon: FileText, tone: 'blue' },
                { label: 'Live Now', value: activeCount, icon: PlayCircle, tone: 'emerald' },
                
              ].map(({ label, value, icon: Icon, tone }) => {
                const toneMap = {
                  blue: 'bg-blue-50 text-[#1a337e] border-blue-100',
                  amber: 'bg-amber-50 text-amber-600 border-amber-100',
                  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                  indigo: 'bg-indigo-50 text-[#1a337e] border-indigo-100',
                };
                return (
                  <div key={label} className="group flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner transition-transform group-hover:scale-110 ${toneMap[tone]}`}>
                      <Icon className="h-6 w-6" strokeWidth={2.4} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                      <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Registry List */}
          <section className="space-y-6 lg:col-span-8 order-1 lg:order-2">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight text-gray-900">Election Registry</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Lifecycle control & node registry</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-[2.5rem] border border-gray-100 bg-gray-50/50 p-6 md:flex-row md:items-center shadow-sm">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a337e] transition-colors" />
                <input
                  type="text"
                  placeholder="Search by node title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-white py-3.5 pl-12 pr-4 text-sm font-bold text-gray-900 placeholder-gray-400 focus:border-[#1a337e] focus:ring-4 focus:ring-[#1a337e]/5 outline-none transition-all shadow-inner"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-xl px-5 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                      statusFilter === value
                        ? 'bg-[#1a337e] text-white shadow-lg shadow-indigo-200'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a337e]'
                    }`}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex h-64 items-center justify-center rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
                  <LoadingSpinner />
                </div>
              ) : dataWithAction.length === 0 ? (
                <div className="rounded-[2.5rem] border border-gray-100 bg-white p-20 text-center shadow-xl shadow-gray-200/50">
                  <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                    <Vote className="h-12 w-12 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Registry Inactive</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Zero matching protocols found in the current stream.</p>
                </div>
              ) : (
                dataWithAction.map((election) => {
                  const electionId = election._id || election.id;
                  const candidateCount = getCandidateCount(election);
                  const isLive = election.status?.toLowerCase() === 'active';
                  return (
                    <article
                      key={electionId}
                      className="rounded-3xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-500 ${
                          isLive ? 'bg-blue-50 border-blue-100 text-[#1a337e] animate-in zoom-in duration-500' : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}>
                          {isLive ? <CircleDot className="h-10 w-10 animate-pulse" strokeWidth={2.4} /> : <CalendarDays className="h-10 w-10" strokeWidth={2.4} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                             <h4 className="truncate text-xl font-black text-gray-900 tracking-tight group-hover:text-[#1a337e] transition-colors">
                                {election.title}
                             </h4>
                             <Badge status={election.status} />
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">ID: EL-{String(electionId).slice(-4)}</span>
                          </div>
                          <p className="line-clamp-1 text-sm text-gray-500 font-medium italic mb-4 max-w-2xl">
                            {election.description || 'Internal party operational protocol pending configuration.'}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {safeFormat(election.start_date || election.startDate)}
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500">
                              <MapPinned className="h-3.5 w-3.5" />
                              {getScopeLabel(election.target, election.targets)}
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                              <Users className="h-3.5 w-3.5" />
                              {candidateCount} Candidates
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[240px]">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => navigate(`/elections/${electionId}`)}
                              className="flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#1a337e] transition-all hover:bg-[#1a337e] hover:text-white shadow-sm"
                            >
                              <Eye size={14} strokeWidth={3} />
                              Manage
                            </button>
                            <button
                              onClick={() => navigate(`/results?election=${electionId}`)}
                              className="flex items-center justify-center gap-2 rounded-xl bg-[#1a337e] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#1a337e] shadow-xl shadow-[#1a337e]/20"
                            >
                              <BarChart size={14} strokeWidth={3} />
                              Results
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {election._actionLabel ? (
                                <button
                                  type="button"
                                  onClick={() => handleRowAction(election)}
                                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                    election._actionLabel === 'Activate' 
                                      ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' 
                                      : 'border-red-100 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600'
                                  }`}
                                >
                                  {election._actionLabel === 'Activate' ? <PlayCircle className="h-4 w-4" /> : <StopCircle className="h-4 w-4" />}
                                  {election._actionLabel}
                                </button>
                             ) : (
                                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                   <CheckCircle2 className="h-3.5 w-3.5" />
                                   Protocol Finalized
                                </div>
                             )}
                             <ActionDropdown
                                align="right"
                                actions={[
                                  {
                                    key: 'delete',
                                    label: 'Delete',
                                    icon: Trash2,
                                    danger: true,
                                    onClick: () => setDeleteDialog({ open: true, target: election }),
                                  },
                                ]}
                             />
                          </div>
                        </div>
                      </div>
                      
                      {election.winner_declared && election.winner && (
                        <div className="absolute right-0 top-0 overflow-hidden w-24 h-24">
                           <div className="bg-amber-400 text-white font-black text-[8px] uppercase tracking-widest py-1 absolute -right-8 top-5 w-32 text-center transform rotate-45 shadow-sm">
                              Winner: {election.winner.candidate_name.split(' ')[0]}
                           </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm mt-8">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </section>
        </div>

        {/* Modal: Create Election */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Election"
          size="3xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
               {/* Left: Info & Schedule */}
               <div className="md:col-span-6 space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Election Identification
                    </p>
                    
                    <Field label="Name" required error={formErrors.title}>
                      <Input
                        value={form.title}
                        onChange={e => {
                          setForm(f => ({ ...f, title: e.target.value }));
                          if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined }));
                        }}
                        placeholder="e.g. District Council 2026"
                        hasError={!!formErrors.title}
                      />
                    </Field>

                    <Field label="Description" error={formErrors.description}>
                      <Textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Provide details about the election scope or purpose..."
                        rows={3}
                      />
                    </Field>

                    <Select
                       label="Type"
                       value={form.election_type}
                       options={ELECTION_TYPE_OPTIONS}
                       disabled
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Key Schedule
                     </p>
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Nomination Start" required error={formErrors.nomination_start_date}>
                          <Input 
                            type="date" 
                            value={form.nomination_start_date} 
                            onChange={e => setForm(f => ({ ...f, nomination_start_date: e.target.value }))}
                            hasError={!!formErrors.nomination_start_date}
                          />
                        </Field>
                        <Field label="Nomination End" required error={formErrors.nomination_end_date}>
                          <Input 
                            type="date" 
                            value={form.nomination_end_date} 
                            onChange={e => setForm(f => ({ ...f, nomination_end_date: e.target.value }))}
                            hasError={!!formErrors.nomination_end_date}
                          />
                        </Field>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Field label="Voting Start" required error={formErrors.voting_start_date}>
                          <Input 
                            type="date" 
                            value={form.voting_start_date} 
                            onChange={e => setForm(f => ({ ...f, voting_start_date: e.target.value }))}
                            hasError={!!formErrors.voting_start_date}
                          />
                        </Field>
                        <Field label="Voting End" required error={formErrors.voting_end_date}>
                          <Input 
                            type="date" 
                            value={form.voting_end_date} 
                            onChange={e => setForm(f => ({ ...f, voting_end_date: e.target.value }))}
                            hasError={!!formErrors.voting_end_date}
                          />
                        </Field>
                     </div>
                  </div>
               </div>

               {/* Right: Jurisdiction */}
               <div className="md:col-span-6 space-y-6 md:border-l md:border-gray-100 md:pl-8">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Jurisdiction & Eligibility
                    </p>

                    <div className="grid grid-cols-1 gap-1 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                      {JURISDICTION_TYPES.map(j => (
                        <button
                          key={j.value}
                          type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, jurisdiction_type: j.value, selections: { state: '', district: [], block: [], booth: [] } }))
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                            form.jurisdiction_type === j.value 
                              ? 'bg-[#1a337e] text-white font-bold shadow-md' 
                              : 'text-gray-500 hover:bg-white hover:text-[#1a337e]'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider">{j.label}</span>
                          {form.jurisdiction_type === j.value ? <Check size={14} /> : <ChevronRight size={10} className="opacity-20" />}
                        </button>
                      ))}
                    </div>

                    {isSuperAdmin && (
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <Field label="Organization" required error={formErrors.tenant_id}>
                          <SearchableSelect
                            options={tenants.map(t => ({ id: t.id, name: t.name }))}
                            value={form.tenant_id}
                            onChange={v => setForm(f => ({ ...f, tenant_id: v }))}
                            placeholder="Search Tenant..."
                          />
                        </Field>
                      </div>
                    )}

                    <div className="space-y-4 pt-1 border-t border-gray-50 mt-1">
                      {form.jurisdiction_type === 'country' ? (
                        <div className="py-12 text-center space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in zoom-in-95">
                           <Globe className="text-[#1a337e] w-8 h-8 mx-auto animate-pulse" />
                           <p className="text-[10px] font-black uppercase text-[#1a337e] tracking-widest">National Level (India)</p>
                           <p className="text-[9px] text-[#1a337e] font-medium">All registered members eligible</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeConfig && activeConfig.levels.includes('state') && (
                            <Field label="State" required error={formErrors.jurisdiction}>
                              <SearchableSelect
                                options={targets.filter(t => t.type === 'state')}
                                value={form.selections.state}
                                onChange={v => handleLevelChange('state', v)}
                                placeholder="Search State..."
                              />
                            </Field>
                          )}

                          {activeConfig && activeConfig.levels.includes('district') && form.selections.state && (
                            <Field label="District(s)" required error={formErrors.jurisdiction}>
                              <MultiSearchableSelect
                                options={targets.filter(t => t.type === 'district' && t.parent_id === form.selections.state)}
                                value={form.selections.district}
                                onChange={v => handleLevelChange('district', v)}
                                placeholder="Select Districts..."
                              />
                            </Field>
                          )}

                          {activeConfig && activeConfig.levels.includes('block') && form.selections.district.length > 0 && (
                            <Field label="Block(s)" required error={formErrors.jurisdiction}>
                              <MultiSearchableSelect
                                options={targets.filter(t => t.type === 'block' && form.selections.district.includes(t.parent_id))}
                                value={form.selections.block}
                                onChange={v => handleLevelChange('block', v)}
                                placeholder="Select Blocks..."
                              />
                            </Field>
                          )}

                          {activeConfig && activeConfig.levels.includes('booth') && form.selections.block.length > 0 && (
                            <Field label="Booth(s)" required error={formErrors.jurisdiction}>
                              <MultiSearchableSelect
                                options={targets.filter(t => t.type === 'booth' && form.selections.block.includes(t.parent_id))}
                                value={form.selections.booth}
                                onChange={v => handleLevelChange('booth', v)}
                                placeholder="Select Booths..."
                              />
                            </Field>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1a337e] rounded-lg hover:bg-[#0d1245] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[150px] justify-center"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Add Election'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Action Dialogs */}
        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, target: null })}
          onConfirm={async () => {
            const id = deleteDialog.target?.id;
            await dispatch(deleteElection(id));
            setDeleteDialog({ open: false, target: null });
            loadElections();
          }}
          title="Delete Election"
          message={`Are you sure you want to delete "${deleteDialog.target?.title}"? This will remove all associated results.`}
          confirmLabel="Delete"
          variant="danger"
        />

        <ConfirmDialog
          isOpen={activateDialog.open}
          onClose={() => setActivateDialog({ open: false, target: null })}
          onConfirm={async () => {
            const id = activateDialog.target?.id;
            const result = await dispatch(activateElection(id));
            if (result.meta.requestStatus === 'fulfilled') {
              toast.success('Election activated!');
            } else {
              toast.error(result.payload || 'Activation failed');
            }
            setActivateDialog({ open: false, target: null });
            loadElections();
          }}
          title="Activate Election"
          message={`Activate "${activateDialog.target?.title}"? Voters will be able to cast their votes immediately once active.`}
          confirmLabel="Go Live"
          variant="primary"
        />

        <ConfirmDialog
          isOpen={closeDialog.open}
          onClose={() => setCloseDialog({ open: false, target: null })}
          onConfirm={async () => {
            const id = closeDialog.target?.id;
            const result = await dispatch(closeElection(id));
            if (result.meta.requestStatus === 'fulfilled') {
              toast.success('Election closed');
            } else {
              toast.error(result.payload || 'Close failed');
            }
            setCloseDialog({ open: false, target: null });
            loadElections();
          }}
          title="Close Election"
          message={`Close "${closeDialog.target?.title}"? This will terminate the voting period and lock candidate shares.`}
          confirmLabel="Close Registration"
          variant="danger"
        />
      </div>
    </MainLayout>
  );
}
