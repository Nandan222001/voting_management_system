import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle2, Clock, AlertCircle, TrendingUp, Eye, Ban, Vote
} from 'lucide-react';
import {
  fetchPlatformStats,
  fetchTenants,
  selectPlatformStats,
  selectTenants,
  selectTenantLoading,
} from '../store/slices/tenantSlice';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';

const RECENT_PAGE_SIZE = 5;

function getTenantId(tenant) {
  return tenant?._id ?? tenant?.id ?? '';
}

const PLAN_STYLES = {
  starter: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  professional: 'bg-blue-100 text-[rgb(16_102_177)] ring-1 ring-blue-200',
  enterprise: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
};

function PlanBadge({ plan }) {
  if (!plan) return <span className="text-gray-400 text-xs">—</span>;
  const key = plan.toLowerCase();
  const style = PLAN_STYLES[key] ?? PLAN_STYLES.starter;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style}`}>
      {plan}
    </span>
  );
}

const MetricCard = ({ title, value, subtext, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md group">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[rgb(16_102_177)] transition-colors border border-gray-100 shadow-sm">
        <Icon size={20} />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-500 flex items-center">
      {subtext?.includes('+') && <TrendingUp className="w-4 h-4 mr-1 text-green-500" />}
      {subtext}
    </div>
  </div>
);

export default function SuperAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const platformStats = useSelector(selectPlatformStats);
  const tenants = useSelector(selectTenants);
  const loading = useSelector(selectTenantLoading);
  const [recentPage] = useState(1);

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
    const id = getTenantId(tenant);
    navigate(`/tenants?action=toggle&id=${id}`);
  };

  const recentTenants = useMemo(() => {
    const start = (recentPage - 1) * RECENT_PAGE_SIZE;
    return tenants.slice(start, start + RECENT_PAGE_SIZE);
  }, [recentPage, tenants]);

  return (
    <MainLayout title="Platform Overview">
      <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[rgb(16_102_177)]">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Platform-wide status and management.
            </p>
          </div>
          <button 
            onClick={() => navigate('/tenants')}
            className="px-6 py-2.5 bg-[rgb(16_102_177)] text-white text-sm font-semibold rounded-xl hover:bg-[rgb(12_85_148)] active:scale-95 transition-all shadow-sm"
          >
            Manage Tenants
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Tenants" value={stats.totalTenants} subtext="Global accounts" icon={Users} />
          <MetricCard title="Active Tenants" value={stats.activeTenants} subtext="Fully operational" icon={CheckCircle2} />
          <MetricCard title="Trial Accounts" value={stats.trialTenants} subtext="New onboarding" icon={Clock} />
          <MetricCard title="Suspended" value={stats.suspendedTenants} subtext="Restricted access" icon={AlertCircle} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Recent Activity</h3>
            <button onClick={() => navigate('/tenants')} className="text-sm font-bold text-[rgb(16_102_177)] hover:underline transition-colors">
              View all
            </button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Organisation</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Metrics</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && tenants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center"><LoadingSpinner /></td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-gray-400 font-medium uppercase tracking-widest text-[10px]">No records found</td>
                  </tr>
                ) : recentTenants.map((tenant) => {
                  const id = getTenantId(tenant);
                  const isSuspended = tenant.status === 'suspended';
                  return (
                    <tr key={id} className="hover:bg-[#e6edfb]/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                            {tenant.logo_url ? (
                              <img src={tenant.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              <span className="text-gray-400 font-bold uppercase">{tenant.name?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{tenant.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PlanBadge plan={tenant.plan} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={tenant.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                           <div className="flex items-center gap-1">
                             <Users size={14} className="text-gray-400" />
                             <span>{tenant.user_count ?? 0}</span>
                           </div>
                           <div className="flex items-center gap-1">
                             <Vote size={14} className="text-gray-400" />
                             <span>{tenant.election_count ?? 0}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/tenants?view=${id}`)}
                            className="p-2 text-gray-400 hover:text-[rgb(16_102_177)] hover:bg-blue-50 rounded-lg transition-all"
                            title="Quick View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleSuspendToggle(tenant)}
                            className={`p-2 rounded-lg transition-all ${
                              isSuspended
                                ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isSuspended ? 'Activate' : 'Suspend'}
                          >
                            <Ban size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
