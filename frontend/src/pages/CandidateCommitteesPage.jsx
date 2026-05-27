import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaPlus, FaEdit, FaTrash, FaUserShield } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import {
  fetchCandidateCommittees,
  createCandidateCommittee,
  updateCandidateCommittee,
  deleteCandidateCommittee,
} from '../store/slices/candidateCommitteeSlice'

export default function CandidateCommitteesPage() {
  const dispatch = useDispatch()
  const { committees, loading, actionLoading } = useSelector((s) => s.candidateCommittees)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    dispatch(fetchCandidateCommittees())
  }, [dispatch])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (committee) => {
    setEditTarget(committee)
    setForm({ name: committee.name, description: committee.description || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editTarget) {
        await dispatch(updateCandidateCommittee({ id: editTarget.id, data: form })).unwrap()
        toast.success('Committee updated')
      } else {
        await dispatch(createCandidateCommittee(form)).unwrap()
        toast.success('Committee created')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteCandidateCommittee(deleteTarget.id)).unwrap()
      toast.success('Committee deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err || 'Delete failed')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Committee Name',
      render: (val) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (val) => <span className="text-gray-500 text-sm">{val || '—'}</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (val) => <span className="text-gray-400 text-xs">{new Date(val).toLocaleDateString()}</span>,
    },
  ]

  return (
    <MainLayout title="Candidate Committees">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Candidate Committees</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage election committees (e.g., Executive, Advisory)
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0051D5] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5] transition-colors shadow-sm"
          >
            <FaPlus className="text-xs" />
            Add Committee
          </button>
        </div>

        {committees.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserShield className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No committees defined</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-1">
              Committees allow you to group candidates in an election. Create your first committee to get started.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#0051D5] text-white text-sm font-semibold rounded-lg hover:bg-[#0051D5]"
            >
              <FaPlus className="text-xs" />
              Add First Committee
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={committees}
            loading={loading}
            onEdit={openEdit}
            onDelete={(row) => setDeleteTarget(row)}
          />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Committee' : 'Create Committee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committee Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Executive Committee"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the committee..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-sm text-white bg-[#0051D5] rounded-lg hover:bg-[#0051D5] disabled:opacity-60"
            >
              {actionLoading ? 'Saving...' : editTarget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Committee"
        message={`Are you sure you want to delete the "${deleteTarget?.name}" committee? Candidates assigned to this committee will have their committee cleared.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}
