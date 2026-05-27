import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { FaArrowLeft, FaPlus, FaTrophy } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Modal from '../components/common/Modal'
import FancySelect from '../components/common/FancySelect'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import useAuth from '../hooks/useAuth'
import { fetchElectionById } from '../store/slices/electionSlice'
import {
  fetchCandidatesByElection,
  fetchElectionResults,
  addCandidate,
  updateCandidate,
  deleteCandidate
} from '../store/slices/candidateSlice'
import { fetchCandidateCommittees } from '../store/slices/candidateCommitteeSlice'
import { fetchTargets } from '../store/slices/targetSlice'
import ImageUpload from '../components/common/ImageUpload'
import ImageAvatar from '../components/common/ImageAvatar'
import WinnerCard from '../components/common/WinnerCard'
import TableActions from '../components/common/TableActions'

const CHART_COLORS = ['#0051D5', '#3b82f6', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626']

const emptyForm = { full_name: '', symbol: '', bio: '', image_url: '', image_file: null, committee_id: '', target_id: '' }

export default function ElectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAdmin } = useAuth()

  const { currentElection, loading: electionLoading } = useSelector(s => s.elections)
  const { candidates, results, loading: candLoading } = useSelector(s => s.candidates)
  const { committees } = useSelector(s => s.candidateCommittees)
  const { targets } = useSelector(s => s.targets)

  const [showModal, setShowModal] = useState(false)
  const [editCandidateTarget, setEditCandidateTarget] = useState(null)
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchElectionById(id))
    dispatch(fetchCandidatesByElection(id))
    dispatch(fetchElectionResults(id))
    dispatch(fetchCandidateCommittees())
    dispatch(fetchTargets())
  }, [id, dispatch])

  function openCreate() {
    setEditCandidateTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(c) {
    setEditCandidateTarget(c)
    setForm({
      full_name: c.full_name,
      symbol: c.symbol,
      bio: c.bio || '',
      image_url: c.image_url || '',
      image_file: null,
      committee_id: c.committee_id || '',
      target_id: c.target_id || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      let payload = form
      if (form.image_file) {
        payload = new FormData()
        payload.append('full_name', form.full_name)
        payload.append('symbol', form.symbol || '')
        payload.append('bio', form.bio || '')
        if (form.committee_id) payload.append('committee_id', String(form.committee_id))
        if (form.target_id) payload.append('target_id', String(form.target_id))
        payload.append('image', form.image_file)
        if (!editCandidateTarget) payload.append('election_id', String(parseInt(id)))
      } else {
        const copy = { ...form }
        delete copy.image_file
        payload = copy
      }

      if (editCandidateTarget) {
        await dispatch(updateCandidate({ id: editCandidateTarget.id, data: payload })).unwrap()
        toast.success('Candidate updated')
      } else {
        await dispatch(addCandidate(payload instanceof FormData ? payload : { ...payload, election_id: parseInt(id) })).unwrap()
        toast.success('Candidate added')
      }
      setShowModal(false)
      dispatch(fetchCandidatesByElection(id))
      dispatch(fetchElectionResults(id))
    } catch (err) {
      toast.error(err?.message || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteCandidate(deleteCandidateTarget.id)).unwrap()
      toast.success('Candidate removed')
      setDeleteCandidateTarget(null)
      dispatch(fetchCandidatesByElection(id))
      dispatch(fetchElectionResults(id))
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const showResults = currentElection?.status === 'active' || currentElection?.status === 'closed'
  const rankedResults = (results?.candidates || [])
    .slice()
    .sort((a, b) => (a.rank || 999) - (b.rank || 999) || b.vote_count - a.vote_count)
  const totalVotes = results?.total_votes ?? 0
  const winnerDeclared = Boolean(results?.winner_declared && results?.winner)
  const chartData = rankedResults.map(c => ({
    name: c.candidate_name,
    votes: c.vote_count,
    percentage: c.percentage
  }))
  const displayCandidates = rankedResults.length > 0
    ? rankedResults.map(result => ({
        ...candidates.find(c => c.id === result.candidate_id),
        ...result,
        id: result.candidate_id,
        full_name: result.candidate_name,
      }))
    : candidates

  if (electionLoading) return <MainLayout title="Election Detail"><LoadingSpinner message="Loading election..." /></MainLayout>

  return (
    <MainLayout title="Election Detail">
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/elections')} className="text-gray-500 hover:text-gray-700">
            <FaArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{currentElection?.title}</h1>
            <p className="text-sm text-gray-500">{currentElection?.description}</p>
          </div>
          <Badge status={currentElection?.status} />
        </div>

        {/* Election info cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: <Badge status={currentElection?.status} /> },
            { label: 'Target Area', value: currentElection?.target ? `${currentElection.target.name} (${currentElection.target.type})` : 'All Regions' },
            { label: 'Start Date', value: currentElection?.start_date ? new Date(currentElection.start_date).toLocaleDateString() : '—' },
            { label: 'Total Votes', value: totalVotes },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <div className="mt-1 text-sm font-semibold text-gray-900 truncate">{value}</div>
            </div>
          ))}
        </div>

        <WinnerCard
          winner={results?.winner}
          winners={results?.winners || []}
          isTie={results?.is_tie}
          winnerDeclared={winnerDeclared}
          totalVotes={totalVotes}
          electionStatus={currentElection?.status}
        />

        {/* Results chart */}
        {showResults && chartData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, n) => [v, n === 'votes' ? 'Votes' : '%']} />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Candidates section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
            Candidates ({displayCandidates.length})
            </h2>
            {isAdmin && currentElection?.status === 'draft' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-[#0051D5] text-white text-sm font-medium rounded-lg hover:bg-[#0051D5]"
              >
                <FaPlus className="h-4 w-4" /> Add Candidate
              </button>
            )}
          </div>

          {candLoading ? (
            <LoadingSpinner message="Loading candidates..." />
          ) : displayCandidates.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No candidates added yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {displayCandidates.map((c, i) => {
                const result = rankedResults.find(r => r.candidate_id === c.id)
                const isWinner = Boolean(result?.is_winner)
                return (
                  <div
                    key={c.id}
                    className={`border rounded-xl p-4 relative transition-shadow ${
                      isWinner
                        ? 'border-amber-300 bg-amber-50/40 shadow-md shadow-amber-100'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      isWinner ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                    }`}>
                      #{result?.rank || i + 1}
                    </div>
                    {isWinner && (
                      <span className="absolute top-12 right-3 text-amber-500"><FaTrophy /></span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <ImageAvatar
                        src={c.image_url || result?.image_url}
                        name={c.full_name}
                        sizeClass="w-12 h-12"
                        imageClassName="ring-1 ring-gray-200"
                        fallbackClassName="bg-gray-200 text-gray-900 text-lg"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.full_name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {isWinner && (
                            <span className="text-[10px] text-white bg-amber-500 px-1.5 py-0.5 rounded font-bold uppercase">
                              Winner
                            </span>
                          )}
                          {c.committee && (
                            <span className="text-[10px] text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded font-medium truncate italic">
                              {c.committee.name}
                            </span>
                          )}
                          {c.target && (
                            <span className="text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded font-medium truncate border border-gray-100">
                              {c.target.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {c.bio && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.bio}</p>}
                    {result && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{result.vote_count} votes</span>
                          <span>{result.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="rounded-full h-2"
                            style={{ width: `${result.percentage}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </div>
                      </div>
                    )}
                    {isAdmin && currentElection?.status === 'draft' && (
                      <div className="flex justify-end">
                        <TableActions
                          actions={[
                            { key: 'edit', label: 'Edit', onClick: () => openEdit(c) },
                            { key: 'delete', label: 'Remove', danger: true, onClick: () => setDeleteCandidateTarget(c) },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCandidateTarget ? 'Edit Candidate' : 'Add Candidate'}>
        <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { name: 'full_name', label: 'Full Name', required: true },
                    { name: 'symbol', label: 'Symbol / Initial', required: false },
                  ].map(({ name, label, required }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="text"
                        value={form[name]}
                        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                        required={required}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <ImageUpload
                      file={form.image_file}
                      existingUrl={form.image_url}
                      onFileChange={(f) => setForm(prev => ({ ...prev, image_file: f }))}
                      id="election-candidate-image-input"
                    />
                  </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <FancySelect
                value={form.committee_id}
                onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                options={[{ value: '', label: '-- No specific committee --' }, ...committees.map(c => ({ value: c.id, label: c.name }))]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target / Area</label>
              <FancySelect
                value={form.target_id}
                onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}
                options={[{ value: '', label: '-- No specific area --' }, ...targets.map(t => ({ value: t.id, label: `${t.name} (${t.type})` }))]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-[#0051D5] rounded-lg hover:bg-[#0051D5] disabled:opacity-60">
              {submitting ? 'Saving…' : editCandidateTarget ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCandidateTarget}
        onClose={() => setDeleteCandidateTarget(null)}
        onConfirm={handleDelete}
        title="Remove Candidate"
        message={`Remove "${deleteCandidateTarget?.full_name}" from this election?`}
        confirmLabel="Remove"
        variant="danger"
      />
    </MainLayout>
  )
}
