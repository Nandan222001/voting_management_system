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
  Calendar,
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
        {value}
      </div>
      <div className="mt-4 border-t border-gray-50 pt-4">
        {children}
      </div>
    </div>
  );
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
      className={`block w-full px-3 py-2 border rounded-lg text-sm text-[#1a337e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a337e] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
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
  razorpay_key_id: '',
  razorpay_key_secret: '',
};

function TenantFormModal({ isOpen, onClose, editTenant, onSave, actionLoading }) {
  const isEdit = !!editTenant;
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setImageError(null);
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
        razorpay_key_id: editTenant.razorpay_key_id || '',
        razorpay_key_secret: editTenant.razorpay_key_secret || '',
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
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 3) errs.name = 'Name must be at least 3 characters';
    
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(form.slug.trim())) errs.slug = 'Slug can only contain lowercase letters, numbers, and dashes';

    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) errs.contact_email = 'Invalid email format';
    
    if (form.contact_phone && !/^\+?[0-9\s-]{7,}$/.test(form.contact_phone)) errs.contact_phone = 'Invalid phone format';

    if (!isEdit) {
        if (!form.admin_name.trim()) errs.admin_name = 'Admin name is required';
        else if (form.admin_name.trim().length < 3) errs.admin_name = 'Admin name must be at least 3 characters';

        if (!form.admin_email.trim()) errs.admin_email = 'Admin email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) errs.admin_email = 'Invalid email format';

        if (!form.admin_password) errs.admin_password = 'Password is required';
        else if (form.admin_password.length < 8) errs.admin_password = 'Password must be at least 8 characters';
    }
    
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (imageError) {
      toast.error(imageError);
      return;
    }
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
      payload.append('razorpay_key_id', form.razorpay_key_id.trim());
      payload.append('razorpay_key_secret', form.razorpay_key_secret.trim());
    } else {
      payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        status: form.status,
        razorpay_key_id: form.razorpay_key_id.trim(),
        razorpay_key_secret: form.razorpay_key_secret.trim(),
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Modify Organizational Node' : 'Deploy New Tenant'} size="3xl">
      <form onSubmit={handleSubmit} className="space-y-0" autoComplete="off">
        {!isEdit && (
          <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}>
            <input type="text" name="prevent_autofill_email" tabIndex="-1" autoComplete="username" />
            <input type="password" name="prevent_autofill_pass" tabIndex="-1" autoComplete="current-password" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Organization Details */}
          <div className="md:col-span-7 p-8 space-y-6 bg-gray-50/50 rounded-tl-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Basic Info</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name" required error={errors.name}>
                  <Input
                    name="tenant_name_field"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="e.g. Acme Regional"
                    autoComplete="off"
                    hasError={!!errors.name}
                  />
                </Field>
                <Field label="Slug" hint="Auto-sync" error={errors.slug}>
                  <Input
                    name="tenant_slug_field"
                    value={form.slug}
                    onChange={handleSlugChange}
                    placeholder="acme-reg"
                    autoComplete="off"
                    hasError={!!errors.slug}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Email" error={errors.contact_email}>
                  <Input
                    type="email"
                    name="tenant_contact_email_field"
                    value={form.contact_email}
                    onChange={set('contact_email')}
                    placeholder="admin@acme.com"
                    autoComplete="off"
                    hasError={!!errors.contact_email}
                  />
                </Field>
                <Field label="Contact Phone" error={errors.contact_phone}>
                  <Input
                    type="tel"
                    name="tenant_contact_phone_field"
                    value={form.contact_phone}
                    onChange={set('contact_phone')}
                    placeholder="+91 XXXXX XXXXX"
                    autoComplete="off"
                    hasError={!!errors.contact_phone}
                  />
                </Field>
              </div>

              <Select
                label="Status"
                value={form.status}
                onChange={set('status')}
                options={[
                  { value: 'draft', label: 'Draft (Registry Only)' },
                  { value: 'active', label: 'Active (Production)' },
                  { value: 'suspended', label: 'Suspended (Locked)' },
                ]}
              />

              <div className="pt-4 space-y-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-amber-600 rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Payment Gateway (Razorpay)</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Key ID">
                    <Input
                      name="razorpay_key_id"
                      value={form.razorpay_key_id}
                      onChange={set('razorpay_key_id')}
                      placeholder="rzp_test_..."
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Key Secret">
                    <Input
                      type="password"
                      name="razorpay_key_secret"
                      value={form.razorpay_key_secret}
                      onChange={set('razorpay_key_secret')}
                      placeholder="••••••••"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </div>

              <Field label="Logo">
                <ImageUpload
                  file={form.logo_file}
                  existingUrl={form.logo_url}
                  onFileChange={(file) => setForm((prev) => ({ ...prev, logo_file: file }))}
                  onError={setImageError}
                  id={`tenant-logo-input-${isEdit ? getTenantId(editTenant) : 'new'}`}
                  helperText="High-res PNG/JPEG (Max 2MB)"
                />
              </Field>
            </div>
          </div>

          {/* Right Column: Root Admin or Info */}
          <div className="md:col-span-5 p-8 space-y-6 bg-white rounded-tr-2xl border-l border-gray-100">
            {!isEdit ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Admin Details</span>
                </div>
                <div className="space-y-4">
                  <Field label="Admin Name" error={errors.admin_name}>
                    <Input
                      name="new_tenant_admin_fullname"
                      value={form.admin_name}
                      onChange={set('admin_name')}
                      placeholder="Jane Doe"
                      autoComplete="off"
                      hasError={!!errors.admin_name}
                    />
                  </Field>
                  <Field label="Email" error={errors.admin_email}>
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
                  <Field label="Password" hint="Min. 8 chars" error={errors.admin_password}>
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
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                   <p className="text-[10px] font-bold text-[#1a337e] leading-relaxed uppercase tracking-wider">
                      Note: This user will have absolute authority over the organizational node.
                   </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                 <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center shadow-inner border border-indigo-100">
                    <Building className="text-[#1a337e] w-10 h-10 animate-pulse" />
                 </div>
                 <div className="px-6">
                   <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Registry Encrypted</h4>
                   <p className="text-[10px] text-gray-400 font-bold mt-2 leading-relaxed uppercase tracking-wider">Administrator credentials are managed within the internal user registry.</p>
                 </div>
              </div>
            )}
          </div>
          </div>

          <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
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
            className="px-5 py-2 text-sm font-semibold text-white bg-[#1a337e] rounded-lg hover:bg-[#0d1245] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[150px] justify-center"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              isEdit ? 'Save Changes' : 'Add Tenant'
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
    <Modal isOpen={isOpen} onClose={onClose} title="Restrict Node Access" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Ban className="w-6 h-6" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-black text-red-900 uppercase tracking-tight">Restricting Node: {tenant?.name}</p>
            <p className="text-xs font-bold text-red-600/70 mt-1 uppercase tracking-wider">All organizational authorization will be revoked immediately.</p>
          </div>
        </div>
        <Field label="Reason for Restriction" hint="Included in the audit protocol.">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Violation of service terms / Requested by node admin..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-[#1a337e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none shadow-inner"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-900/20 active:scale-95 transition-all disabled:opacity-60"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Confirm Restriction'
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
    { label: 'Node Identity', value: tenant.name },
    { label: 'Protocol Slug', value: tenant.slug, mono: true },
    { label: 'Admin Access', value: tenant.contact_email || tenant.email },
    { label: 'Verified Phone', value: tenant.contact_phone },
    { label: 'Network Status', value: <Badge status={tenant.status} /> },
    { label: 'Deployment Date', value: safeFormat(tenant.created_at || tenant.createdAt) },
  ];

  const stats = tenant.usage || {};
  const usageStats = [
    {
      label: 'Authorized Users',
      value: stats.user_count ?? tenant.user_count ?? 0,
      icon: Users,
      tone: 'indigo',
    },
    {
      label: 'Election Nodes',
      value: stats.election_count ?? tenant.election_count ?? 0,
      icon: Vote,
      tone: 'emerald',
    },
    {
      label: 'Cast Protocols',
      value: stats.vote_count ?? stats.total_votes ?? tenant.total_votes ?? 0,
      icon: Building,
      tone: 'blue',
    },
  ];

  const toneClasses = {
    indigo: 'text-[#1a337e] bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    blue: 'text-[#1a337e] bg-blue-50 border-blue-100',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Node Intelligence Overview" size="2xl">
      <div className="space-y-8">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <ImageAvatar
            src={tenant.logo_url}
            name={tenant.name}
            sizeClass="w-20 h-20"
            shapeClass="rounded-2xl"
            imageClassName="border border-gray-200 shadow-md"
            fallbackClassName="text-white text-4xl font-black shadow-inner"
            style={{ backgroundColor: tenant.primary_color || '#1a337e' }}
          />
          <div className="min-w-0">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate">{tenant.name}</h3>
            <p className="text-sm text-[#1a337e] font-black uppercase tracking-widest mt-1">Node Protocol: {tenant.slug}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge status={tenant.status} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Real-time Node Telemetry
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {usageStats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="p-6 rounded-3xl border border-gray-100 bg-gray-50/50 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white border border-gray-100 shadow-sm ${toneClasses[tone]?.split(' ')[0]}`}>
                  <Icon className="w-6 h-6" strokeWidth={2.4} />
                </div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{value.toLocaleString()}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Registry Specifications
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            {detailRows.map(({ label, value, mono }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <div className={`text-sm font-bold text-gray-800 ${mono ? 'font-mono' : ''}`}>
                  {value || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-10 py-3 text-xs font-black uppercase tracking-widest text-gray-500 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
          >
            Dismiss Protocol
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onClose, tenant, onConfirm, actionLoading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decommission Node" size="sm">
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Trash2 className="w-6 h-6" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-black text-red-900 uppercase tracking-tight">Final Warning</p>
            <p className="text-xs font-bold text-red-600/70 mt-1 leading-relaxed uppercase tracking-wider">
              You are about to <span className="underline">permanently purge</span> {tenant?.name}. This node and all its jurisdictional data will be erased.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-60 flex items-center justify-center min-w-[140px]"
          >
            {actionLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Purge Node'
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
    try {
      const result = await dispatch(createTenant(data)).unwrap();
      toast.success('Tenant created successfully!');
      setCreateOpen(false);
      dispatch(fetchPlatformStats());
    } catch (error) {
      console.error('Tenant creation failed full object:', error);
      
      // Access the response data from the error object
      const errorData = error.response?.data || error;

      // Handle structured validation errors from backend (e.g., FastAPI)
      if (errorData && typeof errorData === 'object' && errorData.detail && Array.isArray(errorData.detail)) {
        const newErrors = {};
        errorData.detail.forEach((err) => {
          if (err.loc && err.loc.length > 1) {
            const field = err.loc[1]; // Usually ['body', 'field_name']
            newErrors[field] = err.msg;
          }
        });
        setErrors(newErrors);
        toast.error('Please fix the validation errors.');
      } else if (errorData && typeof errorData === 'object' && errorData.detail) {
        // FastAPI returns a plain string detail for business errors (e.g. 409 conflict)
        toast.error(errorData.detail);
      } else {
        toast.error(typeof error === 'string' ? error : (errorData?.message || 'Failed to create tenant.'));
      }
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
        <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard
            title="Total Tenants"
            icon={Building}
            tone="indigo"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(totalCount)}</span>
                <span className="mb-1 flex items-center text-xs font-bold text-[#1a337e]">
                  Tenants
                </span>
              </>
            }
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total registered organizations</p>
          </MetricCard>

          <MetricCard
            title="Active Tenants"
            icon={CheckCircle2}
            tone="emerald"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(activeCount)}</span>
                <span className="mb-1 text-xs font-bold text-emerald-600">
                  {totalCount ? Math.round((activeCount / totalCount) * 100) : 0}% Reach
                </span>
              </>
            }
          >
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${totalCount ? (activeCount / totalCount) * 100 : 0}%` }} />
            </div>
          </MetricCard>

          <MetricCard
            title="Draft Tenants"
            icon={Edit}
            tone="blue"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(draftCount)}</span>
                <span className="mb-1 text-xs font-bold text-[#1a337e]">Draft</span>
              </>
            }
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pending configuration nodes</p>
          </MetricCard>

          <MetricCard
            title="Restricted Access"
            icon={Ban}
            tone="red"
            value={
              <>
                <span className="text-4xl font-black text-red-600 tracking-tight">{numberFormat(suspendedCount)}</span>
              </>
            }
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Policy violations or inactivity</p>
            </div>
          </MetricCard>
        </section>

        <section className="flex flex-col items-center justify-between gap-6 md:flex-row bg-gray-50 border border-gray-200 p-6 rounded-3xl shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jurisdictional nodes..."
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

          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <div className="flex items-center gap-1 rounded-xl bg-white border border-gray-100 p-1 shadow-sm">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleStatusFilter(value)}
                  className={`rounded-lg px-5 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${statusFilter === value
                      ? 'bg-[#1a337e] text-white shadow-lg shadow-indigo-200'
                      : 'text-gray-500 hover:text-[#1a337e] hover:bg-indigo-50'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a337e] px-8 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#1a337e] shadow-xl shadow-[#1a337e]/20 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Add Tenant
            </button>
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {loading && filteredTenants.length === 0 ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filteredTenants.length === 0 ? (
            <div className="px-6 py-32 text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                <Building className="w-12 h-12 text-gray-200" />
              </div>
              <p className="text-gray-900 font-black uppercase tracking-tight text-xl">No Nodes Found</p>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">
                {search
                  ? `Zero matches for "${search}"`
                  : 'Start by deploying your first node.'}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] border-separate border-spacing-y-2 px-4 pb-4">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <th className="px-6 py-5 text-left">Organization Identity</th>
                    <th className="px-6 py-5 text-left">Protocol / Slug</th>
                    <th className="px-6 py-5 text-left">Contact Channel</th>
                    <th className="px-6 py-5 text-left">Network Status</th>
                    <th className="px-6 py-5 text-left">Created At</th>
                    <th className="px-6 py-5 text-left">Usage</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {filteredTenants.map((tenant) => {
                    const id = getTenantId(tenant);
                    const isSuspended = tenant.status === 'suspended';
                    return (
                      <tr key={id} className="group transition-all duration-200">
                        <td className="rounded-l-2xl bg-white border border-r-0 border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <ImageAvatar
                              src={tenant.logo_url}
                              name={tenant.name}
                              sizeClass="w-12 h-12"
                              shapeClass="rounded-xl"
                              imageClassName="border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
                              fallbackClassName="text-white text-sm font-black shadow-inner"
                              style={{ backgroundColor: tenant.primary_color || '#1a337e' }}
                            />
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate text-sm font-black text-gray-900 tracking-tight">
                                {tenant.name}
                              </p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID: {String(id).padStart(4, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-[10px] font-black text-[#1a337e] border border-indigo-100">
                              {tenant.slug}
                            </span>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-normal text-gray-900">
                              {tenant.contact_email || tenant.email || '—'}
                            </span>

                            {tenant.contact_phone && (
                              <span className="text-[10px] font-normal text-gray-400">
                                {tenant.contact_phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <Badge status={tenant.status} />
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                              {safeFormat(tenant.created_at || tenant.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <Users className="h-3.5 w-3.5 text-gray-400 mb-0.5" />
                              <span className="text-[11px] font-black text-gray-900">{tenant.user_count ?? 0}</span>
                            </div>
                            <div className="h-6 w-px bg-gray-100 mx-1" />
                            <div className="flex flex-col items-center">
                              <Vote className="h-3.5 w-3.5 text-gray-400 mb-0.5" />
                              <span className="text-[11px] font-black text-gray-900">{tenant.election_count ?? 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="rounded-r-2xl bg-white border border-l-0 border-gray-100 px-6 py-5 text-right group-hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={() => handleViewDetails(tenant)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1a337e] hover:bg-[#1a337e] hover:text-white transition-all shadow-sm border border-blue-100"
                              title="Inspect Node"
                            >
                              <Eye size={16} strokeWidth={2.4} />
                            </button>
                            <button
                              onClick={() => setEditTenant(tenant)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                              title="Modify Registry"
                            >
                              <Edit size={16} strokeWidth={2.4} />
                            </button>
                            {isSuspended ? (
                              <button
                                onClick={() => handleActivate(tenant)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                title="Authorize Node"
                              >
                                <CheckCircle2 size={16} strokeWidth={2.4} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setSuspendTarget(tenant)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                title="Restrict Node"
                              >
                                <Ban size={16} strokeWidth={2.4} />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(tenant)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                              title="Decommission Node"
                            >
                              <Trash2 size={16} strokeWidth={2.4} />
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
            <div className="border-t border-gray-100 bg-gray-50/50 p-4 rounded-b-3xl">
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
