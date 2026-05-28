import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FaExternalLinkAlt,
  FaUserTie,
  FaPlus,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import FancySelect from '../components/common/FancySelect'
import DataTable from '../components/common/DataTable'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
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
import ImageUpload from '../components/common/ImageUpload'
import ImageAvatar from '../components/common/ImageAvatar'

const emptyForm = { full_name: '', symbol: '', bio: '', image_url: '', committee_id: '', target_id: '' }

export default function CandidatesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isAdmin } = useAuth()
  const { elections } = useSelector(s => s.elections)
  const { candidates, results, loading, actionLoading } = useSelector(s => s.candidates)
  const { committees } = useSelector(s => s.candidateCommittees)
  const { targets } = useSelector(s => s.targets)

  const [selectedElectionId, setSelectedElectionId] = useState('')

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
      symbol: c.symbol || '',
      bio: c.bio || '',
      image_url: c.image_url || '',
      image_file: null,
      committee_id: c.committee_id || '',
      target_id: c.target_id || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        if (!editCandidateTarget) payload.append('election_id', String(parseInt(selectedElectionId)))
      } else {
        const copy = { ...form }
        delete copy.image_file
        payload = copy
      }

      if (editCandidateTarget) {
        await dispatch(updateCandidate({ id: editCandidateTarget.id, data: payload })).unwrap()
        toast.success('Candidate updated')
      } else {
        await dispatch(addCandidate(payload instanceof FormData ? payload : { ...payload, election_id: parseInt(selectedElectionId) })).unwrap()
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

  const rows = candidates.map(c => ({
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
      key: 'committee',
      header: 'Committee',
      render: committee => (
        committee ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-900 border border-gray-200 uppercase tracking-wider">
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
    <MainLayout title="Candidates Management">
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Election</label>
            <select
              value={selectedElectionId}
              onChange={e => setSelectedElectionId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(16_102_177)] bg-white"
            >
              <option value="">-- Choose an election --</option>
              {elections.map(e => (
                <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {selectedElection && (
              <button
                onClick={() => navigate(`/elections/${selectedElectionId}`)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[rgb(16_102_177)] border border-[rgb(16_102_177)]/30 rounded-xl hover:bg-[#e6edfb] font-medium"
              >
                <FaExternalLinkAlt className="text-xs" />
                View
              </button>
            )}
            {isAdmin && selectedElection?.status === 'draft' && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-[rgb(16_102_177)] rounded-xl hover:bg-[rgb(12_85_148)] font-semibold shadow-sm"
              >
                <FaPlus className="text-xs" />
                Add Candidate
              </button>
            )}
          </div>
        </div>

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
                  className="px-4 py-2 bg-[rgb(16_102_177)] text-white text-sm rounded-lg hover:bg-[rgb(12_85_148)]"
                >
                  Add Candidates
                </button>
              )
            }
          />
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

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editCandidateTarget ? 'Edit Candidate' : 'Add Candidate'}
      >
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
              id="candidate-image-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <FancySelect
                value={form.committee_id}
                onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                placeholder="-- No specific committee --"
                options={committees.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target / Area</label>
              <FancySelect
                value={form.target_id}
                onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}
                placeholder="-- No specific area --"
                options={targets.map(t => ({ value: t.id, label: `${t.name} (${t.type})` }))}
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
              className="px-4 py-2 text-sm text-white bg-[rgb(16_102_177)] rounded-lg hover:bg-[rgb(16_102_177)] disabled:opacity-60"
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
      <ImageAvatar
        src={candidate.image_url}
        name={candidate.full_name}
        sizeClass="w-10 h-10"
        imageClassName="ring-1 ring-gray-200"
        fallbackClassName="bg-gray-100 text-gray-900 text-sm ring-1 ring-gray-200"
      />
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
          className="bg-[rgb(16_102_177)] h-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
