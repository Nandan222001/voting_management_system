import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaUserCheck, FaBan, FaTrash, FaSearch, FaUsers } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import StatsCard from '../components/common/StatsCard'
import TableActions from '../components/common/TableActions'
import { fetchUsers, approveUser, blockUser, deleteUser, fetchUserStats } from '../store/slices/userSlice'
import { fetchTargets } from '../store/slices/targetSlice'
import ImageAvatar from '../components/common/ImageAvatar'

const TABS = [
  { key: '', label: 'All Users' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'active', label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
]

export default function UsersPage() {
  const dispatch = useDispatch()
  const { users, total, stats, loading } = useSelector(s => s.users)
  const { targets } = useSelector(s => s.targets)

  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)
  const perPage = 10

  useEffect(() => {
    dispatch(fetchUserStats())
    dispatch(fetchTargets())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchUsers({ status: activeTab || undefined, search: search || undefined, page, per_page: perPage }))
  }, [activeTab, search, page, dispatch])

  async function handleApprove(user) {
    try {
      await dispatch(approveUser(user.id)).unwrap()
      toast.success(`${user.full_name} approved`)
      dispatch(fetchUsers({ status: activeTab || undefined, page, per_page: perPage }))
    } catch (err) {
      toast.error(err?.message || 'Failed to approve')
    }
  }

  async function handleBlock(user) {
    try {
      await dispatch(blockUser(user.id)).unwrap()
      toast.success(`${user.full_name} ${user.status === 'blocked' ? 'unblocked' : 'blocked'}`)
      dispatch(fetchUsers({ status: activeTab || undefined, page, per_page: perPage }))
    } catch (err) {
      toast.error(err?.message || 'Failed')
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteUser(actionTarget.id)).unwrap()
      toast.success('User deleted')
      setActionTarget(null)
      dispatch(fetchUsers({ status: activeTab || undefined, page, per_page: perPage }))
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(total / perPage)

  const columns = [
    {
      header: 'User',
      key: 'full_name',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#1B4FD8] font-bold text-sm">
            {u.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[#1066b1] text-sm">{u.full_name}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || '—'}
        </span>
      )
    },
    {
      header: 'Target / Area',
      key: 'target',
      render: (target) => (
        <span className="text-sm text-gray-600">
          {target ? target.name : '—'}
        </span>
      )
    },
    {
      header: 'Role',
      key: 'role',
      render: (value) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${value === 'admin'
            ? 'bg-[#e6edfb] text-[#0051D5]'
            : 'bg-gray-200 text-gray-900'
          }`}>
          {value}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (value) => <Badge status={value} />
    },
    {
      header: 'Verified',
      key: 'is_verified',
      render: (value) => (
        <span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-gray-400'
          }`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Registered',
      key: 'created_at',
      render: (value) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: u => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewUser(u)} className="text-xs text-[#1B4FD8] hover:text-indigo-800 font-medium">View</button>
          {u.status === 'pending' && (
            <button onClick={() => handleApprove(u)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800">
              <FaUserCheck className="h-3 w-3" /> Approve
            </button>
          )}
          {u.role !== 'admin' && (
            <button onClick={() => handleBlock(u)} className={`flex items-center gap-1 text-xs ${u.status === 'blocked' ? 'text-blue-600 hover:text-blue-800' : 'text-orange-500 hover:text-orange-700'}`}>
              <FaBan className="h-3 w-3" /> {u.status === 'blocked' ? 'Unblock' : 'Block'}
            </button>
          )}
          {u.role !== 'admin' && (
            <button onClick={() => setActionTarget(u)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <FaTrash className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <MainLayout title="User Management">
      <div className="space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Users"
              value={stats.total_users ?? 0}
              icon={FaUsers}
              color="primary"
            />

            <StatsCard
              title="Active Voters"
              value={stats.active_voters ?? 0}
              icon={FaUserCheck}
              color="green"
            />

            <StatsCard
              title="Pending"
              value={stats.pending_users ?? 0}
              icon={FaUsers}
              color="yellow"
            />

            <StatsCard
              title="Blocked"
              value={stats.blocked_users ?? 0}
              icon={FaBan}
              color="red"
            />
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 flex gap-6">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setPage(1) }}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-[#1B4FD8] text-[#1B4FD8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <DataTable columns={columns} data={users} loading={loading} pagination={false} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* View user modal */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details">
        {viewUser && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-[#1B4FD8] text-2xl font-bold">
                {viewUser.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-[#1066b1]">{viewUser.full_name}</p>
                <p className="text-gray-500">{viewUser.email}</p>
              </div>
            </div>
            {[
              ['Phone', viewUser.phone || '—'],
              ['Target Area', viewUser.target ? `${viewUser.target.name} (${viewUser.target.type})` : '—'],
              ['Role', viewUser.role],
              ['Status', <Badge status={viewUser.status} />],
              ['Verified', viewUser.is_verified ? 'Yes' : 'No'],
              ['Registered', viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Permanently delete "${actionTarget?.full_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}
