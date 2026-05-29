import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowUp,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaFilter,
  FaHistory,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaUserCheck,
  FaUsers,
  FaVoteYea,
} from 'react-icons/fa';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { fetchElections, fetchElectionStats } from '../store/slices/electionSlice';
import { fetchUserStats } from '../store/slices/userSlice';

const velocityBars = [40, 55, 65, 85, 95, 70, 45, 40, 30, 25];

const activityItems = [
  {
    tone: 'bg-[#003d9b] ring-[#dae2ff]',
    title: 'Region 7',
    text: 'ballot records synchronized with central registry.',
    time: '2 mins ago',
  },
  {
    tone: 'bg-[#056e00] ring-[#8dfc75]/40',
    title: 'Security Audit',
    text: 'completed for District 12 infrastructure.',
    time: '14 mins ago',
  },
  {
    tone: 'bg-[#ba1a1a] ring-[#ffdad6]',
    title: 'Anomalous Activity',
    text: 'detected in Precinct 4 and resolved.',
    time: '45 mins ago',
  },
  {
    tone: 'bg-[#737685] ring-[#e1e2e4]',
    title: 'Credential Issued',
    text: 'for a new election moderator.',
    time: '1 hr ago',
  },
];

const precinctRows = [
  {
    jurisdiction: 'Precinct 001 - Downtown',
    overseer: 'Sarah Jenkins',
    status: 'Operational',
    sync: 'Real-time',
    reporting: '98.2%',
    delayed: false,
  },
  {
    jurisdiction: 'Precinct 042 - Valley West',
    overseer: 'Michael Chen',
    status: 'Operational',
    sync: 'Real-time',
    reporting: '94.0%',
    delayed: false,
  },
  {
    jurisdiction: 'Precinct 109 - River North',
    overseer: 'Elena Rodriguez',
    status: 'Delayed Sync',
    sync: '12m Lag',
    reporting: '82.5%',
    delayed: true,
  },
];

function numberValue(...values) {
  return values.find((value) => typeof value === 'number') ?? 0;
}

function compactNumber(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return 'Date pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date pending' : date.toLocaleDateString();
}

function StatTile({ label, value, children }) {
  return (
    <div className="flex flex-col rounded-lg border border-[#c3c6d6] bg-white p-4">
      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#434654]">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="text-3xl font-black leading-10 text-[#003d9b]">{value}</span>
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { elections, stats: electionStats, loading: electionsLoading } = useSelector((state) => state.elections);
  const { stats: userStats, loading: userLoading } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchElections({ limit: 5 }));
    dispatch(fetchElectionStats());
    dispatch(fetchUserStats());
  }, [dispatch]);

  const activeElections = elections.filter((election) => election.status === 'active');
  const totalVoters = numberValue(userStats?.total_users, userStats?.total_voters, userStats?.active_voters);
  const pendingApprovals = numberValue(userStats?.pending_users, userStats?.pending_count);
  const blockedUsers = numberValue(userStats?.blocked_users, userStats?.blocked_count);
  const turnoutRate = totalVoters ? Math.min(99, Math.round(((totalVoters - pendingApprovals - blockedUsers) / totalVoters) * 100)) : 0;

  if (electionsLoading || userLoading) {
    return (
      <MainLayout title="Election Operations">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Election Operations">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatTile label="Total Voters" value={compactNumber(totalVoters)}>
            <span className="mb-1 flex items-center gap-1 text-xs font-bold text-[#056e00]">
              <FaArrowUp className="h-3 w-3" /> +2.4%
            </span>
          </StatTile>
          <StatTile label="Active Elections" value={activeElections.length}>
            <span className="rounded bg-[#8dfc75] px-2 py-0.5 text-xs font-bold uppercase text-[#035300]">On Track</span>
          </StatTile>
          <StatTile label="Turnout Rate" value={`${turnoutRate}%`}>
            <div className="mb-3 h-2 w-24 overflow-hidden rounded-full bg-[#edeef0]">
              <div className="h-full bg-[#003d9b]" style={{ width: `${turnoutRate}%` }} />
            </div>
          </StatTile>
          <StatTile label="System Uptime" value="99.98%">
            <span className="mb-1 text-xs font-bold uppercase text-[#056e00]">Stable</span>
          </StatTile>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-[#c3c6d6] bg-white">
              <div className="flex items-center justify-between border-b border-[#c3c6d6] bg-[#f3f4f6] px-6 py-4">
                <h2 className="text-lg font-semibold text-[#191c1e]">Active Elections</h2>
                <button
                  type="button"
                  onClick={() => navigate('/elections')}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#003d9b] hover:underline"
                >
                  View Registry <FaChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="divide-y divide-[#c3c6d6]">
                {elections.length === 0 ? (
                  <div className="p-12 text-center text-[#737685]">
                    <FaVoteYea className="mx-auto mb-4 h-12 w-12 opacity-20" />
                    <p className="text-sm font-medium">No elections found.</p>
                  </div>
                ) : (
                  elections.slice(0, 2).map((election) => (
                    <button
                      key={election.id || election._id}
                      type="button"
                      onClick={() => navigate(`/elections/${election.id || election._id}`)}
                      className="flex w-full items-center justify-between gap-4 p-6 text-left transition hover:bg-[#f8f9fb]"
                    >
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#edeef0] text-[#003d9b]">
                          {election.status === 'active' ? <FaUserCheck className="h-6 w-6" /> : <FaCalendarAlt className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-[#191c1e]">{election.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <Badge status={election.status} />
                            <span className="text-sm text-[#434654]">{formatDate(election.election_date || election.start_date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-bold text-[#003d9b]">{compactNumber(election.vote_count || 0)} Votes</p>
                        <p className="text-xs font-semibold uppercase text-[#434654]">Participation</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[#c3c6d6] bg-white p-6">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold text-[#191c1e]">Participation Velocity</h2>
                  <p className="text-sm text-[#434654]">Hourly voter check-ins across all districts</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#434654]">
                  <span className="h-3 w-3 rounded-full bg-[#003d9b]" />
                  Actual
                  <span className="ml-2 h-3 w-3 rounded-full border-2 border-dashed border-[#003d9b]" />
                  Projected
                </div>
              </div>
              <div className="relative flex h-48 w-full items-end gap-2 border-b border-l border-[#c3c6d6] px-4">
                {velocityBars.map((height, index) => (
                  <div
                    key={`${height}-${index}`}
                    className={`flex-1 rounded-t-sm transition hover:bg-[#003d9b]/50 ${
                      index > 6 ? 'border-t-2 border-dashed border-[#003d9b]' : index === 4 ? 'bg-[#003d9b]' : 'bg-[#003d9b]/25'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between px-4 text-xs font-semibold text-[#434654]">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((time) => (
                  <span key={time}>{time}</span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-[#c3c6d6] bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#191c1e]">Membership Pulse</h2>
              <div className="relative mb-6 h-32 overflow-hidden rounded bg-[#f3f4f6]">
                <div className="absolute inset-x-5 bottom-8 h-20 border-b border-l border-[#c3c6d6]">
                  <div className="absolute bottom-5 left-0 h-10 w-full rounded-t-full border-t-4 border-[#003d9b]/40" />
                  <div className="absolute bottom-2 left-1/4 h-16 w-3/4 rounded-t-full border-t-4 border-[#003d9b]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-black text-[#003d9b]">+{compactNumber(numberValue(userStats?.active_voters, userStats?.active_count))}</span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#434654]">Registered</span><span className="font-bold">{totalVoters.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#434654]">Pending Approval</span><span className="font-bold">{pendingApprovals.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#434654]">Conversion</span><span className="font-bold text-[#056e00]">{turnoutRate}%</span></div>
              </div>
            </div>

            <div className="flex max-h-[500px] flex-col rounded-lg border border-[#c3c6d6] bg-white">
              <div className="border-b border-[#c3c6d6] px-6 py-4">
                <h2 className="text-lg font-semibold text-[#191c1e]">Recent Activities</h2>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {activityItems.map((item) => (
                  <div key={`${item.title}-${item.time}`} className="flex gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ring-4 ${item.tone}`} />
                    <div>
                      <p className="text-sm text-[#191c1e]"><span className="font-bold">{item.title}</span> {item.text}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#434654]">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/audit-logs')}
                className="w-full bg-[#e7e8ea] py-3 text-[10px] font-bold uppercase tracking-widest text-[#434654] transition hover:bg-[#e1e2e4]"
              >
                View Full Audit Log
              </button>
            </div>
          </aside>
        </section>

         
      </div>
    </MainLayout>
  );
}
