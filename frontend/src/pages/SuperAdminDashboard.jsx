import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckCircle2, Clock, AlertCircle, TrendingUp, Eye, Ban
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
import Pagination from '../components/common/Pagination';
import TableActions from '../components/common/TableActions';
import { resolveMediaUrl } from '../utils/images';

const RECENT_PAGE_SIZE = 5;

const MetricCard = ({ title, value, subtext, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md group">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-xs font-semibold text-gray-500">{title}</h3>
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#0051D5] transition-colors border border-gray-100 shadow-sm">
        <Icon size={20} />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-sm text-gray-500 flex items-center">
      {subtext?.includes('+') && <TrendingUp className="w-4 h-4 mr-1 text-black" />}
      {subtext}
    </div>
  </div>
);

const TenantRow = ({ logo, initials, name, slug, status, plan, initialsBg = 'bg-gray-200 text-gray-900', onDetails, onSuspend }) => (
  <tr className="border-b border-gray-100 hover:bg-[#e6edfb]/50 transition-colors group">
    <td className="px-3 py-3 align-top sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        <img src={logo} alt={name} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover shadow-sm border border-gray-200" />
      ) : (
        <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm ${initialsBg}`}>
          {initials}
        </div>
      )}
        <span className="min-w-0 break-words font-semibold text-gray-800">{name}</span>
      </div>
    </td>
    <td className="px-3 py-3 align-top sm:px-4">
      <span className="inline-block max-w-full break-words text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
        {slug}
      </span>
    </td>
    <td className="px-3 py-3 align-top sm:px-4">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600">
        {plan}
      </span>
    </td>
    <td className="px-3 py-3 align-top sm:px-4">
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
        status === 'Active' || status === 'active' 
          ? 'bg-gray-100 text-gray-900 border-gray-200' : 
        status === 'Provisioning' || status === 'Trial' || status === 'trial'
          ? 'bg-gray-50 text-gray-600 border-gray-100' : 
          'bg-gray-50 text-gray-500 border-gray-100'
      }`}>
        {status}
      </span>
    </td>
    <td className="w-24 px-3 py-3 text-right align-top sm:px-4">
      <TableActions
        actions={[
          { key: 'view', label: 'Details', icon: Eye, onClick: onDetails },
          {
            key: status === 'suspended' || status === 'Suspended' ? 'activate' : 'block',
            label: status === 'suspended' || status === 'Suspended' ? 'Activate' : 'Suspend',
            icon: Ban,
            onClick: onSuspend,
          },
        ]}
      />
    </td>
  </tr>
);

export default function SuperAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const platformStats = useSelector(selectPlatformStats);
  const tenants = useSelector(selectTenants);
  const loading = useSelector(selectTenantLoading);
  const [recentPage, setRecentPage] = useState(1);

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

  const recentTotalPages = Math.ceil(tenants.length / RECENT_PAGE_SIZE);
  const recentTenants = useMemo(() => {
    const start = (recentPage - 1) * RECENT_PAGE_SIZE;
    return tenants.slice(start, start + RECENT_PAGE_SIZE);
  }, [recentPage, tenants]);

  useEffect(() => {
    if (recentPage > recentTotalPages && recentTotalPages > 0) {
      setRecentPage(recentTotalPages);
    }
  }, [recentPage, recentTotalPages]);

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time platform monitoring and organization tracking.</p>
          </div>
          <button 
            onClick={() => navigate('/tenants')}
            className="px-8 py-3 bg-[#0051D5] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#0051D5] active:scale-95 transition-all shadow-2xl"
          >
            New Tenant
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Tenants" value={stats.totalTenants} subtext="+3 this week" icon={Users} />
          <MetricCard title="Active Tenants" value={stats.activeTenants} subtext="Fully operational" icon={CheckCircle2} />
          <MetricCard title="Trial Accounts" value={stats.trialTenants} subtext="New onboarding" icon={Clock} />
          <MetricCard title="Suspended" value={stats.suspendedTenants} subtext="Access restricted" icon={AlertCircle} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Recent Activity</h3>
            <button onClick={() => navigate('/tenants')} className="text-sm font-bold text-[#0051D5] hover:text-[#0051D5] transition-colors">
              View all records
            </button>
          </div>
          <div className="w-full">
            <table className="w-full table-fixed text-sm text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 break-words sm:px-4">Organization</th>
                  <th className="px-3 py-3 break-words sm:px-4">Identifier</th>
                  <th className="px-3 py-3 break-words sm:px-4">Plan</th>
                  <th className="px-3 py-3 break-words sm:px-4">Status</th>
                  <th className="w-24 px-3 py-3 text-right whitespace-nowrap sm:px-4" style={{ width: '6rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && tenants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center"><LoadingSpinner /></td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-gray-400 font-medium uppercase tracking-widest text-[10px]">No active nodes found</td>
                  </tr>
                ) : recentTenants.map((tenant, index) => {
                  const colors = ['bg-gray-100 text-gray-800', 'bg-gray-200 text-gray-900', 'bg-gray-50 text-gray-600', 'bg-gray-100 text-gray-700'];
                  const bgClass = colors[index % colors.length];

                  return (
                    <TenantRow 
                      key={tenant._id || tenant.id}
                      logo={resolveMediaUrl(tenant.logo_url || tenant.logo)}
                      initials={tenant.name?.[0]?.toUpperCase() || 'T'}
                      name={tenant.name}
                      slug={tenant.slug}
                      status={tenant.status || 'Active'}
                      plan={tenant.plan || 'Enterprise'}
                      initialsBg={bgClass}
                      onDetails={() => navigate(`/tenants?view=${tenant._id || tenant.id}`)}
                      onSuspend={() => handleSuspendToggle(tenant)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          {recentTotalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              <Pagination page={recentPage} totalPages={recentTotalPages} onPageChange={setRecentPage} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
