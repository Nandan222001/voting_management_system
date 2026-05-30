import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
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

function StatPanel({ title, icon: Icon, children, action }) {
  return (
    <section className="flex flex-col justify-between rounded-xl border border-[#c3c6d6] bg-white p-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#191c1e]">{title}</h3>
          <Icon className="h-5 w-5 text-[#003d9b]" />
        </div>
        {children}
      </div>
      {action}
    </section>
  );
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
  selections: {
    state: '',
    district: [], 
    block: [],
    booth: []
  }
};

export default function ElectionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const elections = useSelector(selectElections);
  const loading = useSelector(selectElectionLoading);
  const actionLoading = useSelector(selectElectionActionLoading);
  const { targets } = useSelector(s => s.targets);

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
  }, [dispatch, page, statusFilter, debouncedSearch]);

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

    const result = await dispatch(createElection(payload));
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
      <div className="mx-auto w-full space-y-8">
        {/* Header Section */}
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#003d9b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Active Lifecycle
              </span>
              <span className="text-xs font-black uppercase tracking-[0.05em] text-[#434654]">
                ID: {featuredElection ? `EL-${featuredElection.id}` : 'EL-PENDING'}
              </span>
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-[#191c1e]">
              {featuredElection?.title || 'Elections Dashboard'}
            </h2>
            <p className="text-sm font-medium text-[#434654]">
              Monitor election lifecycle, candidate readiness, and jurisdictional scope.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-2 rounded-xl border border-[#003d9b] px-5 py-2.5 text-sm font-bold text-[#003d9b] transition hover:bg-[#dae2ff]/50"
            >
              <FileText className="h-4 w-4" />
              View Results
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#003d9b] px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-blue-900/10 transition hover:brightness-110 active:scale-95"
              type="button"
            >
              <Plus size={16} />
              Initialize Election
            </button>
          </div>
        </section>

        {/* Lifecycle Progression Section */}
        <section className="rounded-2xl border border-[#c3c6d6] bg-white p-6 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#191c1e]">Lifecycle Progression</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#434654] bg-gray-100 px-2 py-0.5 rounded">Updated: live</span>
          </div>
          <div className="relative overflow-x-auto pb-2">
            <div className="absolute left-0 top-5 z-0 h-1 w-full min-w-[680px] bg-[#e7e8ea] rounded-full" />
            <div className="absolute left-0 top-5 z-0 h-1 bg-[#003d9b] rounded-full transition-all duration-700" style={{ width: lifecycle.progress }} />
            <div className="relative z-10 grid min-w-[680px] grid-cols-4 gap-4">
              {[
                { label: 'Draft Setup', sub: `${draftCount} draft`, icon: FileText },
                { label: 'Activation', sub: lifecycle.current === 1 ? 'Current phase' : `${activeCount} active`, icon: PlayCircle },
                { label: 'Voting Phase', sub: activeCount ? 'In progress' : 'Awaiting activation', icon: Vote },
                { label: 'Results', sub: `${closedCount} closed`, icon: ShieldCheck },
              ].map(({ label, sub, icon: Icon }, index) => {
                const step = index + 1;
                const isComplete = lifecycle.current > step;
                const isCurrent = lifecycle.current === step;
                return (
                  <div key={label} className="flex flex-col items-center text-center group">
                    <div
                      className={`flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
                        isCurrent
                          ? 'h-12 w-12 border-4 border-white bg-[#003d9b] text-white ring-4 ring-[#dae2ff] scale-110'
                          : isComplete
                            ? 'h-10 w-10 bg-[#003d9b] text-white'
                            : 'h-10 w-10 bg-[#e7e8ea] text-[#434654] group-hover:bg-gray-200'
                      }`}
                    >
                      <Icon className={isCurrent ? 'h-5 w-5' : 'h-4 w-4'} />
                    </div>
                    <span className={`mt-4 text-xs font-black uppercase tracking-widest ${isComplete ? 'text-[#003d9b]' : isCurrent ? 'text-[#191c1e]' : 'text-[#434654]'}`}>
                      {label}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.05em] mt-1 ${isCurrent ? 'text-[#003d9b]' : 'text-[#a1a1a1]'}`}>
                      {sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Stats */}
          <div className="space-y-6 lg:col-span-4">
            <StatPanel
              title="Participation Status"
              icon={Users}
              action={
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="mt-6 w-full rounded-xl py-3 text-center text-xs font-black uppercase tracking-widest text-[#003d9b] bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  View voter registry
                </button>
              }
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Registered Elections</span>
                    <span className="text-[#191c1e]">{compactNumber(dataWithAction.length)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e7e8ea]">
                    <div className="h-full bg-[#003d9b] transition-all duration-1000" style={{ width: `${Math.min(100, dataWithAction.length * 10)}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#434654]">
                    {activeCount} active, {draftCount} draft
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Candidate Assignments</span>
                    <span className="text-[#191c1e]">{compactNumber(totalCandidates)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e7e8ea]">
                    <div className="h-full bg-[#056e00] transition-all duration-1000" style={{ width: `${Math.min(100, totalCandidates * 8)}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.05em] text-[#434654]">
                    Verified across active rosters
                  </p>
                </div>
              </div>
            </StatPanel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: 'Winner Declared', value: winnerCount, icon: Trophy },
                { label: 'Audit Trail', value: `${dataWithAction.length} records`, icon: ShieldCheck },
                { label: 'Server Sync', value: 'Healthy', icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#c3c6d6] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#003d9b]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-[#191c1e]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Registry List */}
          <section className="space-y-4 lg:col-span-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h3 className="text-lg font-black text-[#191c1e]">Election Registry ({dataWithAction.length})</h3>
                <p className="text-sm text-[#434654] font-medium">Manage jurisdictional lifecycle and results access.</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg p-2 text-[#434654] transition hover:bg-[#e7e8ea]" type="button" aria-label="Filter elections">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-[#434654] transition hover:bg-[#e7e8ea]" type="button" aria-label="Sort elections">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-[#c3c6d6] bg-[#f4f3f7] p-5 md:flex-row">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#003d9b] transition-colors" />
                <input
                  type="text"
                  placeholder="Search elections by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm font-bold focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#dae2ff] transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 bg-white/50 p-1 rounded-xl border border-white">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                      statusFilter === value
                        ? 'bg-[#003d9b] text-white shadow-md'
                        : 'text-gray-500 hover:bg-white hover:text-[#003d9b]'
                    }`}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-[#c3c6d6] bg-white">
                  <LoadingSpinner />
                </div>
              ) : dataWithAction.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
                  <Vote className="mx-auto mb-4 h-16 w-16 text-gray-200" />
                  <p className="text-base font-bold text-slate-400 uppercase tracking-widest">No matching elections</p>
                  <p className="mt-1 text-sm text-gray-400">Refine your search or initialize a new one.</p>
                </div>
              ) : (
                dataWithAction.map((election) => {
                  const electionId = election._id || election.id;
                  const candidateCount = getCandidateCount(election);
                  return (
                    <article
                      key={electionId}
                      className="rounded-2xl border border-[#c3c6d6] bg-white p-5 transition-all hover:shadow-xl hover:border-[#003d9b]/30 group"
                    >
                      <div className="flex flex-col gap-6 md:flex-row md:items-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/elections/${electionId}`)}
                          className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-[#003d9b] group-hover:bg-blue-50 transition-colors"
                        >
                          {election.status?.toLowerCase() === 'active' ? <CircleDot className="h-8 w-8 animate-pulse" /> : <CalendarDays className="h-8 w-8" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/elections/${electionId}`)}
                              className="truncate text-left text-lg font-black text-[#191c1e] hover:text-[#003d9b] transition-colors"
                            >
                              {election.title}
                            </button>
                            <Badge status={election.status} />
                          </div>
                          <p className="line-clamp-1 text-sm text-[#74777f] font-medium italic mb-3">
                            {election.description || 'No description provided.'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span className="inline-flex items-center gap-1.5 py-1 px-2 bg-gray-50 rounded-lg">
                              <CalendarDays className="h-3 w-3" />
                              {safeFormat(election.start_date || election.startDate)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 py-1 px-2 bg-gray-50 rounded-lg">
                              <MapPinned className="h-3 w-3" />
                              {getScopeLabel(election.target, election.targets)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 py-1 px-2 bg-emerald-50 text-emerald-700 rounded-lg">
                              <Users className="h-3 w-3" />
                              {candidateCount} Candidates
                            </span>
                          </div>
                          <div className="mt-4">
                            {election.winner_declared && election.winner ? (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-1.5 shadow-sm">
                                <Trophy className="h-4 w-4 text-amber-600" />
                                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                                  Winner: {election.winner.candidate_name}
                                </span>
                              </div>
                            ) : election.is_tie ? (
                              <div className="inline-flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-3 py-1.5">
                                <span className="text-xs font-black uppercase tracking-wider text-orange-900">Result: Tie</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                <Clock3 className="h-3 w-3" />
                                Awaiting Results
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[210px]">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/elections/${electionId}`)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#003d9b]/30 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#003d9b] transition hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/results?election=${electionId}`)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#003d9b] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:brightness-110 shadow-lg shadow-blue-900/10"
                            >
                              <BarChart className="h-3.5 w-3.5" />
                              Results
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {election._actionLabel ? (
                              <button
                                type="button"
                                onClick={() => handleRowAction(election)}
                                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                                  election._actionLabel === 'Activate' 
                                    ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50' 
                                    : 'border-red-100 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {election._actionLabel === 'Activate' ? <PlayCircle className="h-4 w-4" /> : <StopCircle className="h-4 w-4" />}
                                {election._actionLabel}
                              </button>
                            ) : (
                              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Completed
                              </span>
                            )}
                            <ActionDropdown
                              align="right"
                              actions={[
                                {
                                  key: 'delete',
                                  label: 'Remove',
                                  icon: Trash2,
                                  danger: true,
                                  onClick: () => setDeleteDialog({ open: true, target: election }),
                                },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="rounded-2xl border border-gray-200 bg-[#f4f3f7] py-2 mt-6">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </section>
        </div>

        {/* Modal: Create Election */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Initialize Internal Party Election"
          size="3xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-0" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-12">
               {/* Left: Info & Schedule */}
               <div className="md:col-span-6 p-6 space-y-6 bg-gray-50/50 rounded-tl-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-4 bg-[#003d9b] rounded-full" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#003d9b]">Identification</span>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Election Name</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. District Council 2026"
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1066b1] focus:ring-2 focus:ring-[#003d9b]/10 outline-none shadow-sm transition-all"
                      />
                    </div>

                    <Select
                       label="Election Type"
                       value={form.election_type}
                       options={ELECTION_TYPE_OPTIONS}
                       disabled
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                     <div className="flex items-center gap-2">
                        <Clock3 size={14} className="text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Key Schedule</span>
                     </div>
                     <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Nomination Start</label>
                          <input type="date" value={form.nomination_start_date} onChange={e => setForm(f => ({ ...f, nomination_start_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-[#1066b1] outline-none shadow-sm" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Nomination End</label>
                          <input type="date" value={form.nomination_end_date} onChange={e => setForm(f => ({ ...f, nomination_end_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-[#1066b1] outline-none shadow-sm" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Voting Start</label>
                          <input type="date" value={form.voting_start_date} onChange={e => setForm(f => ({ ...f, voting_start_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-[#1066b1] outline-none shadow-sm" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Voting End</label>
                          <input type="date" value={form.voting_end_date} onChange={e => setForm(f => ({ ...f, voting_end_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-[#1066b1] outline-none shadow-sm" required />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right: Jurisdiction */}
               <div className="md:col-span-6 p-6 space-y-6 border-l border-gray-100 bg-white rounded-tr-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-4 bg-[#003d9b] rounded-full" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-[#003d9b]">Jurisdiction & Eligibility</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                      {JURISDICTION_TYPES.map(j => (
                        <button
                          key={j.value}
                          type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, jurisdiction_type: j.value, selections: { state: '', district: [], block: [], booth: [] } }))
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all ${
                            form.jurisdiction_type === j.value 
                              ? 'bg-[#003d9b] text-white font-bold shadow-md' 
                              : 'text-gray-500 hover:bg-white hover:text-[#003d9b]'
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider">{j.label}</span>
                          {form.jurisdiction_type === j.value ? <Check size={12} /> : <ChevronRight size={8} className="opacity-20" />}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 pt-1 border-t border-gray-50 mt-1">
                      {form.jurisdiction_type === 'country' ? (
                        <div className="py-12 text-center space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in zoom-in-95">
                           <Globe className="text-[#003d9b] w-8 h-8 mx-auto animate-pulse" />
                           <p className="text-[10px] font-black uppercase text-[#003d9b] tracking-widest">National Level (India)</p>
                           <p className="text-[9px] text-blue-400 font-medium">All registered party members eligible</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeConfig && activeConfig.levels.includes('state') && (
                            <SearchableSelect
                              label="Pradesh / State"
                              options={targets.filter(t => t.type === 'state')}
                              value={form.selections.state}
                              onChange={v => handleLevelChange('state', v)}
                              placeholder="Search State..."
                            />
                          )}

                          {activeConfig && activeConfig.levels.includes('district') && form.selections.state && (
                            <MultiSearchableSelect
                              label="District(s)"
                              options={targets.filter(t => t.type === 'district' && t.parent_id === form.selections.state)}
                              value={form.selections.district}
                              onChange={v => handleLevelChange('district', v)}
                              placeholder="Select Districts..."
                            />
                          )}

                          {activeConfig && activeConfig.levels.includes('block') && form.selections.district.length > 0 && (
                            <MultiSearchableSelect
                              label="Block(s)"
                              options={targets.filter(t => t.type === 'block' && form.selections.district.includes(t.parent_id))}
                              value={form.selections.block}
                              onChange={v => handleLevelChange('block', v)}
                              placeholder="Select Blocks..."
                            />
                          )}

                          {activeConfig && activeConfig.levels.includes('booth') && form.selections.block.length > 0 && (
                            <MultiSearchableSelect
                              label="Booth(s)"
                              options={targets.filter(t => t.type === 'booth' && form.selections.block.includes(t.parent_id))}
                              value={form.selections.booth}
                              onChange={v => handleLevelChange('booth', v)}
                              placeholder="Select Booths..."
                            />
                          )}

                          {activeConfig && activeConfig.levels.length > 0 && !form.selections[activeConfig.levels[activeConfig.levels.length - 1]]?.length && !form.selections[activeConfig.levels[activeConfig.levels.length - 1]] && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
                               <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                               <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">Please complete the hierarchy selection.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
              <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700 transition-colors">Discard</button>
              <button 
                type="submit" 
                disabled={actionLoading} 
                className="px-12 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#003d9b] rounded-xl hover:brightness-110 shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Initializing...' : 'Initialize Election'}
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
