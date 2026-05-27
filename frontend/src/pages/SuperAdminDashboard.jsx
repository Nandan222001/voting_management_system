import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaArrowRight,
  FaVoteYea,
  FaUsers,
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
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1066b1]">Platform Overview</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage all tenants and monitor platform-wide activity.
            </p>
          </div>
          <button
            onClick={() => navigate('/tenants')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <FaBuilding className="text-xs" />
            Manage Tenants
          </button>
        </div>

        {/* Stats Grid */}
        {loading && !platformStats ? (
          <LoadingSpinner message="Loading platform stats..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatsCard
              title="Total Tenants"
              value={stats.totalTenants}
              icon={FaBuilding}
              color="purple"
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
              icon={FaClock}
              color="orange"
            />
            <StatsCard
              title="Suspended Tenants"
              value={stats.suspendedTenants}
              icon={FaBan}
              color="red"
            />
          </div>
        )}

        {/* Tenant List Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Recent Tenants</h3>
            <button
              onClick={() => navigate('/tenants')}
              className="flex items-center gap-1 text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors"
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
                      'Elections',
                      'Users',
                      'Created',
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
                        {/* Organization Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {tenant.logo_url ? (
                              <img
                                src={tenant.logo_url}
                                alt={tenant.name}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                style={{ backgroundColor: tenant.primary_color || '#4f46e5' }}
                              >
                                {tenant.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                              {tenant.name}
                            </span>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {tenant.slug}
                          </span>
                        </td>

                        {/* Plan */}
                        <td className="px-6 py-4">
                          <PlanBadge plan={tenant.plan} />
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge status={tenant.status} />
                        </td>

                        {/* Elections */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <FaVoteYea className="text-gray-400 text-xs" />
                            <span>{tenant.election_count ?? tenant.elections ?? '—'}</span>
                          </div>
                        </td>

                        {/* Users */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <FaUsers className="text-gray-400 text-xs" />
                            <span>{tenant.user_count ?? tenant.users ?? '—'}</span>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {safeFormat(tenant.created_at || tenant.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/tenants?view=${id}`)}
                              className="px-3 py-1.5 text-xs font-semibold text-[#1B4FD8] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleSuspendToggle(tenant)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                isSuspended
                                  ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                  : 'text-red-600 bg-red-50 hover:bg-red-100'
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
    </MainLayout>
  );
}
