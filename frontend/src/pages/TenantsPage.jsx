import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBan,
  FaCheckCircle,
  FaEye,
  FaUsers,
  FaVoteYea,
} from 'react-icons/fa';
import {
  fetchTenants,
  fetchTenantById,
  createTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  selectTenants,
  selectCurrentTenant,
  selectTenantTotal,
  selectTenantLoading,
  selectTenantActionLoading,
  selectTenantError,
  clearCurrentTenant,
  clearError,
} from '../store/slices/tenantSlice';
import MainLayout from '../components/layout/MainLayout';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format, parseISO } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeFormat(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getTenantId(tenant) {
  return tenant?._id || tenant?.id || '';
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES = {
  starter: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  professional: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
  enterprise: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
};

function PlanBadge({ plan }) {
  if (!plan) return <span className="text-gray-400 text-xs">—</span>;
  const key = plan.toLowerCase();
  const style = PLAN_STYLES[key] ?? PLAN_STYLES.starter;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}>
      {plan}
    </span>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled, required }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

// ─── Create / Edit Modal Form ─────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  slug: '',
  contact_email: '',
  plan: 'starter',
  logo_url: '',
  primary_color: '#4f46e5',
  admin_name: '',
  admin_email: '',
  admin_password: '',
};

function TenantFormModal({ isOpen, onClose, editTenant, onSave, actionLoading }) {
  const isEdit = !!editTenant;
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setForm({
        name: editTenant.name || '',
        slug: editTenant.slug || '',
        contact_email: editTenant.contact_email || editTenant.email || '',
        plan: editTenant.plan || 'starter',
        logo_url: editTenant.logo_url || '',
        primary_color: editTenant.primary_color || '#4f46e5',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      });
      setSlugManual(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugManual(false);
    }
  }, [isOpen, editTenant, isEdit]);

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'name' && !slugManual) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const handleSlugChange = (e) => {
    setSlugManual(true);
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      contact_email: form.contact_email.trim(),
      plan: form.plan,
      logo_url: form.logo_url.trim() || undefined,
      primary_color: form.primary_color,
    };
    if (!isEdit) {
      payload.admin = {
        full_name: form.admin_name.trim(),
        email: form.admin_email.trim(),
        password: form.admin_password,
      };
    }
    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Tenant' : 'Create New Tenant'} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Organization Name" required>
            <Input value={form.name} onChange={set('name')} placeholder="Acme Corp" required />
          </Field>
          <Field label="Slug" required hint="Auto-generated from name. Used in URLs.">
            <Input
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="acme-corp"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Email" required>
            <Input
              type="email"
              value={form.contact_email}
              onChange={set('contact_email')}
              placeholder="admin@acme.com"
              required
            />
          </Field>
          <Field label="Plan">
            <select
              value={form.plan}
              onChange={set('plan')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Logo URL" hint="Optional. Must be a valid image URL.">
            <Input
              type="url"
              value={form.logo_url}
              onChange={set('logo_url')}
              placeholder="https://example.com/logo.png"
            />
          </Field>
          <Field label="Primary Color" hint="Hex color for the tenant brand.">
            <div className="flex gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={set('primary_color')}
                className="h-[38px] w-12 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={form.primary_color}
                onChange={set('primary_color')}
                placeholder="#4f46e5"
              />
            </div>
          </Field>
        </div>

        {/* Admin Account section — only for create */}
        {!isEdit && (
          <>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Admin Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Admin Full Name" required>
                  <Input
                    value={form.admin_name}
                    onChange={set('admin_name')}
                    placeholder="Jane Smith"
                    required
                  />
                </Field>
                <Field label="Admin Email" required>
                  <Input
                    type="email"
                    value={form.admin_email}
                    onChange={set('admin_email')}
                    placeholder="jane@acme.com"
                    required
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Admin Password" required>
                  <Input
                    type="password"
                    value={form.admin_password}
                    onChange={set('admin_password')}
                    placeholder="Min. 8 characters"
                    required
                  />
                </Field>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {actionLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isEdit ? 'Save Changes' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Suspend Modal ────────────────────────────────────────────────────────────

function SuspendModal({ isOpen, onClose, tenant, onConfirm, actionLoading }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Suspend Tenant" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          You are about to suspend{' '}
          <span className="font-semibold text-gray-800">{tenant?.name}</span>. This will prevent
          all users of this tenant from accessing the platform.
        </p>
        <Field label="Suspension Reason" hint="This may be shown to the tenant admin.">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Describe the reason for suspension..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {actionLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <FaBan className="text-xs" />
            Suspend Tenant
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Tenant Detail Modal ──────────────────────────────────────────────────────

function TenantDetailModal({ isOpen, onClose, tenant }) {
  if (!tenant) return null;

  const id = getTenantId(tenant);

  const detailRows = [
    { label: 'Organization Name', value: tenant.name },
    { label: 'Slug', value: tenant.slug, mono: true },
    { label: 'Contact Email', value: tenant.contact_email || tenant.email },
    { label: 'Plan', value: <PlanBadge plan={tenant.plan} /> },
    { label: 'Status', value: <Badge status={tenant.status} /> },
    { label: 'Primary Color', value: tenant.primary_color || '#4f46e5' },
    { label: 'Max Elections', value: tenant.max_elections ?? '—' },
    { label: 'Max Voters', value: tenant.max_voters ?? '—' },
    { label: 'Created', value: safeFormat(tenant.created_at || tenant.createdAt) },
    { label: 'Updated', value: safeFormat(tenant.updated_at || tenant.updatedAt) },
  ];

  const usageStats = [
    {
      label: 'Users',
      value: tenant.user_count ?? tenant.users ?? 0,
      icon: FaUsers,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Elections',
      value: tenant.election_count ?? tenant.elections ?? 0,
      icon: FaVoteYea,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Active Elections',
      value: tenant.active_elections ?? 0,
      icon: FaCheckCircle,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total Votes',
      value: tenant.total_votes ?? 0,
      icon: FaBuilding,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Details" size="2xl">
      <div className="space-y-6">
        {/* Logo + Name header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: tenant.primary_color || '#4f46e5' }}
            >
              {tenant.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{tenant.slug}</p>
          </div>
        </div>

        {/* Usage Stats */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Usage Statistics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {usageStats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                  <Icon className="text-sm" />
                </div>
                <p className="text-xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 text-center mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detail rows */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tenant Information
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {detailRows.map(({ label, value, mono }) => (
              <div key={label} className="flex flex-col">
                <dt className="text-xs text-gray-500 font-medium">{label}</dt>
                <dd
                  className={`mt-0.5 text-sm text-gray-800 ${
                    mono ? 'font-mono bg-gray-100 px-2 py-0.5 rounded w-fit' : 'font-medium'
                  }`}
                >
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Suspension reason if suspended */}
        {tenant.status === 'suspended' && tenant.suspension_reason && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
              Suspension Reason
            </p>
            <p className="text-sm text-red-700">{tenant.suspension_reason}</p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onClose, tenant, onConfirm, actionLoading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Tenant" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-gray-800">{tenant?.name}</span>? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {actionLoading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export default function TenantsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const tenants = useSelector(selectTenants);
  const currentTenant = useSelector(selectCurrentTenant);
  const total = useSelector(selectTenantTotal);
  const loading = useSelector(selectTenantLoading);
  const actionLoading = useSelector(selectTenantActionLoading);
  const error = useSelector(selectTenantError);

  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  // Fetch tenants on mount and filter change
  useEffect(() => {
    const params = { page, per_page: 20 };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchTenants(params));
  }, [dispatch, page, statusFilter]);

  // Handle ?view= and ?action= search params from SuperAdminDashboard links
  useEffect(() => {
    const viewId = searchParams.get('view');
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (viewId) {
      const found = tenants.find((t) => getTenantId(t) === viewId);
      if (found) {
        setViewTarget(found);
        setSearchParams({}, { replace: true });
      }
    }

    if (action === 'toggle' && id) {
      const found = tenants.find((t) => getTenantId(t) === id);
      if (found) {
        if (found.status === 'suspended') {
          handleActivate(found);
        } else {
          setSuspendTarget(found);
        }
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, tenants]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearCurrentTenant());
    };
  }, [dispatch]);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ─── Action Handlers ─────────────────────────────────────────────────────

  const handleCreate = async (data) => {
    const result = await dispatch(createTenant(data));
    if (createTenant.fulfilled.match(result)) {
      toast.success('Tenant created successfully!');
      setCreateOpen(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editTenant) return;
    const id = getTenantId(editTenant);
    const result = await dispatch(updateTenant({ id, data }));
    if (updateTenant.fulfilled.match(result)) {
      toast.success('Tenant updated successfully!');
      setEditTenant(null);
    }
  };

  const handleSuspend = async (reason) => {
    if (!suspendTarget) return;
    const id = getTenantId(suspendTarget);
    const result = await dispatch(suspendTenant({ id, reason }));
    if (suspendTenant.fulfilled.match(result)) {
      toast.success(`${suspendTarget.name} has been suspended.`);
      setSuspendTarget(null);
    }
  };

  const handleActivate = useCallback(
    async (tenant) => {
      const id = getTenantId(tenant);
      const result = await dispatch(activateTenant(id));
      if (activateTenant.fulfilled.match(result)) {
        toast.success(`${tenant.name} has been activated.`);
      }
    },
    [dispatch]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = getTenantId(deleteTarget);
    const result = await dispatch(deleteTenant(id));
    if (deleteTenant.fulfilled.match(result)) {
      toast.success(`${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
    }
  };

  const handleViewDetails = async (tenant) => {
    setViewTarget(tenant);
    // Optionally fetch full details
    const id = getTenantId(tenant);
    dispatch(fetchTenantById(id));
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} tenant{total !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FaPlus className="text-xs" />
            Add Tenant
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading && tenants.length === 0 ? (
            <LoadingSpinner message="Loading tenants..." />
          ) : tenants.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FaBuilding className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tenants found</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter ? 'Try a different status filter.' : 'Create your first tenant to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      'Organization',
                      'Plan',
                      'Status',
                      'Limits',
                      'Created',
                      'Actions',
                    ].map((col) => (
                      <th
                        key={col}
                        className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                          col === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tenants.map((tenant) => {
                    const id = getTenantId(tenant);
                    const isSuspended = tenant.status === 'suspended';

                    return (
                      <tr key={id} className="hover:bg-gray-50 transition-colors group">
                        {/* Organization */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {tenant.logo_url ? (
                              <img
                                src={tenant.logo_url}
                                alt={tenant.name}
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                style={{ backgroundColor: tenant.primary_color || '#4f46e5' }}
                              >
                                {tenant.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800 leading-tight">{tenant.name}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{tenant.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-5 py-4">
                          <PlanBadge plan={tenant.plan} />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <Badge status={tenant.status} />
                        </td>

                        {/* Limits */}
                        <td className="px-5 py-4">
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <FaVoteYea className="text-gray-400" />
                              <span>{tenant.max_elections ?? '∞'} elections</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaUsers className="text-gray-400" />
                              <span>{tenant.max_voters ?? '∞'} voters</span>
                            </div>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {safeFormat(tenant.created_at || tenant.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => handleViewDetails(tenant)}
                              title="View Details"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <FaEye className="text-sm" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setEditTenant(tenant)}
                              title="Edit"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            >
                              <FaEdit className="text-sm" />
                            </button>

                            {/* Suspend / Activate toggle */}
                            {isSuspended ? (
                              <button
                                onClick={() => handleActivate(tenant)}
                                disabled={actionLoading}
                                title="Activate"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50"
                              >
                                <FaCheckCircle className="text-sm" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setSuspendTarget(tenant)}
                                title="Suspend"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                              >
                                <FaBan className="text-sm" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(tenant)}
                              title="Delete"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Loading overlay during actions */}
        {loading && tenants.length > 0 && (
          <div className="flex justify-center py-2">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Refreshing...
            </span>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <TenantFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        editTenant={null}
        onSave={handleCreate}
        actionLoading={actionLoading}
      />

      {/* Edit Modal */}
      <TenantFormModal
        isOpen={!!editTenant}
        onClose={() => setEditTenant(null)}
        editTenant={editTenant}
        onSave={handleEdit}
        actionLoading={actionLoading}
      />

      {/* Suspend Modal */}
      <SuspendModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        tenant={suspendTarget}
        onConfirm={handleSuspend}
        actionLoading={actionLoading}
      />

      {/* Detail Modal */}
      <TenantDetailModal
        isOpen={!!viewTarget}
        onClose={() => {
          setViewTarget(null);
          dispatch(clearCurrentTenant());
        }}
        tenant={currentTenant || viewTarget}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        tenant={deleteTarget}
        onConfirm={handleDelete}
        actionLoading={actionLoading}
      />
    </MainLayout>
  );
}
