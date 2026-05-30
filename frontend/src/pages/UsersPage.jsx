import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaUserCheck, FaBan, FaTrash, FaSearch, FaUsers, FaEye, FaEdit } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import DataTable from '../components/common/DataTable'
import Badge from '../components/common/Badge'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import StatsCard from '../components/common/StatsCard'
import { fetchUsers, approveUser, blockUser, deleteUser, fetchUserStats } from '../store/slices/userSlice'

const TABS = [
  { key: '', label: 'All Users' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'active', label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
]

export default function UsersPage() {
  const dispatch = useDispatch()
  const { users, total, stats, loading } = useSelector(s => s.users)

  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)
  const perPage = 10

  useEffect(() => {
    dispatch(fetchUserStats())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchUsers({ status: activeTab || undefined, search: search || undefined, page, per_page: perPage }))
  }, [activeTab, search, page, dispatch])

  async function handleApprove(user) {
    try {
      await dispatch(approveUser(user.id)).unwrap()
      toast.success(`${user.full_name} approved`)
      dispatch(fetchUsers({ status: activeTab || undefined, page, per_page: perPage }))
      dispatch(fetchUserStats())
    } catch (err) {
      toast.error(err?.message || 'Failed to approve')
    }
  }

  async function handleBlock(user) {
    try {
      await dispatch(blockUser(user.id)).unwrap()
      toast.success(`${user.full_name} ${user.status === 'blocked' ? 'unblocked' : 'blocked'}`)
      dispatch(fetchUsers({ status: activeTab || undefined, page, per_page: perPage }))
      dispatch(fetchUserStats())
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
      dispatch(fetchUserStats())
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const totalPages = Math.ceil(total / perPage)

  const columns = [
    {
      header: 'User Identity',
      key: 'full_name',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#1A237E] font-black text-sm border border-blue-100 shadow-sm">
            {u.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{u.full_name}</p>
            <p className="text-[10px] font-medium text-gray-400 truncate uppercase tracking-wider">{u.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Jurisdiction',
      key: 'target',
      render: (target) => (
        <div className="flex flex-col">
           <span className="text-sm font-semibold text-gray-700">
             {target ? target.name : '—'}
           </span>
           {target?.type && (
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                {target.type}
             </span>
           )}
        </div>
      )
    },
    {
      header: 'Account Details',
      render: (_, u) => (
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2">
             <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${u.role === 'admin'
                ? 'bg-[#e8eaf6] text-[#1A237E] border border-blue-100'
                : 'bg-gray-100 text-gray-600'
              }`}>
              {u.role}
             </span>
             <Badge status={u.status} />
           </div>
           <div className="flex items-center gap-1.5 px-1">
              <div className={`w-1.5 h-1.5 rounded-full ${u.is_verified ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-[9px] font-bold text-gray-400 uppercase">{u.is_verified ? 'Verified' : 'Unverified'}</span>
           </div>
        </div>
      )
    },
    {
      header: 'Registered',
      key: 'created_at',
      render: (value) => (
        <span className="text-xs font-bold text-gray-400 tabular-nums">
          {value ? new Date(value).toLocaleDateString() : '—'}
        </span>
      )
    }
  ]

  return (
    <MainLayout title="User Directory">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-[#c4c6d0] pb-5">
           <div>
             <h1 className="text-2xl font-black text-[#1A237E]">User Management</h1>
             <p className="mt-1 text-sm text-[#44464f]">Administer jurisdictional identities and platform access controls.</p>
           </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Total Registry" value={stats.total_users ?? 0} icon={FaUsers} color="primary" />
            <StatsCard title="Active Voters" value={stats.active_voters ?? 0} icon={FaUserCheck} color="green" />
            <StatsCard title="Pending Review" value={stats.pending_users ?? 0} icon={FaUsers} color="yellow" />
            <StatsCard title="Blocked" value={stats.blocked_users ?? 0} icon={FaBan} color="red" />
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-[#c4c6d0] bg-[#f4f3f7] px-8">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setPage(1) }}
                className={`border-b-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.key ? 'border-[#1A237E] text-[#1A237E]' : 'border-transparent text-[#74777f] hover:text-[#44464f]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="border-b border-[#c4c6d0] p-4">
            <div className="relative max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(Page => 1) }}
                className="w-full rounded-lg border border-[#c4c6d0] py-2.5 pl-9 pr-4 text-sm focus:border-[#1A237E] focus:outline-none focus:ring-2 focus:ring-[#e8eaf6]"
              />
            </div>
          </div>

          {/* Table with hover actions */}
          <DataTable 
            columns={columns} 
            data={users} 
            loading={loading} 
            pagination={false}
            rowClassName="group cursor-default"
            onEdit={(u) => setViewUser(u)} // Detail view
            onDelete={(u) => u.role !== 'admin' && setActionTarget(u)}
            customActions={(u) => (
              <>
                 {u.status === 'pending' && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleApprove(u) }} 
                     className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                     title="Approve"
                     type="button"
                   >
                     <FaUserCheck size={14} />
                   </button>
                 )}
                 {u.role !== 'admin' && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleBlock(u) }} 
                     className={`p-2 rounded-lg transition-colors ${u.status === 'blocked' ? 'text-blue-600 hover:bg-blue-50' : 'text-orange-500 hover:bg-orange-50'}`}
                     title={u.status === 'blocked' ? 'Unblock' : 'Block'}
                     type="button"
                   >
                     <FaBan size={14} />
                   </button>
                 )}
              </>
            )}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#f4f3f7] border-t border-[#c4c6d0]">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* View user modal */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details">
        {viewUser && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1A237E] text-2xl font-black border border-blue-100 shadow-sm">
                {viewUser.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A237E] leading-tight">{viewUser.full_name}</p>
                <p className="text-sm text-gray-500 font-medium">{viewUser.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-y-4">
              {[
                { label: 'Mobile Contact', val: viewUser.phone || '—' },
                { label: 'Jurisdictional Area', val: viewUser.target ? `${viewUser.target.name} (${viewUser.target.type})` : 'Unassigned' },
                { label: 'System Role', val: <span className="uppercase tracking-widest text-[10px] font-black">{viewUser.role}</span> },
                { label: 'Account Status', val: <Badge status={viewUser.status} /> },
                { label: 'Identity Verified', val: viewUser.is_verified ? <span className="text-green-600 font-bold text-xs uppercase">Verified</span> : <span className="text-gray-400 font-bold text-xs uppercase">Unverified</span> },
                { label: 'Registration Date', val: viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : '—' },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col border-b border-gray-50 pb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</span>
                  <div className="text-sm font-semibold text-slate-700">{val}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
               <button onClick={() => setViewUser(null)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">Close Directory</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Permanently delete "${actionTarget?.full_name}"? This action is irreversible and will remove all associated voting history.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </MainLayout>
  )
}
