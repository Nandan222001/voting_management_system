import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaVoteYea,
  FaPlay,
  FaTimes,
  FaSearch,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  fetchElections,
  createElection,
  updateElection,
  deleteElection,
  activateElection,
  closeElection,
  selectElections,
  selectElectionTotal,
  selectElectionLoading,
  selectElectionActionLoading,
} from '../store/slices/electionSlice';
import { fetchTargets } from '../store/slices/targetSlice';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import FancySelect from '../components/common/FancySelect';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import MainLayout from '../components/layout/MainLayout';
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
  const total = useSelector(selectElectionTotal);
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

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (val, row) => (
        <button
          onClick={() => navigate(`/elections/${row._id || row.id}`)}
          className="text-indigo-700 font-semibold hover:underline text-left max-w-xs truncate block"
        >
          {val}
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'start_date',
      label: 'Election Date',
      render: (val, row) => safeFormat(val || row.startDate),
    },
    {
      key: 'target',
      label: 'Geographical Scope',
      render: (target) => target ? `${target.name} (${target.type})` : 'All regions',
    },
    {
      key: 'candidates_count',
      label: 'Candidates',
      render: (val, row) => (
        <span className="font-semibold text-gray-700">
          {val ?? row.candidatesCount ?? 0}
        </span>
      ),
    },
  ];

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

  // Filter rows that need an action button
  const dataWithAction = elections.map((e) => ({
    ...e,
    id: e._id || e.id,
    _actionLabel: getActionLabel(e),
  }));

  const totalPages = Math.ceil(total / LIMIT);

return (
  <MainLayout title="Elections">
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Elections</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} election{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <FaPlus className="text-xs" />
          Create Election
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search elections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={dataWithAction}
        loading={loading}
        onEdit={openEditModal}
        onDelete={(row) => setDeleteDialog({ open: true, target: row })}
        onAction={(row) => {
          if (row._actionLabel) handleRowAction(row);
        }}
        // actionLabel={null}
      />

      {/* Override action column with per-row labels by rendering actions externally */}
      {/* We use custom action rendering via DataTable's onAction + render */}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Election' : 'Create New Election'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Election Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. City Council Election 2026"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                formErrors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {formErrors.title && (
              <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of the election..."
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Election date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Election Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.election_date}
              onChange={(e) => setForm((p) => ({ ...p, election_date: e.target.value }))}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                formErrors.election_date ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {formErrors.election_date && (
              <p className="mt-1 text-xs text-red-600">{formErrors.election_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Geographical Scope (Target)
            </label>
            <FancySelect
              value={form.target_id}
              onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))}
              options={[{ value: '', label: '-- All Regions --' }, ...targets.map(t => ({ value: t.id, label: `${t.name} (${t.type})` }))]}
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {actionLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {editTarget ? 'Save Changes' : 'Create Election'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
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

      {/* Activate Confirm */}
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
        variant="indigo"
      />

      {/* Close Confirm */}
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
