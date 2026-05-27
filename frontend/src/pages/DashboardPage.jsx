import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaVoteYea,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaChartBar,
  FaUserCog,
  FaShieldAlt,
  FaArrowRight,
} from 'react-icons/fa';
import { fetchDashboardOverview, selectDashboardOverview, selectVoteLoading } from '../store/slices/voteSlice';
import { fetchElections, selectElections, selectElectionLoading } from '../store/slices/electionSlice';
import StatsCard from '../components/common/StatsCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format, parseISO } from 'date-fns';

function safeFormat(dateStr) {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr || '—';
  }
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const overview = useSelector(selectDashboardOverview);
  const dashLoading = useSelector(selectVoteLoading);
  const elections = useSelector(selectElections);
  const elecLoading = useSelector(selectElectionLoading);

  useEffect(() => {
    dispatch(fetchDashboardOverview());
    dispatch(fetchElections({ limit: 5, page: 1 }));
  }, [dispatch]);

  // Stats derived from overview or fallback to computed
  const stats = {
    totalUsers: overview?.total_users ?? overview?.totalUsers ?? 0,
    activeElections: overview?.active_elections ?? overview?.activeElections ?? 0,
    totalVotes: overview?.total_votes ?? overview?.totalVotes ?? 0,
    pendingApprovals: overview?.pending_approvals ?? overview?.pendingApprovals ?? 0,
  };

  const recentElections = elections.slice(0, 5);

  const quickActions = [
    { label: 'Create Election', icon: FaPlus, color: 'bg-[#1B4FD8] hover:bg-[#1640B8]', path: '/elections' },
    { label: 'Manage Users', icon: FaUserCog, color: 'bg-blue-600 hover:bg-blue-700', path: '/users' },
    { label: 'View Results', icon: FaChartBar, color: 'bg-green-600 hover:bg-green-700', path: '/results' },
    { label: 'Audit Logs', icon: FaShieldAlt, color: 'bg-purple-600 hover:bg-purple-700', path: '/audit-logs' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <button
          onClick={() => navigate('/elections')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4FD8] text-white text-sm font-semibold rounded-lg hover:bg-[#1640B8] transition-colors shadow-sm"
        >
          <FaPlus className="text-xs" />
          New Election
        </button>
      </div>

      {/* Stats Grid */}
      {dashLoading && !overview ? (
        <LoadingSpinner message="Loading dashboard..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={FaUsers}
            color="indigo"
            change={overview?.user_growth ?? overview?.userGrowth ?? null}
          />
          <StatsCard
            title="Active Elections"
            value={stats.activeElections}
            icon={FaVoteYea}
            color="green"
            change={null}
          />
          <StatsCard
            title="Total Votes Cast"
            value={stats.totalVotes}
            icon={FaCheckCircle}
            color="blue"
            change={overview?.vote_growth ?? overview?.voteGrowth ?? null}
          />
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={FaClock}
            color="orange"
            change={null}
          />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Elections */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Recent Elections</h3>
            <button
              onClick={() => navigate('/elections')}
              className="flex items-center gap-1 text-[#1B4FD8] text-sm font-semibold hover:text-[#1B4FD8] transition-colors"
            >
              View all
              <FaArrowRight className="text-xs" />
            </button>
          </div>

          {elecLoading ? (
            <LoadingSpinner message="Loading elections..." />
          ) : recentElections.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              <FaVoteYea className="text-3xl mx-auto mb-2 opacity-30" />
              <p className="text-sm">No elections found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentElections.map((election) => {
                const id = election._id || election.id;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/elections/${id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FaVoteYea className="text-[#1B4FD8] text-sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#1B4FD8] transition-colors">
                          {election.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {safeFormat(election.start_date || election.startDate)} &mdash;{' '}
                          {safeFormat(election.end_date || election.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge status={election.status} />
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {election.candidates_count ?? election.candidatesCount ?? 0} candidates
                      </span>
                      <FaArrowRight className="text-gray-300 text-xs group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105 hover:shadow-md ${color}`}
              >
                <Icon className="text-xl" />
                <span className="text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {/* System Status */}
          <div className="border-t border-gray-100 px-6 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              System Status
            </p>
            <div className="space-y-2">
              {[
                { label: 'API Server', status: 'Operational' },
                { label: 'Database', status: 'Operational' },
                { label: 'Vote Service', status: 'Operational' },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
