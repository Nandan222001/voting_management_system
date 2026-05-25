import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FaEdit,
  FaExternalLinkAlt,
  FaPlus,
  FaPoll,
  FaSearch,
  FaTrash,
  FaUserTie,
  FaUsers,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Badge from '../components/common/Badge'
import DataTable from '../components/common/DataTable'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useAuth from '../hooks/useAuth'
import { fetchElections } from '../store/slices/electionSlice'
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

const emptyForm = { full_name: '', party: '', symbol: '', bio: '', image_url: '', committee_id: '', target_id: '' }

export default function CandidatesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isAdmin } = useAuth()
  const { elections } = useSelector(s => s.elections)
  const { candidates, results, loading, actionLoading } = useSelector(s => s.candidates)
  const { committees } = useSelector(s => s.candidateCommittees)
  const { targets } = useSelector(s => s.targets)

  const [selectedElectionId, setSelectedElectionId] = useState('')
  const [search, setSearch] = useState('')

  // CRUD State
  const [showModal, setShowModal] = useState(false)
  const [editCandidateTarget, setEditCandidateTarget] = useState(null)
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    dispatch(fetchElections({}))
    dispatch(fetchCandidateCommittees())
    dispatch(fetchTargets())
  }, [dispatch])

  useEffect(() => {
    if (selectedElectionId) {
      dispatch(fetchCandidatesByElection(selectedElectionId))
      dispatch(fetchElectionResults(selectedElectionId))
    }
  }, [selectedElectionId, dispatch])

  const openCreate = () => {
    setEditCandidateTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditCandidateTarget(c)
    setForm({
      full_name: c.full_name,
      party: c.party || '',
      symbol: c.symbol || '',
      bio: c.bio || '',
      image_url: c.image_url || '',
      committee_id: c.committee_id || '',
      target_id: c.target_id || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editCandidateTarget) {
        await dispatch(updateCandidate({ id: editCandidateTarget.id, data: form })).unwrap()
        toast.success('Candidate updated')
      } else {
        await dispatch(addCandidate({ ...form, election_id: parseInt(selectedElectionId) })).unwrap()
        toast.success('Candidate added')
      }
      setShowModal(false)
    } catch (err) {
      toast.error(err || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteCandidate(deleteCandidateTarget.id)).unwrap()
      toast.success('Candidate removed')
      setDeleteCandidateTarget(null)
    } catch (err) {
      toast.error(err || 'Delete failed')
    }
  }

  const selectedElection = elections.find(e => String(e.id) === String(selectedElectionId))
  const normalizedSearch = search.trim().toLowerCase()
  const visibleCandidates = candidates.filter(candidate => {
    if (!normalizedSearch) return true
    return [candidate.full_name, candidate.party, candidate.symbol]
      .some(val => val?.toLowerCase().includes(normalizedSearch))
  })

  const rows = visibleCandidates.map(c => ({
    ...c,
    _result: results?.candidates?.find(r => r.candidate_id === c.id)
  }))

  const columns = [
    {
      key: 'full_name',
      header: 'Candidate',
      render: (_, row) => <CandidateIdentity candidate={row} />,
    },
    {
      key: 'party',
      header: 'Party',
      render: val => val || 'Independent',
    },
    {
      key: 'committee',
      header: 'Committee',
      render: committee => (
        committee ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
            {committee.name}
          </span>
        ) : <span className="text-gray-400 text-xs">—</span>
      ),
    },
    {
      key: 'target',
      header: 'Area / Target',
      render: target => (
        target ? (
          <span className="text-gray-600 text-xs font-medium">
            {target.name}
          </span>
        ) : <span className="text-gray-400 text-xs">—</span>
      ),
    },
    {
      key: 'symbol',
      header: 'Symbol',
      render: val => val || '-',
    },
    {
      key: 'vote_count',
      header: 'Votes',
      render: (_, row) => (
        <span className="font-mono text-sm font-bold text-gray-800">
          {row._result?.vote_count ?? row.vote_count ?? 0}
        </span>
      ),
    },
    {
      key: 'percentage',
      header: 'Share',
      render: (_, row) => <VoteShare result={row._result} />,
    },
  ]

  return (
    <MainLayout title="Candidates">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedElection ? `${visibleCandidates.length} candidate${visibleCandidates.length !== 1 ? 's' : ''} shown` : 'Select an election to view candidates'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedElection && isAdmin && selectedElection.status === 'draft' && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FaPlus className="text-xs" />
                Add Candidate
              </button>
            )}
            {selectedElection && (
              <button
                onClick={() => navigate(`/elections/${selectedElectionId}`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <FaExternalLinkAlt className="text-xs" />
                View Election
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] gap-3">
            <div>
              <div className="relative group">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name, party or symbol..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <FaPoll className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <FancySelect
                  value={selectedElectionId}
                  onChange={(e) => setSelectedElectionId(e.target.value)}
                  options={[{ value: '', label: 'Choose an Election...' }, ...elections.map(e => ({ value: e.id, label: `${e.title} (${e.status})` }))]}
                />
            </div>
          </div>
        </div>

        {!selectedElectionId ? (
          <PanelEmpty title="No Election Selected" description="Please select an election from the dropdown to manage its candidates." icon={FaPoll} />
        ) : candidates.length === 0 && !loading ? (
          <PanelEmpty title="No Candidates Found" description="This election doesn't have any candidates yet." icon={FaUserTie} />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            onEdit={isAdmin && selectedElection?.status === 'draft' ? openEdit : null}
            onDelete={isAdmin && selectedElection?.status === 'draft' ? (row) => setDeleteCandidateTarget(row) : null}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editCandidateTarget ? 'Edit Candidate' : 'Add Candidate'}
      >
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
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={actionLoading} 
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {actionLoading ? 'Saving…' : editCandidateTarget ? 'Update' : 'Add'}
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

function CandidateIdentity({ candidate }) {
  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      {candidate.image_url ? (
        <img
          src={candidate.image_url}
          alt={candidate.full_name}
          className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 text-sm font-bold ring-1 ring-indigo-100 shrink-0">
          {getInitials(candidate.full_name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 truncate">{candidate.full_name}</p>
        {candidate.bio && <p className="text-xs text-gray-500 truncate max-w-xs">{candidate.bio}</p>}
      </div>
    </div>
  )
}

function VoteShare({ result }) {
  const value = result?.percentage ?? 0
  return (
    <div className="w-24">
      <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-medium">
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function PanelEmpty(props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <EmptyState {...props} />
    </div>
  )
}
