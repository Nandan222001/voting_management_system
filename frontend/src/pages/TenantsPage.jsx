import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
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
  Clock,
  Mail,
  Link,
  ShieldCheck,
} from 'lucide-react';
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
import FancySelect from '../components/common/FancySelect';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import TableActions from '../components/common/TableActions';
import { format, parseISO } from 'date-fns';
import ImageUpload from '../components/common/ImageUpload';
import ImageAvatar from '../components/common/ImageAvatar';

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
  starter: 'bg-gray-50 text-gray-600 border-gray-100',
  professional: 'bg-gray-100 text-gray-900 border-gray-200',
  enterprise: 'bg-gray-100 text-gray-900 border-gray-200',
};

function PlanBadge({ plan }) {
  if (!plan) return <span className="text-gray-400 text-xs">—</span>;
  const key = plan.toLowerCase();
  const style = PLAN_STYLES[key] ?? PLAN_STYLES.starter;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style}`}>
      {plan}
    </span>
  );
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

function Input({ value, onChange, placeholder, type = 'text', disabled, required, hasError, icon: Icon, ...props }) {
  return (
    <div className="relative group">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        {...props}
        className={`block w-full ${Icon ? 'pl-9' : 'px-4'} py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-black/10/10 focus:border-black disabled:bg-gray-100 disabled:text-gray-400 transition-all ${
          hasError ? 'border-red-600 bg-red-50 focus:ring-red-600/5' : 'border-gray-200'
        }`}
      />
    </div>
  );
}

// ─── Create / Edit Modal Form ─────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  slug: '',
  contact_email: '',
  plan: 'starter',
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
        plan: editTenant.plan || 'starter',
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
      payload.append('plan', form.plan);
      payload.append('logo', form.logo_file);
    } else {
      payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        contact_email: form.contact_email.trim(),
        plan: form.plan,
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
                icon={Building}
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
                icon={Link}
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
                icon={Mail}
                required
                hasError={!!errors.contact_email}
              />
            </Field>
            <Field label="Subscription Plan">
                <FancySelect
                  value={form.plan}
                  onChange={(e) => setForm((prev) => ({ ...prev, plan: e.target.value }))}
                  options={[
                    { value: 'starter', label: 'Starter — 5 elections' },
                    { value: 'professional', label: 'Professional — 25 elections' },
                    { value: 'enterprise', label: 'Enterprise — Unlimited' },
                  ]}
                />
            </Field>
          </div>

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
                  icon={Users}
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
                  icon={Mail}
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
                icon={ShieldCheck}
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
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0051D5] rounded-xl hover:bg-[#0051D5] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
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
            placeholder="Describe reason for suspension..."
            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-black/10/10 focus:border-black transition-all resize-none shadow-sm"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-60"
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
    { label: 'Subscription Plan', value: <PlanBadge plan={tenant.plan} /> },
    { label: 'Current Status', value: <Badge status={tenant.status} /> },
    { label: 'Created On', value: safeFormat(tenant.created_at || tenant.createdAt) },
  ];

  const stats = tenant.usage || {};
  const usageStats = [
    { label: 'Total Users', value: stats.user_count ?? tenant.user_count ?? 0, icon: Users, color: 'text-gray-900', bg: 'bg-gray-100' },
    { label: 'Elections', value: stats.election_count ?? tenant.election_count ?? 0, icon: Vote, color: 'text-gray-900', bg: 'bg-gray-100' },
    { label: 'Recent Votes', value: stats.vote_count ?? stats.total_votes ?? tenant.total_votes ?? 0, icon: Activity, color: 'text-[#0051D5]', bg: 'bg-[#e6edfb]' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Overview" size="2xl">
      <div className="space-y-8">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <ImageAvatar
            src={tenant.logo_url}
            name={tenant.name}
            sizeClass="w-16 h-16"
            shapeClass="rounded-2xl"
            imageClassName="border border-gray-200 shadow-sm"
            fallbackClassName="text-white text-3xl shadow-sm"
            style={{ backgroundColor: tenant.primary_color || '#000' }}
          />
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">{tenant.name}</h3>
            <p className="text-sm text-gray-400 font-mono font-medium truncate mt-0.5">{tenant.slug}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge status={tenant.status} />
              <PlanBadge plan={tenant.plan} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Live Usage Metrics
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {usageStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white border border-gray-100 shadow-sm`}>
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
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
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
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <Trash2 className="text-red-500 mt-0.5 flex-shrink-0 w-5 h-5" />
          <p className="text-sm font-medium text-red-800">
            Are you sure you want to <span className="font-bold underline">permanently delete</span> {tenant?.name}? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center min-w-[120px]"
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
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
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

  useEffect(() => {
    const params = { page, per_page: PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchTenants(params));
  }, [dispatch, page, statusFilter]);

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
    setSearch('');
  };

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
      toast.success('Tenant suspended.');
      setSuspendTarget(null);
    }
  };

  const handleActivate = useCallback(
    async (tenant) => {
      const id = getTenantId(tenant);
      const result = await dispatch(activateTenant(id));
      if (activateTenant.fulfilled.match(result)) {
        toast.success('Tenant activated.');
      }
    },
    [dispatch]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = getTenantId(deleteTarget);
    const result = await dispatch(deleteTenant(id));
    if (deleteTenant.fulfilled.match(result)) {
      toast.success('Tenant deleted.');
      setDeleteTarget(null);
    }
  };

  const handleViewDetails = (tenant) => {
    setViewTarget(tenant);
    dispatch(fetchTenantById(getTenantId(tenant)));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tenant Management</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {total} registered organization{total !== 1 ? 's' : ''} monitored live.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-6 py-2.5 bg-[#0051D5] text-white text-sm font-bold rounded-xl hover:bg-[#0051D5] active:scale-95 transition-all shadow-lg flex-shrink-0"
          >
            <Plus className="w-4 h-4 inline-block mr-2" />
            New Tenant
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 shadow-sm">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusFilter(value)}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === value
                    ? 'bg-white text-[#0051D5] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[300px] max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-[#0051D5] transition-colors" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, slug, email..."
              className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#0051D5]/10 focus:border-[#0051D5] bg-white transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading && filteredTenants.length === 0 ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filteredTenants.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <Building className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No tenants found</h3>
              <p className="text-sm font-medium text-gray-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {['Organisation', 'URL Identifier', 'Plan', 'Status', 'Users', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className={`px-3 py-3 sm:px-4 ${col === 'Actions' ? 'w-24 whitespace-nowrap text-right' : 'break-words'}`}
                        style={col === 'Actions' ? { width: '6rem' } : undefined}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTenants.map((tenant, index) => {
                    const id = getTenantId(tenant);
                    const isSuspended = tenant.status === 'suspended' || tenant.status === 'Suspended';
                    return (
                      <tr key={id} className="hover:bg-[#e6edfb]/50 transition-colors group">
                        <td className="px-3 py-3 align-top sm:px-4">
                          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            <ImageAvatar
                              src={tenant.logo_url}
                              name={tenant.name}
                              sizeClass="w-10 h-10"
                              shapeClass="rounded-xl"
                              imageClassName="border border-gray-200 shadow-sm"
                              fallbackClassName="text-white text-xs shadow-sm"
                              style={{ backgroundColor: tenant.primary_color || '#000' }}
                            />
                            <p className="min-w-0 break-words font-semibold text-gray-800">
                              {tenant.name}
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top text-gray-500 font-mono text-xs font-medium break-words sm:px-4">
                          {tenant.slug}
                        </td>

                        <td className="px-3 py-3 align-top sm:px-4">
                          <PlanBadge plan={tenant.plan} />
                        </td>

                        <td className="px-3 py-3 align-top sm:px-4">
                          <Badge status={tenant.status} />
                        </td>

                        <td className="px-3 py-3 align-top sm:px-4">
                          <div className="flex items-center gap-2">
                             <Users className="w-4 h-4 text-gray-300" />
                             <span className="font-bold text-gray-700">{tenant.user_count ?? 0}</span>
                          </div>
                        </td>

                        <td className="w-24 px-3 py-3 text-right align-top sm:px-4">
                          <TableActions
                            actions={[
                              { key: 'view', label: 'Overview', icon: Eye, onClick: () => handleViewDetails(tenant) },
                              { key: 'settings', label: 'Settings', icon: Edit, onClick: () => setEditTenant(tenant) },
                              isSuspended
                                ? { key: 'activate', label: 'Reactivate', icon: CheckCircle2, onClick: () => handleActivate(tenant) }
                                : { key: 'block', label: 'Suspend', icon: Ban, onClick: () => setSuspendTarget(tenant) },
                              { key: 'delete', label: 'Delete Forever', icon: Trash2, danger: true, onClick: () => setDeleteTarget(tenant) },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {total > PER_PAGE && (
             <div className="border-t border-gray-100 bg-gray-50/50">
                <Pagination
                  page={page}
                  totalPages={Math.ceil(total / PER_PAGE)}
                  onPageChange={setPage}
                />
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
