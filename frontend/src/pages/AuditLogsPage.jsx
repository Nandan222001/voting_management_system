import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Filter, History, X } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchAuditLogs } from '../store/slices/voteSlice'
import FancySelect from '../components/common/FancySelect'
import Pagination from '../components/common/Pagination'
import { format } from 'date-fns'

const ACTION_COLORS = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-600',
  register: 'bg-teal-100 text-teal-700',
  vote: 'bg-green-100 text-green-700',
  create: 'bg-blue-100 text-[rgb(16_102_177)]',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  block: 'bg-orange-100 text-orange-700',
  activate: 'bg-purple-100 text-purple-700',
  close: 'bg-slate-100 text-slate-700',
}

function actionColor(action) {
  if (!action) return 'bg-gray-50 text-gray-500 border-gray-100'
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_COLORS[key] : 'bg-gray-50 text-gray-500 border-gray-100'
}

export default function AuditLogsPage() {
  const dispatch = useDispatch()

  const {
    auditLogs = [],
    totalAuditLogs: auditTotal = 0,
    loading,
  } = useSelector(s => s.votes)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const perPage = 20

  useEffect(() => {
    dispatch(
      fetchAuditLogs({
        page,
        per_page: perPage,
        action: actionFilter || undefined,
      })
    )
  }, [page, actionFilter, dispatch])

  const logsArray = Array.isArray(auditLogs) ? auditLogs : auditLogs?.data || []
  const totalPages = Math.ceil((auditTotal || 0) / perPage)

  const filtered = search
    ? logsArray.filter(l =>
        (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.entity_type || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.ip_address || '').includes(search)
      )
    : logsArray

  return (
    <MainLayout title="Audit Logs">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px] max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-[rgb(16_102_177)] transition-colors" />
            <input
              type="text"
              placeholder="Search by action, entity, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[rgb(16_102_177)]/10 focus:border-[rgb(16_102_177)] bg-white transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <FancySelect
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              options={[{ value: '', label: 'All Actions' }, ...Object.keys(ACTION_COLORS).map(a => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) }))]}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No activity found</h3>
              <p className="text-sm font-medium text-gray-400 mt-1 max-w-xs mx-auto">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {['Timestamp', 'Action', 'Entity', 'Details', 'IP Address'].map(h => (
                      <th key={h} className="px-3 py-4 sm:px-6">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log, i) => (
                    <tr key={log.id ?? i} className="hover:bg-[#e6edfb]/50 transition-colors">
                      <td className="px-3 py-4 align-top sm:px-6">
                        <div className="flex flex-col">
                           <span className="text-gray-900 font-semibold whitespace-nowrap">
                             {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy') : '—'}
                           </span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                             {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : ''}
                           </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${actionColor(log.action)}`}>
                          {log.action || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        {log.entity_type ? (
                          <div className="flex flex-col min-w-[120px]">
                            <span className="text-gray-900 font-semibold">{log.entity_type}</span>
                            {log.entity_id && <span className="text-[10px] text-gray-400 font-mono font-medium tracking-tight">#{log.entity_id}</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <p className="text-gray-600 font-medium text-sm leading-relaxed" title={log.details}>
                          {log.details || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <span className="inline-block text-gray-400 font-mono text-[10px] font-medium bg-gray-50 px-2 py-1 border border-gray-100 rounded-lg whitespace-nowrap">
                          {log.ip_address || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
