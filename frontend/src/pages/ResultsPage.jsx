import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
import FancySelect from '../components/common/FancySelect'
import ImageAvatar from '../components/common/ImageAvatar'
import WinnerCard from '../components/common/WinnerCard'

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777']

export default function ResultsPage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { elections } = useSelector(s => s.elections)
  const { results, loading } = useSelector(s => s.candidates)

  const [selectedElectionId, setSelectedElectionId] = useState(id || searchParams.get('election') || '')

  useEffect(() => {
    const requestedElectionId = id || searchParams.get('election') || ''
    if (requestedElectionId) setSelectedElectionId(requestedElectionId)
  }, [id, searchParams])

  useEffect(() => {
    dispatch(fetchElections({}))
  }, [dispatch])

  useEffect(() => {
    if (selectedElectionId) {
      dispatch(fetchElectionResults(selectedElectionId))
    }
  }, [selectedElectionId, dispatch])

  const selectedElection = elections.find(e => String(e.id) === String(selectedElectionId))
  const candidates = (results?.candidates || [])
    .slice()
    .sort((a, b) => (a.rank || 999) - (b.rank || 999) || b.vote_count - a.vote_count)
  const totalVotes = results?.total_votes || 0

  const winner = results?.winner || null
  const winnerDeclared = Boolean(results?.winner_declared && winner)

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
                value={winnerDeclared ? winner.candidate_name.split(' ')[0] : '—'}
                icon={FaTrophy}
                color="yellow"
              />
            </div>

            <WinnerCard
              winner={winner}
              winners={results?.winners || []}
              isTie={results?.is_tie}
              winnerDeclared={winnerDeclared}
              totalVotes={totalVotes}
              electionStatus={selectedElection?.status}
            />

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
                  {candidates.map((c, i) => (
                      <div key={c.candidate_id} className={`flex items-center gap-4 px-6 py-4 ${c.is_winner ? 'bg-amber-50/60' : ''}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${c.is_winner ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          #{c.rank || i + 1}
                        </span>
                        
                        <ImageAvatar
                          src={c.image_url}
                          name={c.candidate_name}
                          sizeClass="w-9 h-9"
                          imageClassName="ring-1 ring-gray-100"
                          fallbackClassName="bg-indigo-50 text-indigo-700 text-xs ring-1 ring-indigo-100"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{c.candidate_name}</p>
                            {c.is_winner && (
                              <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Winner
                              </span>
                            )}
                          </div>
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
