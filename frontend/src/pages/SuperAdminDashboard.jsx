import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaBuilding,
  FaCheckCircle,
  FaArrowRight,
} from 'react-icons/fa';
import {
  fetchPlatformStats,
  fetchTenants,
  selectPlatformStats,
  selectTenants,
  selectTenantLoading,
} from '../store/slices/tenantSlice';
import StatsCard from '../components/common/StatsCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MainLayout from '../components/layout/MainLayout';
import ImageAvatar from '../components/common/ImageAvatar';
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

// ─── Plan Badge ───────────────────────────────────────────────────────────────

const PLAN_BADGE_STYLES = {
  starter: 'bg-gray-100 text-gray-600 ring-gray-200',
  professional: 'bg-blue-100 text-blue-700 ring-blue-200',
  enterprise: 'bg-purple-100 text-purple-700 ring-purple-200',
};

function PlanBadge({ plan }) {
  if (!plan) return null;
  const key = plan.toLowerCase();
  const style = PLAN_BADGE_STYLES[key] ?? 'bg-gray-100 text-gray-600 ring-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 capitalize ${style}`}
    >
      {plan}
    </span>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const platformStats = useSelector(selectPlatformStats);
  const tenants = useSelector(selectTenants);
  const loading = useSelector(selectTenantLoading);

  useEffect(() => {
    dispatch(fetchPlatformStats());
    dispatch(fetchTenants({ page: 1, per_page: 10 }));
  }, [dispatch]);

  const stats = {
    totalTenants: platformStats?.total_tenants ?? platformStats?.totalTenants ?? 0,
    activeTenants: platformStats?.active_tenants ?? platformStats?.activeTenants ?? 0,
    trialTenants: platformStats?.trial_tenants ?? platformStats?.trialTenants ?? 0,
    suspendedTenants: platformStats?.suspended_tenants ?? platformStats?.suspendedTenants ?? 0,
  };

  const handleSuspendToggle = (tenant) => {
    const id = tenant._id || tenant.id;
    navigate(`/tenants?action=toggle&id=${id}`);
  };

  return (
    <MainLayout title="Platform Control Center">
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              System health and tenant management.
            </p>
          </div>
          <div className="flex gap-2">
            <button
                onClick={() => navigate('/tenants')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <FaBuilding className="text-xs" />
                Manage Tenants
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading && !platformStats ? (
          <LoadingSpinner message="Loading platform stats..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatsCard
              title="Total Tenants"
              value={stats.totalTenants}
              icon={FaBuilding}
              color="indigo"
            />
            <StatsCard
              title="Active Tenants"
              value={stats.activeTenants}
              icon={FaCheckCircle}
              color="green"
            />
             <StatsCard
              title="Trial Tenants"
              value={stats.trialTenants}
              icon={FaBuilding}
              color="blue"
            />
            <StatsCard
              title="Suspended"
              value={stats.suspendedTenants}
              icon={FaBuilding}
              color="orange"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
            {/* Tenant List Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-800">Recent Tenants</h3>
                <button
                onClick={() => navigate('/tenants')}
                className="flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors"
                >
                View all
                <FaArrowRight className="text-xs" />
                </button>
            </div>

            {loading && tenants.length === 0 ? (
                <LoadingSpinner message="Loading tenants..." />
            ) : tenants.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400">
                <FaBuilding className="text-3xl mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tenants found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        {[
                        'Organization Name',
                        'Slug',
                        'Plan',
                        'Status',
                        'Actions',
                        ].map((col) => (
                        <th
                            key={col}
                            className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
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
                        const id = tenant._id || tenant.id;
                        const isSuspended = tenant.status === 'suspended';

                        return (
                        <tr key={id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <ImageAvatar
                                src={tenant.logo_url}
                                name={tenant.name}
                                sizeClass="w-8 h-8"
                                shapeClass="rounded-lg"
                                fallbackClassName="text-white text-sm"
                                style={{ backgroundColor: tenant.primary_color || '#6b7280' }}
                                />
                                <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                                {tenant.name}
                                </span>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {tenant.slug}
                            </span>
                            </td>
                            <td className="px-6 py-4">
                            <PlanBadge plan={tenant.plan} />
                            </td>
                            <td className="px-6 py-4">
                            <Badge status={tenant.status} />
                            </td>
                            <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                onClick={() => navigate(`/tenants?view=${id}`)}
                                className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                Details
                                </button>
                                <button
                                onClick={() => handleSuspendToggle(tenant)}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                    isSuspended
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                                >
                                {isSuspended ? 'Activate' : 'Suspend'}
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
        </div>
      </div>
    </MainLayout>
  );
}
