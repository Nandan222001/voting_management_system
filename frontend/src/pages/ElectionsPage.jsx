import { useState, useEffect, useCallback } from 'react';
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
import { format, parseISO } from 'date-fns';

const LIMIT = 10;

const STATUS_FILTERS = [
  { value: '', label: 'All Elections' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
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

function getScopeLabel(target) {
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
  election_date: '',
  target_id: '',
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

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (election) => {
    setEditTarget(election);
    setForm({
      title: election.title || '',
      description: election.description || '',
      election_date: (election.start_date || election.startDate)?.substring(0, 10) || '',
      target_id: election.target_id || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.election_date) errs.election_date = 'Election date is required';
    return errs;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      start_date: `${form.election_date}T00:00:00`,
      end_date: `${form.election_date}T23:59:59`,
      target_id: form.target_id ? parseInt(form.target_id) : null,
    };
    let result;
    if (editTarget) {
      const id = editTarget._id || editTarget.id;
      result = await dispatch(updateElection({ id, data: payload }));
    } else {
      result = await dispatch(createElection(payload));
    }
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editTarget ? 'Election updated!' : 'Election created!');
      setModalOpen(false);
    } else {
      toast.error(result.payload || 'Action failed');
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

  return (
    <MainLayout title="Election Monitoring">
      <div className="mx-auto w-full   space-y-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#003d9b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                Active Lifecycle
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">
                ID: {featuredElection ? `EL-${featuredElection.id}` : 'EL-PENDING'}
              </span>
            </div>
            <h2 className="text-3xl font-bold leading-10 tracking-tight text-[#191c1e]">
              {featuredElection?.title || 'Elections'}
            </h2>
            <p className="text-base text-[#434654]">
              Monitor election lifecycle, candidate readiness, and jurisdictional scope.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/results')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#003d9b] px-4 py-2 text-sm font-semibold text-[#003d9b] transition hover:bg-[#dae2ff]/50"
            >
              <FileText className="h-5 w-5" />
              View Results
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-[#003d9b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95"
              type="button"
            >
              <Plus size={18} />
              Create Election
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[#c3c6d6] bg-white p-6">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#191c1e]">Lifecycle Progression</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">Updated: live</span>
          </div>
          <div className="relative overflow-x-auto pb-2">
            <div className="absolute left-0 top-5 z-0 h-1 w-full min-w-[680px] bg-[#e7e8ea]" />
            <div className="absolute left-0 top-5 z-0 h-1 bg-[#003d9b]" style={{ width: lifecycle.progress }} />
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
                  <div key={label} className="flex flex-col items-center text-center">
                    <div
                      className={`flex items-center justify-center rounded-full shadow-sm ${
                        isCurrent
                          ? 'h-12 w-12 border-4 border-white bg-[#003d9b] text-white ring-4 ring-[#dae2ff]'
                          : isComplete
                            ? 'h-10 w-10 bg-[#003d9b] text-white'
                            : 'h-10 w-10 bg-[#e7e8ea] text-[#434654]'
                      }`}
                    >
                      <Icon className={isCurrent ? 'h-5 w-5' : 'h-4 w-4'} />
                    </div>
                    <span className={`mt-3 text-sm font-bold ${isComplete ? 'text-[#003d9b]' : isCurrent ? 'text-[#191c1e]' : 'text-[#434654]'}`}>
                      {label}
                    </span>
                    <span className={`text-xs font-semibold uppercase tracking-[0.05em] ${isCurrent ? 'text-[#003d9b]' : 'text-[#434654]'}`}>
                      {sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <StatPanel
              title="Participation"
              icon={Users}
              action={
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className="mt-6 w-full rounded-lg py-2 text-center text-sm font-bold text-[#003d9b] transition hover:bg-[#dae2ff]"
                >
                  View voter registry
                </button>
              }
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Registered Elections</span>
                    <span className="font-bold">{compactNumber(dataWithAction.length)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e7e8ea]">
                    <div className="h-full bg-[#003d9b]" style={{ width: `${Math.min(100, dataWithAction.length * 10)}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">
                    {activeCount} active, {draftCount} draft
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Candidate Assignments</span>
                    <span className="font-bold">{compactNumber(totalCandidates)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e7e8ea]">
                    <div className="h-full bg-[#056e00]" style={{ width: `${Math.min(100, totalCandidates * 8)}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">
                    Verified through candidate records
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
                <div key={label} className="flex items-center gap-4 rounded-xl border border-[#c3c6d6] bg-[#e7e8ea] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e1e2e4] text-[#003d9b]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#434654]">{label}</p>
                    <p className="text-sm font-semibold text-[#191c1e]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section className="space-y-4 lg:col-span-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h3 className="text-lg font-semibold text-[#191c1e]">Election Registry ({dataWithAction.length})</h3>
                <p className="text-sm text-[#434654]">Current lifecycle state, candidates, scope, and results access.</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg p-2 text-[#434654] transition hover:bg-[#e7e8ea]" type="button" aria-label="Filter elections">
                  <Filter className="h-5 w-5" />
                </button>
                <button className="rounded-lg p-2 text-[#434654] transition hover:bg-[#e7e8ea]" type="button" aria-label="Sort elections">
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-[#c3c6d6] bg-[#e7e8ea] p-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#434654]" />
                <input
                  type="text"
                  placeholder="Search elections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#c3c6d6] bg-white py-2.5 pl-9 pr-4 text-sm text-[#191c1e] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#dae2ff]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      statusFilter === value
                        ? 'border-[#003d9b] bg-[#003d9b] text-white'
                        : 'border-[#c3c6d6] bg-white text-[#434654] hover:bg-[#f8f9fb]'
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
                <div className="flex h-64 items-center justify-center rounded-xl border border-[#c3c6d6] bg-white">
                  <LoadingSpinner />
                </div>
              ) : dataWithAction.length === 0 ? (
                <div className="rounded-xl border border-[#c3c6d6] bg-white p-12 text-center">
                  <Vote className="mx-auto mb-4 h-12 w-12 text-[#003d9b]/25" />
                  <p className="text-sm font-bold text-[#191c1e]">No elections found</p>
                  <p className="mt-1 text-sm text-[#434654]">This list is currently empty.</p>
                </div>
              ) : (
                dataWithAction.map((election) => {
                  const electionId = election._id || election.id;
                  const candidateCount = getCandidateCount(election);
                  return (
                    <article
                      key={electionId}
                      className="rounded-xl border border-[#c3c6d6] bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/elections/${electionId}`)}
                          className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-[#c3c6d6] bg-[#edeef0] text-[#003d9b]"
                          aria-label={`Open ${election.title}`}
                        >
                          {election.status?.toLowerCase() === 'active' ? <CircleDot className="h-8 w-8" /> : <CalendarDays className="h-8 w-8" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/elections/${electionId}`)}
                              className="truncate text-left text-lg font-semibold text-[#191c1e] hover:text-[#003d9b] hover:underline"
                            >
                              {election.title}
                            </button>
                            <Badge status={election.status} />
                          </div>
                          <p className="line-clamp-2 text-sm text-[#434654]">
                            {election.description || 'No description provided.'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {safeFormat(election.start_date || election.startDate)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPinned className="h-3.5 w-3.5" />
                              {getScopeLabel(election.target)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#056e00]">
                              <Users className="h-3.5 w-3.5" />
                              {candidateCount} candidates
                            </span>
                          </div>
                          <div className="mt-3">
                            {election.winner_declared && election.winner ? (
                              <span className="inline-flex items-center gap-1.5 rounded bg-[#ffdcc2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#2e1500]">
                                <Trophy className="h-3 w-3" />
                                {election.winner.candidate_name}
                              </span>
                            ) : election.is_tie ? (
                              <span className="inline-flex items-center gap-1.5 rounded bg-[#ffdcc2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#2e1500]">
                                Tie
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#434654]">
                                <Clock3 className="h-3.5 w-3.5" />
                                Winner not declared
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[210px]">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/elections/${electionId}`)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#003d9b] px-4 py-2 text-sm font-semibold text-[#003d9b] transition hover:bg-[#dae2ff]/50"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/results?election=${electionId}`)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#003d9b] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                            >
                              <BarChart className="h-4 w-4" />
                              Results
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {election._actionLabel ? (
                              <button
                                type="button"
                                onClick={() => handleRowAction(election)}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c6d6] px-4 py-2 text-sm font-semibold text-[#434654] transition hover:bg-[#e7e8ea]"
                              >
                                {election._actionLabel === 'Activate' ? <PlayCircle className="h-4 w-4" /> : <StopCircle className="h-4 w-4" />}
                                {election._actionLabel}
                              </button>
                            ) : (
                              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c6d6] px-4 py-2 text-sm font-semibold text-[#434654]">
                                <CheckCircle2 className="h-4 w-4" />
                                Finalized
                              </span>
                            )}
                            <ActionDropdown
                              align="right"
                              actions={[
                                {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: Edit3,
                                  onClick: () => openEditModal(election),
                                },
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
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {totalPages > 1 && (
          <div className="rounded-lg border border-[#c3c6d6] bg-white shadow-sm">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editTarget ? 'Edit Election' : 'Create New Election'}
          size="lg"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Election Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. City Council Election 2026"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A237E] focus:border-transparent ${
                  formErrors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of the election..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A237E] focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Area</label>
              <select
                value={form.target_id}
                onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A237E]"
              >
                <option value="">-- All Regions --</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Election Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.election_date}
                  onChange={(e) => setForm((p) => ({ ...p, election_date: e.target.value }))}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A237E] focus:border-transparent ${
                    formErrors.election_date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {formErrors.election_date && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.election_date}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1A237E] rounded-lg hover:bg-[#0d1245] disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {actionLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {editTarget ? 'Save Changes' : 'Create Election'}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, target: null })}
          onConfirm={async () => {
            const id = deleteDialog.target?._id || deleteDialog.target?.id;
            const result = await dispatch(deleteElection(id));
            if (result.meta.requestStatus === 'fulfilled') {
              toast.success('Election deleted');
            } else {
              toast.error(result.payload || 'Delete failed');
            }
            setDeleteDialog({ open: false, target: null });
          }}
          title="Delete Election"
          message={`Are you sure you want to delete "${deleteDialog.target?.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="red"
        />

        <ConfirmDialog
          isOpen={activateDialog.open}
          onClose={() => setActivateDialog({ open: false, target: null })}
          onConfirm={async () => {
            const id = activateDialog.target?._id || activateDialog.target?.id;
            const result = await dispatch(activateElection(id));
            if (result.meta.requestStatus === 'fulfilled') {
              toast.success('Election activated!');
            } else {
              toast.error(result.payload || 'Activation failed');
            }
            setActivateDialog({ open: false, target: null });
          }}
          title="Activate Election"
          message={`Activate "${activateDialog.target?.title}"? Voters will be able to cast their votes once active.`}
          confirmLabel="Activate"
          variant="primary"
        />

        <ConfirmDialog
          isOpen={closeDialog.open}
          onClose={() => setCloseDialog({ open: false, target: null })}
          onConfirm={async () => {
            const id = closeDialog.target?._id || closeDialog.target?.id;
            const result = await dispatch(closeElection(id));
            if (result.meta.requestStatus === 'fulfilled') {
              toast.success('Election closed');
            } else {
              toast.error(result.payload || 'Close failed');
            }
            setCloseDialog({ open: false, target: null });
          }}
          title="Close Election"
          message={`Close "${closeDialog.target?.title}"? No more votes can be cast after closing.`}
          confirmLabel="Close Election"
          variant="red"
        />
      </div>
    </MainLayout>
  );
}
