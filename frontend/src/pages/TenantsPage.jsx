import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle2,
  Eye,
  Vote,
  Search,
  X,
  Building,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import {
  fetchTenants,
  fetchTenantById,
  fetchPlatformStats,
  createTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  selectTenants,
  selectCurrentTenant,
  selectTenantTotal,
  selectPlatformStats,
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
import Pagination from '../components/common/Pagination';
import { format, parseISO } from 'date-fns';
import ImageUpload from '../components/common/ImageUpload';
import ImageAvatar from '../components/common/ImageAvatar';
import Select from '../components/common/Select';

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

// ─── Field Component ──────────────────────────────────────────────────────────

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
      className={`block w-full px-3 py-2 border rounded-lg text-sm text-[#1066b1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
      }`}
      {...props}
    />
  );
}

// ─── Create / Edit Modal Form ─────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  slug: '',
  contact_email: '',
  contact_phone: '',
  status: 'draft',
  logo_file: null,
  logo_url: '',
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
        contact_phone: editTenant.contact_phone || '',
        status: editTenant.status || 'draft',
        logo_file: null,
        logo_url: editTenant.logo_url || '',
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
    if (!form.name.trim()) errs.name = 'Required.';
    if (!form.slug.trim()) errs.slug = 'Required.';
    if (!form.contact_email.trim()) errs.contact_email = 'Required.';
    if (!form.contact_phone.trim()) errs.contact_phone = 'Required.';
    if (!isEdit) {
      if (!form.admin_name.trim()) errs.admin_name = 'Required.';
      if (!form.admin_email.trim()) errs.admin_email = 'Required.';
      if (!form.admin_password) errs.admin_password = 'Required.';
      else if (form.admin_password.length < 8) errs.admin_password = 'Min. 8 chars.';
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

    let payload;
    if (form.logo_file) {
      payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('slug', form.slug.trim());
      payload.append('contact_email', form.contact_email.trim());
      payload.append('contact_phone', form.contact_phone.trim());
      payload.append('status', form.status);
      payload.append('logo', form.logo_file);
    } else {
      payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        status: form.status,
      };
    }

    if (!isEdit) {
      if (payload instanceof FormData) {
        payload.append('admin_full_name', form.admin_name.trim());
        payload.append('admin_email', form.admin_email.trim());
        payload.append('admin_password', form.admin_password);
      } else {
        payload.admin_full_name = form.admin_name.trim();
        payload.admin_email = form.admin_email.trim();
        payload.admin_password = form.admin_password;
      }
    }

    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Tenant' : 'Create New Tenant'} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        {!isEdit && (
          <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}>
            <input type="text" name="prevent_autofill_email" tabIndex="-1" autoComplete="username" />
            <input type="password" name="prevent_autofill_pass" tabIndex="-1" autoComplete="current-password" />
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Organization Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization Name" required error={errors.name}>
              <Input
                name="tenant_name_field"
                value={form.name}
                onChange={set('name')}
                placeholder="Acme Corp"
                autoComplete="off"
                required
                hasError={!!errors.name}
              />
            </Field>
            <Field label="Slug" required hint="Auto-generated from name." error={errors.slug}>
              <Input
                name="tenant_slug_field"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="acme-corp"
                autoComplete="off"
                required
                hasError={!!errors.slug}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Email" required error={errors.contact_email}>
              <Input
                type="email"
                name="tenant_contact_email_field"
                value={form.contact_email}
                onChange={set('contact_email')}
                placeholder="admin@acme.com"
                autoComplete="off"
                required
                hasError={!!errors.contact_email}
              />
            </Field>
            <Field label="Phone Number" required error={errors.contact_phone}>
              <Input
                type="tel"
                name="tenant_contact_phone_field"
                value={form.contact_phone}
                onChange={set('contact_phone')}
                placeholder="+91 XXXXX XXXXX"
                autoComplete="off"
                required
                hasError={!!errors.contact_phone}
              />
            </Field>
          </div>

          <Select
            label="Initial Status"
            value={form.status}
            onChange={set('status')}
            options={[
              { value: 'draft', label: 'Draft (Setup mode)' },
              { value: 'active', label: 'Active (Go-live)' },
              { value: 'suspended', label: 'Suspended (Access blocked)' },
            ]}
          />

          <Field label="Logo">
            <ImageUpload
              file={form.logo_file}
              existingUrl={form.logo_url}
              onFileChange={(file) => setForm((prev) => ({ ...prev, logo_file: file }))}
              id={`tenant-logo-input-${isEdit ? getTenantId(editTenant) : 'new'}`}
              helperText="Upload a PNG/JPEG logo file (optional) up to 2 MB"
            />
          </Field>
        </div>

        {!isEdit && (
          <div className="space-y-4 pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Root Administrator
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={errors.admin_name}>
                <Input
                  name="new_tenant_admin_fullname"
                  value={form.admin_name}
                  onChange={set('admin_name')}
                  placeholder="Jane Smith"
                  autoComplete="off"
                  hasError={!!errors.admin_name}
                />
              </Field>
              <Field label="Email Address" required error={errors.admin_email}>
                <Input
                  type="email"
                  name="new_tenant_admin_email_field"
                  value={form.admin_email}
                  onChange={set('admin_email')}
                  placeholder="jane@acme.com"
                  autoComplete="new-user-email"
                  hasError={!!errors.admin_email}
                />
              </Field>
            </div>
            <Field label="Password" required hint="Minimum 8 characters." error={errors.admin_password}>
              <Input
                type="password"
                name="new_tenant_admin_password_field"
                value={form.admin_password}
                onChange={set('admin_password')}
                placeholder="••••••••"
                autoComplete="new-password"
                hasError={!!errors.admin_password}
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#1A237E] rounded-lg hover:bg-[#0d1245] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-lg">
          <Ban className="text-orange-500 mt-0.5 flex-shrink-0 w-5 h-5" />
          <p className="text-sm font-medium text-orange-800">
            Suspending <span className="font-bold underline">{tenant?.name}</span> will block all access to the platform.
          </p>
        </div>
        <Field label="Suspension Reason" hint="Optional notice.">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Describe the reason for suspension..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#1066b1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-60"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Confirm Suspension'
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
    { label: 'URL Identifier', value: tenant.slug, mono: true },
    { label: 'Admin Email', value: tenant.contact_email || tenant.email },
    { label: 'Admin Phone', value: tenant.contact_phone },
    { label: 'Current Status', value: <Badge status={tenant.status} /> },
    { label: 'Created On', value: safeFormat(tenant.created_at || tenant.createdAt) },
  ];

  const stats = tenant.usage || {};
  const usageStats = [
    {
      label: 'Users',
      value: stats.user_count ?? tenant.user_count ?? 0,
      icon: Users,
      color: 'text-[#1A237E]',
      bg: 'bg-blue-50',
    },
    {
      label: 'Elections',
      value: stats.election_count ?? tenant.election_count ?? 0,
      icon: Vote,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Total Votes',
      value: stats.vote_count ?? stats.total_votes ?? tenant.total_votes ?? 0,
      icon: Building,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Overview" size="2xl">
      <div className="space-y-8">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <ImageAvatar
            src={tenant.logo_url}
            name={tenant.name}
            sizeClass="w-16 h-16"
            shapeClass="rounded-lg"
            imageClassName="border border-gray-200 shadow-sm"
            fallbackClassName="text-white text-3xl shadow-sm"
            style={{ backgroundColor: tenant.primary_color || '#000' }}
          />
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#1066b1] truncate">{tenant.name}</h3>
            <p className="text-sm text-gray-400 font-mono truncate">{tenant.slug}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge status={tenant.status} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Live Usage Metrics
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {usageStats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-5 rounded-lg border border-gray-100 bg-gray-50 flex flex-col items-center shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-white border border-gray-100 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Configuration Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {detailRows.map(({ label, value, mono }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>
                  {value || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close Overview
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
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg">
          <Trash2 className="text-red-500 mt-0.5 flex-shrink-0 w-5 h-5" />
          <p className="text-sm font-medium text-red-800">
            Are you sure you want to <span className="font-bold underline">permanently delete</span> {tenant?.name}? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center min-w-[120px]"
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const PER_PAGE = 20;

export default function TenantsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const tenants = useSelector(selectTenants);
  const currentTenant = useSelector(selectCurrentTenant);
  const platformStats = useSelector(selectPlatformStats);
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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleActivate = useCallback(
    async (tenant) => {
      const id = getTenantId(tenant);
      const result = await dispatch(activateTenant(id));
      if (activateTenant.fulfilled.match(result)) {
        toast.success('Tenant activated.');
        dispatch(fetchPlatformStats());
      }
    },
    [dispatch]
  );

  const handleCreate = async (data) => {
    const result = await dispatch(createTenant(data));
    if (createTenant.fulfilled.match(result)) {
      toast.success('Tenant created successfully!');
      setCreateOpen(false);
      dispatch(fetchPlatformStats());
    }
  };

  const handleEdit = async (data) => {
    if (!editTenant) return;
    const id = getTenantId(editTenant);
    const result = await dispatch(updateTenant({ id, data }));
    if (updateTenant.fulfilled.match(result)) {
      toast.success('Tenant updated successfully!');
      setEditTenant(null);
      dispatch(fetchPlatformStats());
    }
  };

  const handleSuspend = async (reason) => {
    if (!suspendTarget) return;
    const id = getTenantId(suspendTarget);
    const result = await dispatch(suspendTenant({ id, reason }));
    if (suspendTenant.fulfilled.match(result)) {
      toast.success('Tenant suspended.');
      setSuspendTarget(null);
      dispatch(fetchPlatformStats());
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = getTenantId(deleteTarget);
    const result = await dispatch(deleteTenant(id));
    if (deleteTenant.fulfilled.match(result)) {
      toast.success('Tenant deleted.');
      setDeleteTarget(null);
      dispatch(fetchPlatformStats());
    }
  };

  const handleViewDetails = (tenant) => {
    setViewTarget(tenant);
    dispatch(fetchTenantById(getTenantId(tenant)));
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
    setSearch('');
  };

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchPlatformStats());
  }, [dispatch]);

  useEffect(() => {
    const params = { page, per_page: PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchTenants(params));
  }, [dispatch, page, statusFilter]);

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
  }, [searchParams, tenants, handleActivate, setSearchParams]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearCurrentTenant());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

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

  const totalPages = Math.ceil(total / PER_PAGE);
  
  // Real platform-wide counts from platformStats
  const totalCount = platformStats?.total_tenants || 0;
  const activeCount = platformStats?.active_tenants || 0;
  const draftCount = platformStats?.draft_tenants || 0;
  const suspendedCount = platformStats?.suspended_tenants || 0;

  return (
    <MainLayout title="Tenant Management">
      <div className="w-full space-y-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Total Tenants */}
          <div className="relative overflow-hidden rounded-lg bg-[#1A237E] p-6 text-white shadow-lg">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#dde1ff]/80">Total Tenants</p>
              <h2 className="mt-1 text-3xl font-black">{totalCount.toLocaleString()}</h2>
              <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#c1c6ff]">
                <TrendingUp className="h-3 w-3" /> Combined reach
              </p>
            </div>
            <Building className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10" />
          </div>

          {/* Active Tenants */}
          <div className="rounded-lg border border-[#c4c6d0] bg-[#ebecf0] p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474e]/70">Active</p>
            <h3 className="mt-1 text-3xl font-bold text-[#2e7d32]">{activeCount.toLocaleString()}</h3>
            <span className="mt-3 inline-flex rounded bg-[#2e7d32]/10 px-2 py-0.5 text-[9px] font-bold text-[#2e7d32]">
              {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}% of platform
            </span>
          </div>

          {/* Draft Tenants */}
          <div className="rounded-lg border border-[#c4c6d0] bg-[#ebecf0] p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474e]/70">Draft</p>
            <h3 className="mt-1 text-3xl font-bold text-[#1A237E]">{draftCount.toLocaleString()}</h3>
            <span className="mt-3 inline-flex rounded bg-[#1A237E]/10 px-2 py-0.5 text-[9px] font-bold text-[#1A237E]">
              Setup in progress
            </span>
          </div>

          {/* Suspended Tenants */}
          <div className="rounded-lg border border-[#c4c6d0] bg-[#ebecf0] p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474e]/70">Suspended</p>
            <h3 className="mt-1 text-3xl font-bold text-[#d32f2f]">{suspendedCount.toLocaleString()}</h3>
            <span className="mt-3 inline-flex rounded bg-[#d32f2f]/10 px-2 py-0.5 text-[9px] font-bold text-[#d32f2f]">
              Access restricted
            </span>
          </div>
        </section>

        <section className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#74777f]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jurisdictional tenants..."
              className="w-full rounded-lg border-0 bg-[#e2e2e6] py-3 pl-10 pr-10 text-sm text-[#1a1c1e] focus:ring-2 focus:ring-[#1A237E]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#1A237E]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="flex items-center gap-1 rounded-lg bg-[#ebecf0] p-1">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusFilter(value)}
                  className={`rounded-lg px-4 py-2 text-xs font-black uppercase transition ${
                    statusFilter === value
                      ? 'bg-[#1A237E] text-white shadow-sm'
                      : 'text-[#44474e] hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A237E] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Add New Tenant
            </button>
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm">
          {loading && filteredTenants.length === 0 ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filteredTenants.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                <Building className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-700 font-semibold text-base">No tenants found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search
                  ? `No results for "${search}".`
                  : statusFilter
                  ? 'Try a different status filter.'
                  : 'Create your first tenant to get started.'}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#c4c6d0] bg-[#f4f3f7] text-xs font-black uppercase tracking-wider text-[#44474e]">
                    {['Tenant Identity', 'Region / Identifier', 'Contact Info', 'Status', 'Users', 'Created', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className={`px-3 py-4 sm:px-6 ${col === 'Actions' ? 'text-right' : ''}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6d0]">
                  {filteredTenants.map((tenant) => {
                    const id = getTenantId(tenant);
                    const isSuspended = tenant.status === 'suspended';
                    return (
                      <tr key={id} className="transition-colors hover:bg-[#fbfcff]">
                        <td className="px-3 py-5 sm:px-6">
                          <div className="flex items-center gap-3">
                            <ImageAvatar
                              src={tenant.logo_url}
                              name={tenant.name}
                              sizeClass="w-10 h-10"
                              shapeClass="rounded-lg"
                              imageClassName="border border-[#c4c6d0] shadow-sm"
                              fallbackClassName="text-white text-xs shadow-sm"
                              style={{ backgroundColor: tenant.primary_color || '#1A237E' }}
                            />
                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate font-bold text-[#1a1c1e]">
                                {tenant.name}
                              </p>
                              <p className="text-xs text-[#74777f]">ID: TEN-{String(id).padStart(4, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-5 sm:px-6">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#44474e]">
                            <MapPin className="h-4 w-4 text-[#74777f]" />
                            <span className="font-mono text-xs">{tenant.slug}</span>
                          </div>
                        </td>
                        <td className="px-3 py-5 sm:px-6">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-semibold text-gray-800">{tenant.contact_email || tenant.email || '—'}</p>
                            {tenant.contact_phone && (
                              <p className="text-xs text-gray-500 font-medium">{tenant.contact_phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-5 sm:px-6">
                          <Badge status={tenant.status} />
                        </td>
                        <td className="px-3 py-5 sm:px-6">
                          <div className="flex items-center gap-1.5 font-semibold text-[#44474e]">
                            <Users className="h-4 w-4 text-[#74777f]" />
                            {tenant.user_count ?? 0}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-xs text-[#74777f] sm:px-6">
                          {safeFormat(tenant.created_at || tenant.createdAt)}
                        </td>
                        <td className="px-3 py-5 text-right sm:px-6">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewDetails(tenant)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#74777f] transition hover:bg-[#e8eaf6] hover:text-[#1A237E]"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditTenant(tenant)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#74777f] transition hover:bg-[#fff8e1] hover:text-[#f9a825]"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            {isSuspended ? (
                              <button
                                onClick={() => handleActivate(tenant)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#74777f] transition hover:bg-[#2e7d32]/10 hover:text-[#2e7d32]"
                                title="Activate"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setSuspendTarget(tenant)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#74777f] transition hover:bg-[#f9a825]/10 hover:text-[#d84315]"
                                title="Suspend"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(tenant)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#74777f] transition hover:bg-[#ba1a1a]/10 hover:text-[#ba1a1a]"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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

          {totalPages > 1 && (
            <div className="border-t border-[#c4c6d0] bg-[#f4f3f7]">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
