import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  History,
  Lock,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  Vote,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { fetchElections, fetchElectionStats } from '../store/slices/electionSlice';
import { fetchUserStats } from '../store/slices/userSlice';
import { fetchAuditLogs, selectAuditLogs } from '../store/slices/voteSlice';

function numberFormat(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function timeAgo(dateString) {
  if (!dateString) return '—';
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
        <span className="text-4xl font-black text-gray-900 tracking-tight">{value}</span>
      </div>
      <div className="mt-4 border-t border-gray-50 pt-4">
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { elections, stats: electionStatsRaw, loading: electionsLoading } = useSelector((state) => state.elections);
  const { stats: userStatsRaw, loading: userLoading } = useSelector((state) => state.users);
  const auditLogs = useSelector(selectAuditLogs);

  useEffect(() => {
    dispatch(fetchElections({ limit: 5 }));
    dispatch(fetchElectionStats());
    dispatch(fetchUserStats());
    dispatch(fetchAuditLogs({ limit: 10 }));
  }, [dispatch]);

  const electionStats = electionStatsRaw?.data || electionStatsRaw || {};
  const userStats = userStatsRaw?.data || userStatsRaw || {};

  const logsArray = useMemo(() => {
    return Array.isArray(auditLogs) ? auditLogs : auditLogs?.data || [];
  }, [auditLogs]);

  const chartData = useMemo(() => [
    { name: 'Active', value: electionStats.active || 0, color: '#1a337e' },
    { name: 'Draft', value: electionStats.draft || 0, color: '#9333ea' },
    { name: 'Closed', value: electionStats.closed || 0, color: '#059669' },
    { name: 'Cancelled', value: electionStats.cancelled || 0, color: '#dc2626' },
  ], [electionStats]);

  const totalVoters = userStats.total_voters || 0;
  const activeVoters = userStats.active_voters || 0;
  const pendingUsers = userStats.pending_users || 0;
  
  const turnoutRate = totalVoters ? Math.round((activeVoters / totalVoters) * 100) : 0;

  if (electionsLoading || userLoading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Operations Overview</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Dashboard</h2>
          </div>
          <button
            onClick={() => navigate('/elections')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a337e] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#1a337e] shadow-xl shadow-[#1a337e]/20 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Election
          </button>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard title="Total Voters" value={numberFormat(totalVoters)} icon={Users} tone="blue">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                <span>+4% Growth</span>
             </div>
          </MetricCard>
          
          <MetricCard title="Active Elections" value={numberFormat(electionStats.active)} icon={Vote} tone="indigo">
             <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a337e] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Live now</span>
             </div>
          </MetricCard>

          <MetricCard title="Verified Users" value={`${turnoutRate}%`} icon={UserCheck} tone="emerald">
             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${turnoutRate}%` }} />
             </div>
          </MetricCard>

          <MetricCard title="Pending Review" value={numberFormat(pendingUsers)} icon={ShieldAlert} tone="amber">
             <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Needs action</p>
          </MetricCard>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Elections & Charts */}
          <div className="space-y-8 lg:col-span-8">
            <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
              <div className="flex items-center justify-between border-b border-gray-50 p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#1a337e] border border-indigo-100 shadow-inner">
                    <Vote className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-gray-900">Recent Elections</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Latest updates</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/elections')}
                  className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1a337e] hover:text-[#1a337e] transition-colors"
                >
                  View All
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {elections.length === 0 ? (
                  <div className="py-20 text-center">
                    <Vote className="mx-auto mb-6 h-16 w-16 opacity-10 text-[#1a337e]" />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-300">No elections found</p>
                  </div>
                ) : (
                  elections.slice(0, 3).map((election) => (
                    <button
                      key={election.id}
                      onClick={() => navigate(`/elections/${election.id}`)}
                      className="group flex w-full items-center justify-between gap-6 p-8 text-left transition-all hover:bg-gray-50/50"
                    >
                      <div className="flex min-w-0 items-center gap-6">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-transform group-hover:scale-110 ${
                          election.status === 'active' ? 'bg-indigo-50 text-[#1a337e] border-indigo-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                          <Vote className="h-7 w-7" strokeWidth={2.4} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-black text-gray-900 tracking-tight group-hover:text-[#1a337e] transition-colors">{election.title}</h4>
                          <div className="mt-2 flex items-center gap-4">
                            <Badge status={election.status} />
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                               <Calendar className="h-3.5 w-3.5" />
                               {new Date(election.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden text-right md:block">
                        <p className="text-lg font-black text-gray-900 leading-none">{numberFormat(election.vote_count)}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Total Votes</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
              <div className="mb-8 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black tracking-tight text-gray-900">Election Summary</h3>
                   <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current status graph</p>
                </div>
                <div className="flex gap-4">
                   {chartData.map(d => (
                     <div key={d.name} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] font-black uppercase text-gray-400">{d.name}</span>
                     </div>
                   ))}
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Activity & Pulse */}
          <aside className="space-y-8 lg:col-span-4">
            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                  <Activity size={180} className="text-[#1a337e]" />
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl font-black tracking-tight text-gray-900">Voter Pulse</h3>
                 <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">User activity</p>
                 
                 <div className="flex items-center justify-center h-32 mb-6">
                    <div className="relative flex items-center justify-center">
                       <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - turnoutRate/100)} className="text-[#1a337e] transition-all duration-1000" strokeLinecap="round" />
                       </svg>
                       <span className="absolute text-2xl font-black text-gray-900">{turnoutRate}%</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Users</span>
                       <span className="text-sm font-black text-gray-900">{numberFormat(activeVoters)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pending Users</span>
                       <span className="text-sm font-black text-gray-900">{numberFormat(pendingUsers)}</span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="flex flex-col rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="border-b border-gray-50 p-8">
                <h3 className="text-xl font-black tracking-tight text-gray-900">Recent Activity</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Live stream</p>
              </div>
              <div className="sa-scrollbar flex-1 space-y-2 overflow-y-auto p-4 bg-gray-50/30 max-h-[480px]">
                {logsArray.length === 0 ? (
                  <div className="py-12 text-center">
                     <History className="mx-auto mb-4 h-12 w-12 opacity-10 text-gray-900" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No activity</p>
                  </div>
                ) : (
                  logsArray.slice(0, 8).map((log, i) => (
                    <div key={log.id || i} className="group flex gap-4 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                        log.action?.includes('delete') ? 'bg-red-50 text-red-600 border-red-100' :
                        log.action?.includes('create') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-blue-50 text-[#1a337e] border-blue-100'
                      }`}>
                         <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">
                           {log.action?.replace(/[._]/g, ' ')}
                        </p>
                        <p className="mt-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                           {timeAgo(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-gray-50 bg-white p-4 text-center">
                <button
                  onClick={() => navigate('/audit-logs')}
                  className="text-xs font-black uppercase tracking-widest text-[#1a337e] hover:text-[#1a337e] transition-colors"
                >
                  View More
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
