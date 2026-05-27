import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaVoteYea,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaChevronRight,
  FaHistory
} from 'react-icons/fa';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import MainLayout from '../components/layout/MainLayout';
import StatsCard from '../components/common/StatsCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchElections, fetchElectionStats } from '../store/slices/electionSlice';
import { fetchUserStats } from '../store/slices/userSlice';
import Badge from '../components/common/Badge';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { elections, stats: electionStats, loading: electionsLoading } = useSelector((state) => state.elections);
  const { stats: userStats, loading: userLoading } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchElections({ limit: 5 }));
    dispatch(fetchElectionStats());
    dispatch(fetchUserStats());
  }, [dispatch]);

  const activeElections = elections.filter(e => e.status === 'active');
  
  const electionPieData = electionStats ? [
    { name: 'Draft', value: electionStats.draft || 0 },
    { name: 'Active', value: electionStats.active || 0 },
    { name: 'Closed', value: electionStats.closed || 0 },
    { name: 'Cancelled', value: electionStats.cancelled || 0 },
  ].filter(d => d.value > 0) : [];

  const userBarData = userStats ? [
    { name: 'Active', count: userStats.active_count || 0 },
    { name: 'Pending', count: userStats.pending_count || 0 },
    { name: 'Blocked', count: userStats.blocked_count || 0 },
  ] : [];

  if (electionsLoading || userLoading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard Overview">
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[rgb(16_102_177)]">Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}!</h2>
            <p className="text-sm text-gray-500 mt-1">Here is what is happening with your elections today.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/elections')}
              className="px-4 py-2 text-sm font-semibold text-[rgb(16_102_177)] bg-white border border-[rgb(16_102_177)]/20 rounded-lg hover:bg-[#e6edfb] transition-colors shadow-sm"
            >
              View All
            </button>
            <button
              onClick={() => navigate('/elections')}
              className="px-4 py-2 text-sm font-semibold text-white bg-[rgb(16_102_177)] rounded-lg hover:bg-[rgb(12_85_148)] transition-colors shadow-lg shadow-[rgb(16_102_177)]/20 flex items-center gap-2"
            >
              <FaPlus className="text-xs" />
              New Election
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Voters"
            value={userStats?.total_users || 0}
            icon={FaUsers}
            color="blue"
          />
          <StatsCard
            title="Active Elections"
            value={activeElections.length}
            icon={FaVoteYea}
            color="green"
          />
          <StatsCard
            title="Total Admins"
            value={userStats?.total_admins || 0}
            icon={FaCheckCircle}
            color="blue"
          />
          <StatsCard
            title="Pending Approvals"
            value={userStats?.pending_count || 0}
            icon={FaClock}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Election Status Distribution</h3>
            <div className="h-64">
              {electionPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={electionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {electionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Voter Status Overview</h3>
            <div className="h-64">
              {userBarData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userBarData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="rgb(16 102 177)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Elections */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Recent Elections</h3>
              <button onClick={() => navigate('/elections')} className="text-sm font-bold text-[rgb(16_102_177)] hover:underline">
                See all
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {elections.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <FaVoteYea className="mx-auto h-12 w-12 opacity-10 mb-4" />
                  <p className="text-sm font-medium">No elections found. Create your first one to get started!</p>
                </div>
              ) : (
                elections.slice(0, 5).map((election) => (
                  <div
                    key={election.id}
                    onClick={() => navigate(`/elections/${election.id}`)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#e6edfb] flex items-center justify-center text-[rgb(16_102_177)] font-bold group-hover:bg-[rgb(16_102_177)] group-hover:text-white transition-colors border border-[rgb(16_102_177)]/10">
                        {election.title.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{election.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(election.start_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge status={election.status} />
                      <FaChevronRight className="text-gray-300 group-hover:text-[rgb(16_102_177)] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions / Activity */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Platform Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">System Health</span>
                  <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Blockchain Network</span>
                  <span className="text-xs font-bold text-[rgb(16_102_177)]">Secure Protocol v2.4</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => navigate('/audit-logs')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl border border-gray-200 transition-colors"
                >
                  <FaHistory className="text-gray-400" />
                  System Audit Logs
                </button>
              </div>
            </div>

            <div className="bg-[rgb(16_102_177)] p-6 rounded-2xl shadow-xl shadow-[rgb(16_102_177)]/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FaUsers size={80} className="text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-white font-bold text-lg mb-2">Voter Approvals</h3>
                <p className="text-[rgb(16_102_177)]/10 text-sm mb-4 leading-relaxed">You have {userStats?.pending_count || 0} pending voter registrations to review.</p>
                <button
                  onClick={() => navigate('/users?status=pending')}
                  className="px-4 py-2 bg-white text-[rgb(16_102_177)] text-xs font-bold rounded-lg hover:bg-[#e6edfb] transition-colors"
                >
                  Review Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
