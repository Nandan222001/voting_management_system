import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaTrophy } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
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
import { getInitials } from '../utils/helpers'

const CHART_COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626']

const emptyForm = { full_name: '', party: '', symbol: '', bio: '', image_url: '', committee_id: '', target_id: '' }

export default function ElectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

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
      party: c.party,
      symbol: c.symbol,
      bio: c.bio || '',
      image_url: c.image_url || '',
      committee_id: c.committee_id || '',
      target_id: c.target_id || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editCandidateTarget) {
        await dispatch(updateCandidate({ id: editCandidateTarget.id, data: form })).unwrap()
        toast.success('Candidate updated')
      } else {
        await dispatch(addCandidate({ ...form, election_id: parseInt(id) })).unwrap()
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
  const chartData = (results?.candidates || []).map(c => ({
    name: c.candidate_name,
    votes: c.vote_count,
    percentage: c.percentage
  }))

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
            { label: 'Total Votes', value: results?.total_votes ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <div className="mt-1 text-sm font-semibold text-gray-900 truncate">{value}</div>
            </div>
          ))}
        </div>

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
              Candidates ({candidates.length})
            </h2>
            {currentElection?.status === 'draft' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                <FaPlus className="h-4 w-4" /> Add Candidate
              </button>
            )}
          </div>

          {candLoading ? (
            <LoadingSpinner message="Loading candidates..." />
          ) : candidates.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No candidates added yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {candidates.map((c, i) => {
                const result = results?.candidates?.find(r => r.candidate_id === c.id)
                return (
                  <div key={c.id} className="border border-gray-200 rounded-lg p-4 relative">
                    {result && result.percentage === Math.max(...(results?.candidates || []).map(r => r.percentage)) && results.total_votes > 0 && (
                      <span className="absolute top-3 right-3 text-yellow-500"><FaTrophy /></span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={c.full_name}
                          className="w-12 h-12 rounded-full object-cover ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {getInitials(c.full_name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.full_name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate">{c.party}</span>
                          {c.committee && (
                            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium truncate italic">
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
                    {currentElection?.status === 'draft' && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                          <FaEdit /> Edit
                        </button>
                        <button onClick={() => setDeleteCandidateTarget(c)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                          <FaTrash /> Remove
                        </button>
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
            { name: 'party', label: 'Party', required: true },
            { name: 'symbol', label: 'Symbol / Initial', required: false },
            { name: 'image_url', label: 'Image URL', required: false },
          ].map(({ name, label, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={form[name]}
                onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <select
                value={form.committee_id}
                onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- No specific committee --</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target / Area</label>
              <select
                value={form.target_id}
                onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- No specific area --</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
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
