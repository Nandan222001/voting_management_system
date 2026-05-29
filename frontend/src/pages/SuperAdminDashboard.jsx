import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CloudOff,
  Database,
  Info,
  LockKeyhole,
  LockOpen,
  Network,
  TrendingUp,
  UserCheck,
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

function MetricCard({ title, value, children, icon: Icon, iconClass = 'text-[#1A237E]' }) {
  return (
    <div className="rounded-lg border border-[#c4c6d0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#44464f]">{title}</span>
        <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={2.4} />
      </div>
      <div className="flex min-h-[38px] items-end gap-2">{value}</div>
      {children}
    </div>
  );
}

function ActivityItem({ tone, icon: Icon, title, time, description, meta, pulse }) {
  const toneClasses = {
    amber: 'bg-[#ffdcc2] text-[#683700]',
    blue: 'bg-[#e8eaf6] text-[#1A237E]',
    red: 'bg-[#ffdad6] text-[#ba1a1a]',
  };

  return (
    <div className="flex gap-4 rounded-lg border border-transparent p-3 transition hover:border-[#c4c6d0] hover:bg-[#f4f3f7]">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="truncate text-sm font-bold text-[#1b1b1f]">{title}</span>
          <span className="shrink-0 text-[10px] text-[#44464f]">{time}</span>
        </div>
        <p className="text-sm leading-5 text-[#44464f]">{description}</p>
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {meta.map(({ icon: MetaIcon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] font-bold text-[#44464f]">
                <MetaIcon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
      {pulse && <span className={`mt-2 h-2 w-2 rounded-full ${pulse}`} />}
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
    const activeTenants = platformStats?.active_tenants ?? platformStats?.activeTenants ?? tenants.filter((tenant) => tenant.status === 'active').length;
    const totalElections =
      platformStats?.total_elections ??
      platformStats?.totalElections ??
      tenants.reduce((sum, tenant) => sum + Number(tenant.election_count || 0), 0);
    const monthlyRevenue = platformStats?.monthly_revenue ?? platformStats?.monthlyRevenue ?? platformStats?.arr ?? 2400000;

    return {
      totalTenants,
      activeTenants,
      totalElections,
      liveElections: platformStats?.live_elections ?? platformStats?.liveElections ?? 42,
      monthlyRevenue,
    };
  }, [platformStats, tenants]);

  const recentTenants = tenants.slice(0, 3);

  return (
    <MainLayout title="Infrastructure Control">
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
        {/* <section className="mb-6">
          <div className="flex items-start gap-4 rounded-r-lg border-l-4 border-[#ba1a1a] bg-[#ba1a1a]/5 p-4 text-[#93000a] shadow-sm">
            <div className="rounded-full bg-[#ba1a1a] p-2 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider">Security Advisory: Latency Anomaly Detected</p>
              <p className="text-sm leading-5">
                Unusual API access patterns detected from IP 192.168.4.12 across 4 tenant nodes. Immediate audit recommended.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/audit-logs')}
              className="hidden rounded bg-[#ba1a1a] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-red-800 sm:block"
            >
              Investigate
            </button>
          </div>
        </section> */}

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Tenants"
            icon={Building2}
            value={
              <>
                <span className="text-3xl font-black text-[#1b1b1f]">{numberFormat(stats.activeTenants)}</span>
                <span className="mb-1 flex items-center text-xs font-bold text-[#056e00]">
                  <TrendingUp className="h-3 w-3" /> +8%
                </span>
              </>
            }
          >
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#eeeef4]">
              <div className="h-full w-[72%] bg-[#1A237E]" />
            </div>
          </MetricCard>

          <MetricCard
            title="Total Elections"
            icon={Vote}
            value={
              <>
                <span className="text-3xl font-black text-[#1b1b1f]">{numberFormat(stats.totalElections || 3892)}</span>
                <span className="mb-1 text-xs font-bold text-[#44464f]">Live: {stats.liveElections}</span>
              </>
            }
          >
            <div className="mt-4 flex h-6 gap-1">
              {['h-full bg-[#b2c5ff]', 'mt-auto h-2 bg-[#b2c5ff]', 'h-full bg-[#1A237E]', 'mt-auto h-3 bg-[#b2c5ff]', 'mt-auto h-4 bg-[#1A237E]', 'h-full bg-[#1A237E]'].map((className, index) => (
                <div key={index} className={`w-full rounded-sm ${className}`} />
              ))}
            </div>
          </MetricCard>

          <MetricCard
            title="ARR / Growth"
            icon={Building2}
            value={
              <>
                <span className="text-3xl font-black text-[#1b1b1f]">${Number(stats.monthlyRevenue / 1000000).toFixed(1)}M</span>
                <span className="mb-1 flex items-center text-xs font-bold text-[#056e00]">
                  <BadgeCheck className="h-3 w-3" /> Secure
                </span>
              </>
            }
          >
            <p className="mt-4 text-xs text-[#44464f]">Next billing cycle: 12 Oct</p>
          </MetricCard>

          <MetricCard
            title="System Health"
            icon={CheckCircle2}
            iconClass="text-[#056e00]"
            value={
              <>
                <span className="text-3xl font-black text-[#1b1b1f]">99.98%</span>
                <span className="mb-1 text-xs font-bold text-[#44464f]">Latency: 42ms</span>
              </>
            }
          >
            <div className="mt-4 flex items-center justify-between gap-1">
              <div className="h-2 flex-1 rounded-full bg-[#056e00]" />
              <div className="h-2 flex-1 rounded-full bg-[#056e00]" />
              <div className="h-2 flex-1 rounded-full bg-[#056e00]" />
              <div className="h-2 flex-1 rounded-full bg-[#056e00]/30" />
            </div>
          </MetricCard>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="flex h-[500px] flex-col overflow-hidden rounded-lg border border-[#c4c6d0] bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#c4c6d0] bg-[#fbfcff] p-4">
              <h2 className="text-lg font-semibold text-[#1b1b1f]">Live Election Activity</h2>
              <div className="flex items-center gap-2">
                <span className="sa-pulse-green h-2 w-2 rounded-full bg-[#056e00]" />
                <span className="text-[10px] font-bold uppercase tracking-normal text-[#056e00]">Real-time Feed</span>
              </div>
            </div>
            <div className="sa-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
              {loading && tenants.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                (recentTenants.length ? recentTenants : [{ name: 'Florida-District-12' }, { name: 'Toronto-City-Council' }, { name: 'UK-Local-Borough' }]).map((tenant, index) => {
                  const items = [
                    {
                      tone: 'amber',
                      icon: UserCheck,
                      title: `Tenant: ${tenant.name || 'Florida-District-12'}`,
                      time: '2 mins ago',
                      description: 'General Election Phase: Voter Verification Started. 12k records processing.',
                      meta: [
                        { icon: Database, label: '1.2 GB/s' },
                        { icon: LockKeyhole, label: 'SHA-512' },
                      ],
                      pulse: 'sa-pulse-amber bg-[#683700]',
                    },
                    {
                      tone: 'blue',
                      icon: BarChart3,
                      title: `Tenant: ${tenant.name || 'Toronto-City-Council'}`,
                      time: '14 mins ago',
                      description: 'Final results finalized and digitally signed by 4/4 authorities.',
                      pulse: 'sa-pulse-green bg-[#056e00]',
                    },
                    {
                      tone: 'red',
                      icon: CloudOff,
                      title: `Tenant: ${tenant.name || 'UK-Local-Borough'}`,
                      time: '32 mins ago',
                      description: 'Secondary database node experienced timeout. Automatic failover successful.',
                    },
                  ];
                  return <ActivityItem key={`${tenant.name || index}-${index}`} {...items[index % items.length]} />;
                })
              )}
            </div>
            <div className="border-t border-[#c4c6d0] bg-[#eeeef4] p-3 text-center">
              <button type="button" onClick={() => navigate('/elections?superadmin=true')} className="text-xs font-semibold uppercase tracking-[0.05em] text-[#1A237E] hover:underline">
                View All Network Activity
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            {/* <section className="rounded-lg border border-[#c4c6d0] bg-white p-4">
              <h2 className="mb-4 border-b border-[#c4c6d0] pb-2 text-xs font-semibold uppercase tracking-widest text-[#44464f]">Node Distribution</h2>
              <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-[#1b1b1f]/5">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle, #1A237E 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                />
                <div className="relative z-10 text-center">
                  <Network className="mx-auto h-12 w-12 text-[#1A237E] opacity-40" />
                  <p className="mt-2 text-[10px] font-bold text-[#1b1b1f]">GLOBAL CLUSTER STATUS: OPTIMAL</p>
                </div>
                <div className="absolute top-1/2 h-1 w-[200%] -rotate-45 animate-spin bg-gradient-to-r from-transparent via-[#1A237E]/20 to-transparent" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['US-East', 'EU-Central'].map((region) => (
                  <div key={region} className="flex flex-col items-center rounded-lg bg-[#eeeef4] p-2">
                    <span className="text-xs text-[#44464f]">{region}</span>
                    <span className="text-sm font-black text-[#056e00]">Active</span>
                  </div>
                ))}
              </div>
            </section> */}

            <section className="flex min-h-[300px] flex-1 flex-col rounded-lg border border-[#c4c6d0] bg-white">
              <div className="border-b border-[#c4c6d0] p-4">
                <h2 className="text-lg font-semibold text-[#1b1b1f]">Audit Logs</h2>
              </div>
              <div className="sa-scrollbar flex-1 overflow-y-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[#c4c6d0] text-[10px] uppercase text-[#44464f]">
                      <th className="p-3 font-bold">Severity</th>
                      <th className="p-3 font-bold">Action</th>
                      <th className="p-3 text-right font-bold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6d0]/30">
                    {[
                      { icon: AlertTriangle, color: 'text-[#ba1a1a]', action: 'Root Access Attempt', time: '14:22:01' },
                      { icon: Info, color: 'text-[#056e00]', action: 'Policy Update: CA-22', time: '14:18:55' },
                      { icon: AlertTriangle, color: 'text-[#683700]', action: 'Resource Cap Alert', time: '14:05:12' },
                      { icon: LockOpen, color: 'text-[#056e00]', action: 'Admin Login: j.smith', time: '13:42:10' },
                      { icon: Info, color: 'text-[#056e00]', action: 'Backup Verification', time: '13:30:00' },
                    ].map(({ icon: Icon, color, action, time }) => (
                      <tr key={`${action}-${time}`} className="transition hover:bg-[#f4f3f7]">
                        <td className="p-3">
                          <Icon className={`h-4 w-4 ${color}`} />
                        </td>
                        <td className="p-3 text-xs font-medium">{action}</td>
                        <td className="p-3 text-right text-[10px] text-[#44464f]">{time}</td>
                      </tr>
                    ))}
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
