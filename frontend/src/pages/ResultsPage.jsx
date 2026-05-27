import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { FaChartPie, FaTrophy, FaVoteYea, FaUsers } from 'react-icons/fa'
import MainLayout from '../components/layout/MainLayout'
import StatsCard from '../components/common/StatsCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { fetchElections } from '../store/slices/electionSlice'
import { fetchElectionResults } from '../store/slices/candidateSlice'
import ImageAvatar from '../components/common/ImageAvatar'
import Badge from '../components/common/Badge'

const COLORS = ['rgb(16 102 177)', '#3b82f6', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777']

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch()
  
  const { elections } = useSelector((state) => state.elections)
  const { results, loading } = useSelector((state) => state.candidates)
  
  const electionId = searchParams.get('election') || ''

  useEffect(() => {
    dispatch(fetchElections({}))
  }, [dispatch])

  useEffect(() => {
    if (electionId) {
      dispatch(fetchElectionResults(electionId))
    }
  }, [electionId, dispatch])

  const selectedElection = elections.find(e => String(e.id) === String(electionId))
  
  const chartData = (results?.candidates || []).map(c => ({
    name: c.candidate_name,
    votes: c.vote_count,
    percentage: c.percentage
  }))

  const pieData = (results?.candidates || []).map(c => ({
    name: c.candidate_name,
    value: c.vote_count
  }))

  const winners = results?.winners || []
  const isTie = results?.is_tie
  const winnerDeclared = results?.winner_declared

  return (
    <MainLayout title="Election Results">
      <div className="space-y-6">
        {/* Election Selector */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Election to View Results</label>
          <select
            value={electionId}
            onChange={(e) => setSearchParams({ election: e.target.value })}
            className="w-full sm:w-96 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)]"
          >
            <option value="">-- Choose an election --</option>
            {elections.map(e => (
              <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
            ))}
          </select>
        </div>

        {!electionId ? (
          <EmptyState
            icon={<FaVoteYea className="h-12 w-12 text-gray-300" />}
            title="No Election Selected"
            message="Please select an election from the dropdown above to view its live results and statistics."
          />
        ) : loading ? (
          <LoadingSpinner message="Loading results..." />
        ) : !results || results.total_votes === 0 ? (
          <EmptyState
            icon={<FaVoteYea className="h-12 w-12 text-gray-300" />}
            title="No Votes Yet"
            message="There are no votes cast for this election yet. Results will appear once voting begins."
            action={
              selectedElection?.status === 'draft' && (
                <Badge status="draft" />
              )
            }
          />
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard title="Total Votes" value={results.total_votes} icon={FaVoteYea} color="indigo" />
              <StatsCard title="Candidates" value={results.candidates?.length || 0} icon={FaUsers} color="blue" />
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                  <FaTrophy size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    <Badge status={selectedElection?.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Section */}
            {winnerDeclared && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border-4 border-white shadow-md">
                    <FaTrophy size={40} />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">
                      {isTie ? 'Election Result: Tie' : 'Winner Declared'}
                    </h2>
                    <p className="text-amber-700 font-medium">
                      {isTie 
                        ? `A tie has occurred between ${winners.map(w => w.candidate_name).join(' and ')}.`
                        : `Congratulations to ${results.winner.candidate_name} for winning the election.`
                      }
                    </p>
                  </div>
                  {!isTie && results.winner && (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-sm">
                      <ImageAvatar name={results.winner.candidate_name} sizeClass="w-10 h-10" />
                      <div>
                        <p className="font-bold text-gray-900">{results.winner.candidate_name}</p>
                        <p className="text-xs text-gray-500">{results.winner.vote_count} votes ({results.winner.percentage.toFixed(1)}%)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaChartPie className="text-[rgb(16_102_177)]" />
                  Vote Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaVoteYea className="text-[rgb(16_102_177)]" />
                  Vote Counts
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600 }} />
                      <Tooltip />
                      <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Votes</th>
                    <th className="px-6 py-4">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(results.candidates || []).slice().sort((a, b) => b.vote_count - a.vote_count).map((c, i) => (
                    <tr key={c.candidate_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{c.candidate_name}</td>
                      <td className="px-6 py-4 font-mono text-gray-600">{c.vote_count.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[100px]">
                            <div 
                              className="h-2 rounded-full transition-all duration-1000" 
                              style={{ width: `${c.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                          <span className="font-bold text-gray-700">{c.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
