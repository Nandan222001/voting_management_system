import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaPlus, FaMapMarkerAlt, FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchTargets, createTarget, updateTarget, deleteTarget } from '../store/slices/targetSlice'

const emptyForm = { name: '', type: 'block' }

export default function TargetsPage() {
  const dispatch = useDispatch()
  const { targets, loading } = useSelector(s => s.targets)

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchTargets())
  }, [dispatch])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(t) {
    setEditTarget(t)
    setForm({ name: t.name, type: t.type || 'block' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editTarget) {
        await dispatch(updateTarget({ id: editTarget.id, data: form })).unwrap()
        toast.success('Target updated')
      } else {
        await dispatch(createTarget(form)).unwrap()
        toast.success('Target created')
      }
      setShowModal(false)
      dispatch(fetchTargets())
    } catch (err) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteTarget(deleteTargetItem.id)).unwrap()
      toast.success('Target deleted')
      setDeleteTargetItem(null)
      dispatch(fetchTargets())
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const filtered = targets.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', label: 'Area Name' },
    {
      key: 'type',
      label: 'Type',
      render: (v) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
          {v}
        </span>
      )
    }
  ]

  return (
    <MainLayout title="Targets">
      <div className="w-full space-y-6">
        <div className="flex items-end justify-between gap-4 border-b border-[#c4c6d0] pb-5">
          <div>
            <h1 className="text-2xl font-black text-[#1A237E]">Geographical Targets</h1>
            <p className="mt-1 text-sm text-[#44464f]">Define state, district, and block level election scopes.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[#1A237E] px-5 py-3 text-sm font-bold text-white hover:brightness-110"
          >
            <FaPlus className="h-4 w-4" /> Add Target
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm">
          <div className="border-b border-[#c4c6d0] bg-[#f4f3f7] p-4">
            <div className="relative max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search areas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#c4c6d0] py-2 pl-9 pr-4 text-sm focus:border-[#1A237E] focus:outline-none focus:ring-2 focus:ring-[#e8eaf6]"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <FaMapMarkerAlt className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No targets found.</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              onEdit={openEdit}
              onDelete={setDeleteTargetItem}
            />
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Target' : 'Create Target'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="state">State</option>
              <option value="district">District</option>
              <option value="block">Block</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-[#1A237E] rounded-lg hover:bg-[#0d1245] disabled:opacity-60">
              {submitting ? 'Saving...' : editTarget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTargetItem}
        onClose={() => setDeleteTargetItem(null)}
        onConfirm={handleDelete}
        title="Delete Target"
        message={`Are you sure you want to delete "${deleteTargetItem?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}
