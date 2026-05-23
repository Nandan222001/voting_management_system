import { useEffect, useState, useCallback, useMemo } from 'react';
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
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
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
  return tenant?._id ?? tenant?.id ?? '';
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

function Field({ label, required, children, hint, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled, required, hasError }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`block w-full px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
      }`}
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSlugChange = (e) => {
    setSlugManual(true);
    setForm((prev) => ({ ...prev, slug: e.target.value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Organization name is required.';
    if (!form.slug.trim()) errs.slug = 'Slug is required.';
    if (!form.contact_email.trim()) errs.contact_email = 'Contact email is required.';
    if (!isEdit) {
      if (!form.admin_name.trim()) errs.admin_name = 'Admin name is required.';
      if (!form.admin_email.trim()) errs.admin_email = 'Admin email is required.';
      if (!form.admin_password) errs.admin_password = 'Password is required.';
      else if (form.admin_password.length < 8) errs.admin_password = 'Password must be at least 8 characters.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      contact_email: form.contact_email.trim(),
      plan: form.plan,
      logo_url: form.logo_url.trim() || undefined,
      primary_color: form.primary_color,
    };

    if (!isEdit) {
      // Flat admin fields matching backend TenantCreate schema
      payload.admin_full_name = form.admin_name.trim();
      payload.admin_email = form.admin_email.trim();
      payload.admin_password = form.admin_password;
    }

    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Tenant' : 'Create New Tenant'} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tenant Details Section */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Tenant Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization Name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={set('name')}
                placeholder="Acme Corp"
                required
                hasError={!!errors.name}
              />
            </Field>
            <Field label="Slug" required hint="Auto-generated from name. Used in URLs." error={errors.slug}>
              <Input
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="acme-corp"
                required
                hasError={!!errors.slug}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Contact Email" required error={errors.contact_email}>
              <Input
                type="email"
                value={form.contact_email}
                onChange={set('contact_email')}
                placeholder="admin@acme.com"
                required
                hasError={!!errors.contact_email}
              />
            </Field>
            <Field label="Plan">
              <select
                value={form.plan}
                onChange={set('plan')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="starter">Starter — 5 elections, 1,000 voters</option>
                <option value="professional">Professional — 25 elections, 10,000 voters</option>
                <option value="enterprise">Enterprise — Unlimited</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Logo URL" hint="Optional. Must be a valid image URL.">
              <Input
                type="url"
                value={form.logo_url}
                onChange={set('logo_url')}
                placeholder="https://example.com/logo.png"
              />
            </Field>
            <Field label="Brand Color" hint="Hex color for the tenant brand.">
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={set('primary_color')}
                  className="h-[38px] w-12 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <Input
                  value={form.primary_color}
                  onChange={set('primary_color')}
                  placeholder="#4f46e5"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Admin Account section — only for create */}
        {!isEdit && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Admin Account
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.admin_name}>
                <Input
                  value={form.admin_name}
                  onChange={set('admin_name')}
                  placeholder="Jane Smith"
                  hasError={!!errors.admin_name}
                />
              </Field>
              <Field label="Email Address" required error={errors.admin_email}>
                <Input
                  type="email"
                  value={form.admin_email}
                  onChange={set('admin_email')}
                  placeholder="jane@acme.com"
                  hasError={!!errors.admin_email}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Password" required hint="Minimum 8 characters." error={errors.admin_password}>
                <Input
                  type="password"
                  value={form.admin_password}
                  onChange={set('admin_password')}
                  placeholder="Min. 8 characters"
                  hasError={!!errors.admin_password}
                />
              </Field>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isEdit ? 'Save Changes' : 'Create Tenant'
            )}
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
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
          <FaBan className="text-orange-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-orange-800">
            Suspending <span className="font-semibold">{tenant?.name}</span> will block all users
            of this organisation from accessing the platform.
          </p>
        </div>
        <Field label="Suspension Reason" hint="Optional. May be shown to the tenant admin.">
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
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[130px] justify-center"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FaBan className="text-xs" />
                Suspend Tenant
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Tenant Detail Modal ──────────────────────────────────────────────────────

function TenantDetailModal({ isOpen, onClose, tenant }) {
  if (!tenant) return null;

  const detailRows = [
    { label: 'Organization Name', value: tenant.name },
    { label: 'Slug', value: tenant.slug, mono: true },
    { label: 'Contact Email', value: tenant.contact_email || tenant.email },
    { label: 'Domain', value: tenant.domain },
    { label: 'Plan', value: <PlanBadge plan={tenant.plan} /> },
    { label: 'Status', value: <Badge status={tenant.status} /> },
    { label: 'Brand Color', value: tenant.primary_color || '#4f46e5' },
    { label: 'Max Elections', value: tenant.max_elections != null ? tenant.max_elections.toLocaleString() : '—' },
    { label: 'Max Voters', value: tenant.max_voters != null ? tenant.max_voters.toLocaleString() : '—' },
    { label: 'Created', value: safeFormat(tenant.created_at || tenant.createdAt) },
    { label: 'Last Updated', value: safeFormat(tenant.updated_at || tenant.updatedAt) },
  ];

  const stats = tenant.usage || {};
  const usageStats = [
    {
      label: 'Users',
      value: stats.user_count ?? tenant.user_count ?? 0,
      icon: FaUsers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Elections',
      value: stats.election_count ?? tenant.election_count ?? 0,
      icon: FaVoteYea,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Active',
      value: stats.active_elections ?? tenant.active_elections ?? 0,
      icon: FaCheckCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Votes',
      value: stats.vote_count ?? stats.total_votes ?? tenant.total_votes ?? 0,
      icon: FaBuilding,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Details" size="2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm"
              style={{ backgroundColor: tenant.primary_color || '#4f46e5' }}
            >
              {tenant.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{tenant.name}</h3>
            <p className="text-sm text-gray-400 font-mono truncate">{tenant.slug}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge status={tenant.status} />
              <PlanBadge plan={tenant.plan} />
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Usage Statistics
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {usageStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${bg}`}>
                  <Icon className={`text-base ${color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 text-center mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detail rows */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Details
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {detailRows.map(({ label, value, mono }) => (
              <div key={label} className="flex flex-col">
                <dt className="text-xs text-gray-400 font-medium">{label}</dt>
                <dd
                  className={`mt-0.5 text-sm text-gray-800 ${
                    mono ? 'font-mono bg-gray-100 px-2 py-0.5 rounded text-xs w-fit' : 'font-medium'
                  }`}
                >
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>

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
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <FaTrash className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">
            This will permanently cancel{' '}
            <span className="font-semibold">{tenant?.name}</span>. All associated data will be
            deactivated. This cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[90px] justify-center"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({ label, count, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}>
      <span className="text-base font-bold">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <p className="text-xs text-gray-500">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of{' '}
        <span className="font-semibold text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:border hover:border-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FaChevronLeft className="text-xs" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:border hover:border-gray-200'
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:border hover:border-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FaChevronRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PER_PAGE = 20;

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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  // Fetch tenants when page or filter changes
  useEffect(() => {
    const params = { page, per_page: PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchTenants(params));
  }, [dispatch, page, statusFilter]);

  // Reset to page 1 when filter changes
  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
    setSearch('');
  };

  // Handle ?view= and ?action= links from SuperAdminDashboard
  useEffect(() => {
    const viewId = searchParams.get('view');
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (viewId) {
      const found = tenants.find((t) => String(getTenantId(t)) === viewId);
      if (found) {
        setViewTarget(found);
        setSearchParams({}, { replace: true });
      }
    }

    if (action === 'toggle' && id) {
      const found = tenants.find((t) => String(getTenantId(t)) === id);
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

  // Clear state on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearCurrentTenant());
    };
  }, [dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Client-side search filter on the current page
  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.contact_email?.toLowerCase().includes(q)
    );
  }, [tenants, search]);

  // Counts by status (from current full list — approximate)
  const statusCounts = useMemo(() => {
    const counts = { trial: 0, active: 0, suspended: 0, cancelled: 0 };
    tenants.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [tenants]);

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
      toast.success(`${suspendTarget.name} suspended.`);
      setSuspendTarget(null);
    }
  };

  const handleActivate = useCallback(
    async (tenant) => {
      const id = getTenantId(tenant);
      const result = await dispatch(activateTenant(id));
      if (activateTenant.fulfilled.match(result)) {
        toast.success(`${tenant.name} activated.`);
      }
    },
    [dispatch]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = getTenantId(deleteTarget);
    const result = await dispatch(deleteTenant(id));
    if (deleteTenant.fulfilled.match(result)) {
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    }
  };

  const handleViewDetails = (tenant) => {
    setViewTarget(tenant);
    dispatch(fetchTenantById(getTenantId(tenant)));
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} organisation{total !== 1 ? 's' : ''} on the platform
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex-shrink-0"
          >
            <FaPlus className="text-xs" />
            Add Tenant
          </button>
        </div>

        {/* ── Filters + Search ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusFilter(value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === value
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, slug or email…"
              className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {/* Quick counts */}
          <div className="flex items-center gap-2 ml-auto">
            <StatChip label="active" count={statusCounts.active} color="bg-green-50 text-green-700" />
            <StatChip label="trial" count={statusCounts.trial} color="bg-yellow-50 text-yellow-700" />
            {statusCounts.suspended > 0 && (
              <StatChip label="suspended" count={statusCounts.suspended} color="bg-red-50 text-red-700" />
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading && filteredTenants.length === 0 ? (
            <LoadingSpinner message="Loading tenants…" />
          ) : filteredTenants.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                <FaBuilding className="text-3xl text-gray-300" />
              </div>
              <p className="text-gray-700 font-semibold text-base">No tenants found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search
                  ? `No results for "${search}".`
                  : statusFilter
                  ? 'Try a different status filter.'
                  : 'Create your first tenant to get started.'}
              </p>
              {(search || statusFilter) && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter(''); }}
                  className="mt-4 text-sm text-indigo-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Organisation', 'Plan', 'Status', 'Users / Elections', 'Limits', 'Created', 'Actions'].map((col) => (
                        <th
                          key={col}
                          className={`px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 ${
                            col === 'Actions' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTenants.map((tenant) => {
                      const id = getTenantId(tenant);
                      const isSuspended = tenant.status === 'suspended';

                      return (
                        <tr key={id} className="hover:bg-indigo-50/30 transition-colors group">
                          {/* Organisation */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {tenant.logo_url ? (
                                <img
                                  src={tenant.logo_url}
                                  alt={tenant.name}
                                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-200"
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                                  style={{ backgroundColor: tenant.primary_color || '#4f46e5' }}
                                >
                                  {tenant.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 truncate max-w-[160px]">
                                  {tenant.name}
                                </p>
                                <p className="text-xs text-gray-400 font-mono truncate max-w-[160px]">
                                  {tenant.slug}
                                </p>
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

                          {/* Users / Elections */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                                <FaUsers className="opacity-70" />
                                {tenant.user_count ?? 0}
                              </span>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-1 text-green-600 font-semibold">
                                <FaVoteYea className="opacity-70" />
                                {tenant.election_count ?? 0}
                              </span>
                            </div>
                          </td>

                          {/* Limits */}
                          <td className="px-5 py-4">
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>{tenant.max_elections ?? '∞'} elections</div>
                              <div>{tenant.max_voters != null ? tenant.max_voters.toLocaleString() : '∞'} voters</div>
                            </div>
                          </td>

                          {/* Created */}
                          <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                            {safeFormat(tenant.created_at || tenant.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewDetails(tenant)}
                                title="View Details"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              >
                                <FaEye className="text-sm" />
                              </button>
                              <button
                                onClick={() => setEditTenant(tenant)}
                                title="Edit"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              {isSuspended ? (
                                <button
                                  onClick={() => handleActivate(tenant)}
                                  disabled={actionLoading}
                                  title="Activate"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-40"
                                >
                                  <FaCheckCircle className="text-sm" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSuspendTarget(tenant)}
                                  title="Suspend"
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                >
                                  <FaBan className="text-sm" />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteTarget(tenant)}
                                title="Delete"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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

              {/* Pagination */}
              <Pagination
                page={page}
                total={total}
                perPage={PER_PAGE}
                onPage={setPage}
              />
            </>
          )}

          {/* Refresh indicator */}
          {loading && filteredTenants.length > 0 && (
            <div className="px-5 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-indigo-600 font-medium">Refreshing…</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <TenantFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        editTenant={null}
        onSave={handleCreate}
        actionLoading={actionLoading}
      />

      <TenantFormModal
        isOpen={!!editTenant}
        onClose={() => setEditTenant(null)}
        editTenant={editTenant}
        onSave={handleEdit}
        actionLoading={actionLoading}
      />

      <SuspendModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        tenant={suspendTarget}
        onConfirm={handleSuspend}
        actionLoading={actionLoading}
      />

      <TenantDetailModal
        isOpen={!!viewTarget}
        onClose={() => {
          setViewTarget(null);
          dispatch(clearCurrentTenant());
        }}
        tenant={currentTenant || viewTarget}
      />

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
