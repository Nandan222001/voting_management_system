import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import FancySelect from '../components/common/FancySelect'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import useAuth from '../hooks/useAuth'
import {
  fetchTargets,
  createTarget,
  updateTarget,
  deleteTarget,
} from '../store/slices/targetSlice'

const TARGET_TYPES = [
  { value: 'state', label: 'State' },
  { value: 'district', label: 'District' },
  { value: 'taluka', label: 'Taluka' },
  { value: 'city', label: 'City' },
  { value: 'village', label: 'Village' },
  { value: 'other', label: 'Other' },
]

const TYPE_PARENT_MAP = {
  'district': 'state',
  'taluka': 'district',
  'city': 'taluka',
  'village': 'city',
}

export default function TargetsPage() {
  const dispatch = useDispatch()
  const { isSuperAdmin } = useAuth()
  const { targets, loading, actionLoading } = useSelector((s) => s.targets)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTargetObj, setDeleteTargetObj] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'state', parent_id: '' })

  useEffect(() => {
    dispatch(fetchTargets())
  }, [dispatch])

  const openCreate = () => {
    setEditTarget(null)
    setForm({ name: '', type: 'state', parent_id: '' })
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
    
    // Validation: Ensure parent matches hierarchy if required
    const requiredParentType = TYPE_PARENT_MAP[form.type]
    if (requiredParentType) {
        const parent = targets.find(t => String(t.id) === String(form.parent_id))
        if (!parent || parent.type !== requiredParentType) {
            toast.error(`A ${form.type} must have a ${requiredParentType} as its parent.`)
            return
        }
    }

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

  // Filter possible parents based on selected type
  const possibleParents = useMemo(() => {
    const requiredType = TYPE_PARENT_MAP[form.type]
    if (!requiredType) return []
    return targets.filter(t => t.type === requiredType && t.id !== editTarget?.id)
  }, [form.type, targets, editTarget])

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
      header: 'Parent Target',
      render: (val) => {
        const parent = targets.find(t => t.id === val)
        return parent ? (
            <div className="flex flex-col">
                <span className="text-gray-900 text-sm font-medium">{parent.name}</span>
                <span className="text-gray-400 text-[10px] uppercase tracking-tighter">{parent.type}</span>
            </div>
        ) : <span className="text-gray-400 text-xs">—</span>
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (val) => <span className="text-gray-400 text-xs">{new Date(val).toLocaleDateString()}</span>,
    },
  ]

  return (
    <MainLayout title="Platform Geographic Hierarchy">
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Geography</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isSuperAdmin 
                ? 'Manage the platform-wide hierarchy: State → District → Taluka → City → Village.' 
                : 'Browse the available geographic hierarchy for election targeting.'}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FaPlus className="text-xs" />
              Add Entity
            </button>
          )}
        </div>

        {targets.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMapMarkerAlt className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No geographic data</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-1">
              {isSuperAdmin ? 'Start by adding a State, then build your hierarchy downwards.' : 'No geographic entities have been defined by the platform administrator yet.'}
            </p>
            {isSuperAdmin && (
                <button
                    onClick={openCreate}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                >
                    <FaPlus className="text-xs" />
                    Add First State
                </button>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={targets}
            loading={loading}
            onEdit={isSuperAdmin ? openEdit : null}
            onDelete={isSuperAdmin ? (row) => setDeleteTargetObj(row) : null}
          />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Entity' : 'Create New Entity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Maharashtra, Pune, or Mulshi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <FancySelect
              value={form.type}
              onChange={(e) => {
                  const newType = e.target.value
                  setForm({ ...form, type: newType, parent_id: '' })
              }}
              options={TARGET_TYPES}
            />
          </div>
          
          {TYPE_PARENT_MAP[form.type] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent {TYPE_PARENT_MAP[form.type].charAt(0).toUpperCase() + TYPE_PARENT_MAP[form.type].slice(1)}
              </label>
              <FancySelect
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                placeholder={`-- Select ${TYPE_PARENT_MAP[form.type]} --`}
                options={possibleParents.map(t => ({ value: t.id, label: t.name }))}
              />
              {possibleParents.length === 0 && (
                  <p className="mt-1 text-[10px] text-red-500 font-medium">
                      No {TYPE_PARENT_MAP[form.type]}s found. Please create one first.
                  </p>
              )}
            </div>
          )}

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
              disabled={actionLoading || (TYPE_PARENT_MAP[form.type] && possibleParents.length === 0)}
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
        title="Delete Geographic Entity"
        message={`Are you sure you want to delete the "${deleteTargetObj?.name}" ${deleteTargetObj?.type}? This will fail if it has child entities.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}
