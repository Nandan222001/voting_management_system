import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import {
  fetchTargets,
  createTarget,
  updateTarget,
  deleteTarget,
} from '../store/slices/targetSlice'

const TARGET_TYPES = [
  { value: 'state', label: 'State' },
  { value: 'district', label: 'District' },
  { value: 'zone', label: 'Zone' },
  { value: 'ward', label: 'Ward' },
  { value: 'other', label: 'Other' },
]

export default function TargetsPage() {
  const dispatch = useDispatch()
  const { targets, loading, actionLoading } = useSelector((s) => s.targets)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTargetObj, setDeleteTargetObj] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'district', parent_id: '' })

  useEffect(() => {
    dispatch(fetchTargets())
  }, [dispatch])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', type: 'district', parent_id: '' })
    setModalOpen(true)
  }

  const openEdit = (t) => {
    setEditTarget(t)
    setForm({ 
      name: t.name, 
      type: t.type, 
      parent_id: t.parent_id || '' 
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { 
      ...form, 
      parent_id: form.parent_id ? parseInt(form.parent_id) : null 
    }
    try {
      if (editTarget) {
        await dispatch(updateTarget({ id: editTarget.id, data: payload })).unwrap()
        toast.success('Target updated')
      } else {
        await dispatch(createTarget(payload)).unwrap()
        toast.success('Target created')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteTarget(deleteTargetObj.id)).unwrap()
      toast.success('Target deleted')
      setDeleteTargetObj(null)
    } catch (err) {
      toast.error(err || 'Delete failed')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (val) => <span className="font-semibold text-gray-900">{val}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
          {val}
        </span>
      ),
    },
    {
      key: 'parent_id',
      header: 'Parent',
      render: (val) => {
        const parent = targets.find(t => t.id === val)
        return <span className="text-gray-500 text-sm">{parent ? parent.name : '—'}</span>
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (val) => <span className="text-gray-400 text-xs">{new Date(val).toLocaleDateString()}</span>,
    },
  ]

  return (
    <MainLayout title="Geographical Targets">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Geographical Targets</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage states, districts, and wards for voter targeting.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FaPlus className="text-xs" />
            Add Target
          </button>
        </div>

        {targets.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMapMarkerAlt className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No targets defined</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-1">
              Targets allow you to scope elections and candidates to specific areas. Create your first target to get started.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
            >
              <FaPlus className="text-xs" />
              Add First Target
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={targets}
            loading={loading}
            onEdit={openEdit}
            onDelete={(row) => setDeleteTargetObj(row)}
          />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Target' : 'Create Target'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Maharashtra or Mumbai"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TARGET_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Target (Optional)</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- No Parent --</option>
              {targets
                .filter(t => t.id !== editTarget?.id) // Prevent self-parenting
                .map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
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
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {actionLoading ? 'Saving...' : editTarget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTargetObj}
        onClose={() => setDeleteTargetObj(null)}
        onConfirm={handleDelete}
        title="Delete Target"
        message={`Are you sure you want to delete the "${deleteTargetObj?.name}" target? Elections, candidates, and users linked to this target will have their target reference cleared.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}
