import { FaCrown, FaMedal, FaTrophy } from 'react-icons/fa'
import ImageAvatar from './ImageAvatar'

function formatPercent(value) {
  const numeric = Number(value || 0)
  return `${numeric.toFixed(1)}%`
}

function getCandidateName(candidate) {
  return candidate?.candidate_name || candidate?.full_name || candidate?.name || 'Candidate'
}

export default function WinnerCard({
  winner,
  winners = [],
  isTie = false,
  winnerDeclared = false,
  totalVotes = 0,
  electionStatus,
  className = '',
}) {
  const hasVotes = Number(totalVotes || 0) > 0

  if (!winnerDeclared || !winner) {
    return (
      <section className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Winner</p>
            <h2 className="text-lg font-bold text-gray-900">Winner not declared yet</h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center">
            <FaTrophy />
          </div>
        </div>
        <div className="p-5">
          {isTie && winners.length > 1 && hasVotes ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">Tie detected</p>
              <p className="text-sm text-amber-700 mt-1">
                {winners.map(getCandidateName).join(', ')} are tied with {winners[0].vote_count} votes.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {electionStatus === 'closed'
                ? 'No valid winner is available for this election.'
                : 'The winner will appear here after results are declared.'}
            </p>
          )}
        </div>
      </section>
    )
  }

  const name = getCandidateName(winner)

  return (
    <section className={`rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 shadow-lg shadow-amber-100/50 overflow-hidden ${className}`}>
      <div className="relative p-5 sm:p-6">
        <div className="absolute right-5 top-5 hidden sm:flex w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 items-center justify-center shadow-inner">
          <FaCrown className="text-2xl" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pr-0 sm:pr-16">
          <div className="relative w-fit">
            <ImageAvatar
              src={winner.image_url}
              name={name}
              sizeClass="w-24 h-24"
              shapeClass="rounded-2xl"
              imageClassName="ring-4 ring-white shadow-md border border-amber-200"
              fallbackClassName="bg-amber-100 text-amber-700 text-3xl ring-4 ring-white shadow-md"
            />
            <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white shadow-md">
              <FaTrophy />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                <FaCrown className="text-[11px]" />
                Winner
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                <FaMedal className="text-[11px]" />
                Rank #{winner.rank || 1}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">{name}</h2>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/80 border border-white px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase">Votes</p>
                <p className="mt-1 text-xl font-extrabold text-gray-900">{winner.vote_count ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/80 border border-white px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase">Share</p>
                <p className="mt-1 text-xl font-extrabold text-gray-900">{formatPercent(winner.percentage)}</p>
              </div>
              <div className="rounded-xl bg-white/80 border border-white px-4 py-3 shadow-sm col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-400 font-semibold uppercase">Position</p>
                <p className="mt-1 text-xl font-extrabold text-gray-900">#{winner.rank || 1}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
