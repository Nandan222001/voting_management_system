import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  CloudOff,
  Database,
  FileText,
  Globe,
  Info,
  LockKeyhole,
  LockOpen,
  Layers,
  Network,
  PlayCircle,
  TrendingUp,
  UserCheck,
  Users,
  Vote,
} from 'lucide-react';
import {
  fetchPlatformStats,
  fetchTenants,
  selectPlatformStats,
  selectTenants,
  selectTenantLoading,
} from '../store/slices/tenantSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MainLayout from '../components/layout/MainLayout';

function numberFormat(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MetricCard({ title, value, children, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: { icon: 'text-[#1a337e] bg-blue-50 border-blue-100', text: 'text-[#1a337e]' },
    amber: { icon: 'text-amber-600 bg-amber-50 border-amber-100', text: 'text-amber-600' },
    emerald: { icon: 'text-emerald-600 bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
    indigo: { icon: 'text-[#1a337e] bg-indigo-50 border-indigo-100', text: 'text-[#1a337e]' },
  };

  const style = toneMap[tone] || toneMap.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#c4c6d0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 ${style.icon}`}>
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

function ActivityItem({ tone, icon: Icon, title, time, description, meta, pulse }) {
  const toneClasses = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-[#1a337e] border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };

  const pulseClasses = {
    amber: 'bg-amber-500 sa-pulse-amber',
    blue: 'bg-[#1a337e] sa-pulse-green',
    red: 'bg-red-500',
  };

  return (
    <div className="group relative flex gap-4 rounded-xl border border-transparent p-4 transition-all duration-300 hover:border-[#c4c6d0] hover:bg-white hover:shadow-sm">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-110 ${toneClasses[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="truncate text-[13px] font-black uppercase tracking-wider text-[#1b1b1f]">
            {title}
          </span>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-[#44464f]">
            {time}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#44464f] font-medium">
          {description}
        </p>
        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {meta.map(({ icon: MetaIcon, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-bold text-[#44464f] border border-gray-100">
                <MetaIcon className="h-3.5 w-3.5 text-gray-400" />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
      {pulse && (
        <div className="absolute -left-1 top-6 flex h-3 w-3">
          <span className={`relative inline-flex h-3 w-3 rounded-full ${pulseClasses[tone]}`}></span>
        </div>
      )}
    </div>
  );
}

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

  const stats = useMemo(() => {
    const totalTenants = platformStats?.total_tenants ?? platformStats?.totalTenants ?? tenants.length;
    const activeTenants = platformStats?.active_tenants ?? platformStats?.activeTenants ?? 0;
    const draftTenants = platformStats?.draft_tenants ?? platformStats?.draftTenants ?? 0;
    const suspendedTenants = platformStats?.suspended_tenants ?? platformStats?.suspendedTenants ?? 0;

    const totalElections = platformStats?.total_elections ?? platformStats?.totalElections ?? 0;
    const activeElections = platformStats?.active_elections ?? platformStats?.activeElections ?? 0;
    const draftElections = platformStats?.draft_elections ?? platformStats?.draftElections ?? 0;
    const closedElections = platformStats?.closed_elections ?? platformStats?.closedElections ?? 0;

    const totalUsers = platformStats?.total_users ?? platformStats?.totalUsers ?? 0;
    const pendingUsers = platformStats?.pending_users ?? platformStats?.pendingUsers ?? 0;

    const totalVotes = platformStats?.total_votes ?? platformStats?.totalVotes ?? 0;
    const totalCandidates = platformStats?.total_candidates ?? platformStats?.totalCandidates ?? 0;
    const totalCommittees = platformStats?.total_committees ?? platformStats?.totalCommittees ?? 0;
    const totalPoliticalCommittees = platformStats?.total_political_committees ?? platformStats?.totalPoliticalCommittees ?? 0;
    const recentActivity = platformStats?.recent_activity ?? [];
    const recentElections = platformStats?.recent_elections ?? [];

    return {
      totalTenants,
      activeTenants,
      draftTenants,
      suspendedTenants,
      totalElections,
      activeElections,
      draftElections,
      closedElections,
      totalUsers,
      pendingUsers,
      totalVotes,
      totalCandidates,
      totalCommittees,
      totalPoliticalCommittees,
      recentActivity,
      recentElections,
    };
  }, [platformStats, tenants]);

  const recentTenants = tenants.slice(0, 3);

  return (
    <MainLayout title="Dashboard">
      <style>{`
        .sa-pulse-amber { animation: saPulseAmber 2s infinite; }
        .sa-pulse-green { animation: saPulseGreen 2s infinite; }
        @keyframes saPulseAmber {
          0% { box-shadow: 0 0 0 0 rgba(138, 75, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(138, 75, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(138, 75, 0, 0); }
        }
        @keyframes saPulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(5, 110, 0, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(5, 110, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(5, 110, 0, 0); }
        }
        .sa-scrollbar::-webkit-scrollbar { width: 4px; }
        .sa-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sa-scrollbar::-webkit-scrollbar-thumb { background: #c4c6d0; border-radius: 10px; }
      `}</style>

      <div className="w-full">
         
        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Tenants Overview"
            icon={Building2}
            tone="blue"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(stats.totalTenants)}</span>
                <span className="mb-1 flex items-center text-xs font-bold text-emerald-600">
                  {stats.activeTenants} Active
                </span>
              </>
            }
          >
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{stats.draftTenants} Draft</span>
              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{stats.suspendedTenants} Suspended</span>
            </div>
          </MetricCard>

          <MetricCard
            title="Total Elections"
            icon={Vote}
            tone="indigo"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(stats.totalElections)}</span>
                <span className="mb-1 text-xs font-bold text-gray-400">Live: {stats.activeElections}</span>
              </>
            }
          >
            <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full bg-[#1a337e] transition-all" title={`Active: ${stats.activeElections}`} style={{ flexGrow: stats.activeElections || 1 }} />
              <div className="h-full bg-[#1a337e] transition-all" title={`Draft: ${stats.draftElections}`} style={{ flexGrow: stats.draftElections || 1 }} />
              <div className="h-full bg-gray-300 transition-all" title={`Closed: ${stats.closedElections}`} style={{ flexGrow: stats.closedElections || 1 }} />
            </div>
          </MetricCard>

          <MetricCard
            title="Total Users"
            icon={Users}
            tone="emerald"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(stats.totalUsers)}</span>
                <span className="mb-1 flex items-center text-xs font-bold text-emerald-600">
                  <UserCheck className="h-3 w-3" /> {numberFormat(stats.totalUsers - stats.pendingUsers)}
                </span>
              </>
            }
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100/50 inline-block">
              {stats.pendingUsers} Pending Verification
            </div>
          </MetricCard>

          <MetricCard
            title="Political Committees"
            icon={Layers}
            tone="amber"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(stats.totalPoliticalCommittees)}</span>
                <span className="mb-1 flex items-center text-xs font-bold text-gray-400">
                   Committees
                </span>
              </>
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-gray-500">Candidates</span>
                <span className="text-amber-600">{numberFormat(stats.totalCandidates)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-amber-500 transition-all" style={{ width: '65%' }} />
              </div>
            </div>
          </MetricCard>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="flex h-[640px] flex-col overflow-hidden rounded-3xl border border-[#c4c6d0] bg-white shadow-xl lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1a337e] border border-blue-100 shadow-inner">
                   <Activity className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">Network Activity</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Live Election Stream</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 border border-emerald-100 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 sa-pulse-green" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Cluster: Optimal</span>
              </div>
            </div>
            <div className="sa-scrollbar flex-1 space-y-2 overflow-y-auto p-6 bg-gray-50/30">
              {loading && stats.recentElections.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : stats.recentElections.length === 0 ? (
                <div className="flex h-full items-center justify-center flex-col gap-4 text-gray-400">
                  <Vote className="h-16 w-16 opacity-10" />
                  <p className="text-sm font-black uppercase tracking-widest opacity-30">Waiting for network events...</p>
                </div>
              ) : (
                stats.recentElections.map((election) => {
                  const getStatusConfig = (status) => {
                    switch (status?.toLowerCase()) {
                      case 'active': return { tone: 'blue', icon: PlayCircle, pulse: 'sa-pulse-green' };
                      case 'closed': return { tone: 'amber', icon: CheckCircle2, pulse: null };
                      default: return { tone: 'amber', icon: FileText, pulse: 'sa-pulse-amber' };
                    }
                  };
                  const { tone, icon, pulse } = getStatusConfig(election.status);
                  
                  return (
                    <ActivityItem
                      key={election.id}
                      tone={tone}
                      icon={icon}
                      title={`${election.tenant_name}: ${election.title}`}
                      time={timeAgo(election.created_at)}
                      description={`Status: ${election.status.toUpperCase()}. Scheduled timeframe: ${new Date(election.start_date).toLocaleDateString()} to ${new Date(election.end_date).toLocaleDateString()}.`}
                      meta={[
                        { icon: Globe, label: election.status.toUpperCase() },
                        { icon: Building2, label: election.tenant_name },
                      ]}
                      pulse={pulse ? `${pulse} ${tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}` : null}
                    />
                  );
                })
              )}
            </div>
            <div className="border-t border-gray-100 bg-white p-4 text-center">
              <button 
                type="button" 
                onClick={() => navigate('/elections?superadmin=true')} 
                className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1a337e] transition hover:text-[#1a337e]"
              >
                Inspect Global Registry
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-8">
            <section className="flex flex-1 flex-col rounded-3xl border border-[#c4c6d0] bg-white shadow-xl overflow-hidden min-h-[400px]">
              <div className="border-b border-gray-100 bg-white p-6">
                <h2 className="text-xl font-black tracking-tight text-gray-900">Security Audit</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">System Authorization Logs</p>
              </div>
              <div className="sa-scrollbar flex-1 overflow-y-auto p-4 bg-gray-50/10">
                <table className="w-full border-separate border-spacing-y-2 text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="px-4 py-2 font-black">Ref</th>
                      <th className="px-4 py-2 font-black">Protocol</th>
                      <th className="px-4 py-2 text-right font-black">Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 animate-pulse">Syncing Encrypted Logs...</td>
                      </tr>
                    ) : (
                      stats.recentActivity.map((log) => {
                        const getIconAndColor = (action) => {
                          if (action.includes('delete') || action.includes('fail') || action.includes('attempt')) 
                            return { icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-100' };
                          if (action.includes('create') || action.includes('update')) 
                            return { icon: Info, color: 'text-amber-600 bg-amber-50 border-amber-100' };
                          if (action.includes('login')) 
                            return { icon: LockOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
                          return { icon: Info, color: 'text-[#1a337e] bg-blue-50 border-blue-100' };
                        };
                        const { icon: LogIcon, color } = getIconAndColor(log.action);
                        const logTime = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                        
                        return (
                          <tr key={log.id} className="group transition-all duration-200">
                            <td className="rounded-l-xl bg-white border border-r-0 border-gray-100 p-4 transition-colors group-hover:bg-gray-50">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm ${color}`}>
                                <LogIcon className="h-5 w-5" />
                              </div>
                            </td>
                            <td className="bg-white border-y border-gray-100 p-4 transition-colors group-hover:bg-gray-50">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-900 truncate max-w-[120px]" title={log.action}>
                                  {log.action.replace(/[._]/g, ' ')}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400">{log.user_name}</span>
                              </div>
                            </td>
                            <td className="rounded-r-xl bg-white border border-l-0 border-gray-100 p-4 text-right transition-colors group-hover:bg-gray-50">
                              <span className="text-[10px] font-black tracking-tight text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{logTime}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
