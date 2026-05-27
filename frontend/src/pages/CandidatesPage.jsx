import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaExternalLinkAlt, FaUserTie } from 'react-icons/fa'
import MainLayout from '../components/layout/MainLayout'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { fetchElections } from '../store/slices/electionSlice'
import { fetchCandidatesByElection, fetchElectionResults } from '../store/slices/candidateSlice'

export default function CandidatesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { elections } = useSelector(s => s.elections)
  const { candidates, results, loading } = useSelector(s => s.candidates)

  const [selectedElectionId, setSelectedElectionId] = useState('')

  useEffect(() => {
    dispatch(fetchElections({}))
  }, [dispatch])

  useEffect(() => {
    if (selectedElectionId) {
      dispatch(fetchCandidatesByElection(selectedElectionId))
      dispatch(fetchElectionResults(selectedElectionId))
    }
  }, [selectedElectionId, dispatch])

  const selectedElection = elections.find(e => String(e.id) === String(selectedElectionId))

  function getResult(candidateId) {
    return results?.candidates?.find(r => r.candidate_id === candidateId)
  }

  const winner = results?.candidates?.reduce((best, c) =>
    (!best || c.vote_count > best.vote_count) ? c : best, null
  )

  return (
    <MainLayout title="Candidates">
      <div className="space-y-6">
        {/* Election selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Election</label>
          <div className="flex gap-4 items-center">
            <select
              value={selectedElectionId}
              onChange={e => setSelectedElectionId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose an election --</option>
              {elections.map(e => (
                <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
              ))}
            </select>
            {selectedElection && (
              <button
                onClick={() => navigate(`/elections/${selectedElectionId}`)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#1B4FD8] border border-indigo-300 rounded-lg hover:bg-blue-50"
              >
                <FaExternalLinkAlt className="h-3 w-3" /> View Election
              </button>
            )}
          </div>
        </div>

        {/* Candidates grid */}
        {!selectedElectionId ? (
          <EmptyState
            icon={<FaUserTie className="h-12 w-12 text-gray-300" />}
            title="Select an Election"
            message="Choose an election above to view its candidates."
          />
        ) : loading ? (
          <LoadingSpinner message="Loading candidates..." />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={<FaUserTie className="h-12 w-12 text-gray-300" />}
            title="No Candidates"
            message="No candidates have been added to this election yet."
            action={
              selectedElection?.status === 'draft' && (
                <button
                  onClick={() => navigate(`/elections/${selectedElectionId}`)}
                  className="px-4 py-2 bg-[#1B4FD8] text-white text-sm rounded-lg hover:bg-[#1640B8]"
                >
                  Add Candidates
                </button>
              )
            }
          />
        ) : (
          <div>
            {/* Summary row */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {candidates.length} Candidates · {selectedElection?.title}
              </h2>
              <div className="flex items-center gap-3">
                <Badge status={selectedElection?.status} />
                {results?.total_votes > 0 && (
                  <span className="text-sm text-gray-500">{results.total_votes} total votes</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {candidates.map((c, i) => {
                const result = getResult(c.id)
                const isWinner = winner && c.id === winner.candidate_id && results?.total_votes > 0
                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-lg border p-5 relative ${isWinner ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-gray-200'}`}
                  >
                    {isWinner && (
                      <span className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                        Leading
                      </span>
                    )}
                    <div className="flex items-center gap-4 mb-3">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.full_name} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-[#1B4FD8] text-xl font-bold">
                          {c.symbol || c.full_name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{c.full_name}</p>
                        <p className="text-sm text-[#1B4FD8]">{c.party}</p>
                        {c.symbol && <p className="text-xs text-gray-400">Symbol: {c.symbol}</p>}
                      </div>
                    </div>

                    {c.bio && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.bio}</p>
                    )}

                    {result && (
                      <div>
                        <div className="flex justify-between text-sm text-gray-700 mb-1">
                          <span className="font-medium">{result.vote_count} votes</span>
                          <span>{result.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
