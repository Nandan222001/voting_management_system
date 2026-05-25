import { useEffect, useState } from 'react'
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
import Badge from '../components/common/Badge'
import { fetchElections } from '../store/slices/electionSlice'
import { fetchElectionResults } from '../store/slices/candidateSlice'
import { getInitials } from '../utils/helpers'

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777']

export default function ResultsPage() {
  const dispatch = useDispatch()
  const { elections } = useSelector(s => s.elections)
  const { results, loading } = useSelector(s => s.candidates)

  const [selectedElectionId, setSelectedElectionId] = useState('')

  useEffect(() => {
    dispatch(fetchElections({}))
  }, [dispatch])

  useEffect(() => {
    if (selectedElectionId) {
      dispatch(fetchElectionResults(selectedElectionId))
    }
  }, [selectedElectionId, dispatch])

  const selectedElection = elections.find(e => String(e.id) === String(selectedElectionId))
  const candidates = results?.candidates || []
  const totalVotes = results?.total_votes || 0

  const winner = candidates.reduce((best, c) =>
    (!best || c.vote_count > best.vote_count) ? c : best, null
  )

  const chartData = candidates.map(c => ({
    name: c.candidate_name,
    party: c.party,
    votes: c.vote_count,
    percentage: parseFloat(c.percentage.toFixed(1))
  }))

  const pieData = candidates.filter(c => c.vote_count > 0).map(c => ({
    name: `${c.candidate_name} (${c.party})`,
    value: c.vote_count
  }))

  return (
    <MainLayout title="Results & Reports">
      <div className="space-y-6">
        {/* Election selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Election</label>
            <FancySelect
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              options={[{ value: '', label: '-- Choose an election to view results --' }, ...elections.map(e => ({ value: e.id, label: `${e.title} (${e.status})` }))]}
            />
        </div>

        {!selectedElectionId ? (
          <EmptyState
            icon={FaChartPie}
            title="Select an Election"
            message="Choose an election above to view detailed results and analytics."
          />
        ) : loading ? (
          <LoadingSpinner message="Loading results..." />
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard title="Total Votes" value={totalVotes} icon={FaVoteYea} color="indigo" />
              <StatsCard title="Candidates" value={candidates.length} icon={FaUsers} color="blue" />
              <StatsCard
                title="Participation"
                value={results?.participation_rate ? `${results.participation_rate.toFixed(1)}%` : `${totalVotes}`}
                icon={FaChartPie}
                color="green"
              />
              <StatsCard
                title="Winner"
                value={winner ? winner.candidate_name.split(' ')[0] : '—'}
                icon={FaTrophy}
                color="yellow"
              />
            </div>

            {/* Winner banner */}
            {winner && totalVotes > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-5 flex items-center gap-4">
                <FaTrophy className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide">Leading Candidate</p>
                  <p className="text-xl font-bold text-gray-900">{winner.candidate_name}</p>
                  <p className="text-sm text-gray-600">{winner.party} · {winner.vote_count} votes ({winner.percentage.toFixed(1)}%)</p>
                </div>
                <div className="ml-auto">
                  <Badge status={selectedElection?.status} />
                </div>
              </div>
            )}

            {/* Charts */}
            {chartData.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Bar chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Votes by Candidate</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Vote Share</h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="45%" outerRadius={90} dataKey="value" label={({ percentage }) => `${(percentage * 100).toFixed(0)}%`}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No votes cast yet</div>
                  )}
                </div>
              </div>
            )}

            {/* Results table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Detailed Results</h3>
              </div>
              {candidates.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No candidates in this election.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {candidates
                    .slice()
                    .sort((a, b) => b.vote_count - a.vote_count)
                    .map((c, i) => (
                      <div key={c.candidate_id} className="flex items-center gap-4 px-6 py-4">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i === 0 && totalVotes > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt={c.candidate_name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-xs font-bold ring-1 ring-indigo-100 shrink-0">
                            {getInitials(c.candidate_name)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{c.candidate_name}</p>
                          <p className="text-xs text-gray-500">{c.party}</p>
                        </div>
                        <div className="w-40 hidden md:block">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{c.vote_count} votes</span>
                            <span>{c.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${c.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{c.vote_count}</p>
                          <p className="text-xs text-gray-500">{c.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
