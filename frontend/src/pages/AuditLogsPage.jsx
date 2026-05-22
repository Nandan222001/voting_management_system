import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaShieldAlt, FaSearch, FaFilter } from 'react-icons/fa'
import MainLayout from '../components/layout/MainLayout'
import Pagination from '../components/common/Pagination'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { fetchAuditLogs } from '../store/slices/voteSlice'

const ACTION_COLORS = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-600',
  register: 'bg-teal-100 text-teal-700',
  vote: 'bg-green-100 text-green-700',
  create: 'bg-indigo-100 text-indigo-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  block: 'bg-orange-100 text-orange-700',
  activate: 'bg-purple-100 text-purple-700',
  close: 'bg-slate-100 text-slate-700',
}

function actionColor(action) {
  if (!action) return 'bg-gray-100 text-gray-500'
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_COLORS[key] : 'bg-gray-100 text-gray-500'
}

export default function AuditLogsPage() {
  const dispatch = useDispatch()
  const { auditLogs, totalAuditLogs: auditTotal, loading } = useSelector(s => s.votes)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const perPage = 20

  useEffect(() => {
    dispatch(fetchAuditLogs({ page, per_page: perPage, action: actionFilter || undefined }))
  }, [page, actionFilter, dispatch])

  const totalPages = Math.ceil((auditTotal || 0) / perPage)

  const filtered = search
    ? (auditLogs || []).filter(l =>
        (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.entity_type || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.ip_address || '').includes(search)
      )
    : auditLogs || []

  return (
    <MainLayout title="Audit Logs">
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-48">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search action, entity, IP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="h-4 w-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              {Object.keys(ACTION_COLORS).map(a => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500 ml-auto">{auditTotal ?? 0} total entries</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <LoadingSpinner message="Loading audit logs..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<FaShieldAlt className="h-12 w-12 text-gray-300" />}
              title="No Audit Logs"
              message="No audit log entries found for the selected filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Timestamp', 'Action', 'Entity', 'Details', 'IP Address'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((log, i) => (
                    <tr key={log.id ?? i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${actionColor(log.action)}`}>
                          {log.action || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.entity_type && (
                          <div>
                            <span className="text-gray-700 font-medium">{log.entity_type}</span>
                            {log.entity_id && <span className="text-gray-400 ml-1">#{log.entity_id}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {log.details || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
