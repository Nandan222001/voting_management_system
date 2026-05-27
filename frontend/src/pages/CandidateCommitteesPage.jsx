import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaPlus, FaUsers, FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import {
  fetchCandidateCommittees,
  createCandidateCommittee,
  updateCandidateCommittee,
  deleteCandidateCommittee
} from '../store/slices/candidateCommitteeSlice'

const emptyForm = { name: '', description: '' }

export default function CandidateCommitteesPage() {
  const dispatch = useDispatch()
  const { committees, loading } = useSelector(s => s.candidateCommittees)

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchCandidateCommittees())
  }, [dispatch])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(c) {
    setEditTarget(c)
    setForm({ name: c.name, description: c.description || '' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editTarget) {
        await dispatch(updateCandidateCommittee({ id: editTarget.id, data: form })).unwrap()
        toast.success('Committee updated')
      } else {
        await dispatch(createCandidateCommittee(form)).unwrap()
        toast.success('Committee created')
      }
      setShowModal(false)
      dispatch(fetchCandidateCommittees())
    } catch (err) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteCandidateCommittee(deleteTarget.id)).unwrap()
      toast.success('Committee deleted')
      setDeleteTarget(null)
      dispatch(fetchCandidateCommittees())
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const filtered = committees.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', label: 'Committee Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'candidate_count',
      label: 'Candidates',
      render: (v) => <span className="font-semibold text-gray-700">{v ?? 0}</span>
    }
  ]

  return (
    <MainLayout title="Candidate Committees">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[rgb(16_102_177)]">Committees</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[rgb(16_102_177)] text-white text-sm font-medium rounded-lg hover:bg-[rgb(12_85_148)]"
          >
            <FaPlus className="h-4 w-4" /> Add Committee
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search committees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <FaUsers className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No committees found.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Committee' : 'Create Committee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-[rgb(16_102_177)] rounded-lg hover:bg-[rgb(12_85_148)] disabled:opacity-60">
              {submitting ? 'Saving...' : editTarget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Committee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}
