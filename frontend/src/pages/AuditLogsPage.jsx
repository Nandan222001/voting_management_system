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
  login: 'bg-gray-100 text-gray-900 border-gray-200',
  logout: 'bg-gray-50 text-gray-600 border-gray-100',
  register: 'bg-teal-50 text-teal-700 border-teal-100',
  vote: 'bg-green-50 text-green-700 border-green-100',
  create: 'bg-gray-100 text-gray-900 border-gray-200',
  update: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  delete: 'bg-red-50 text-red-700 border-red-100',
  approve: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  block: 'bg-orange-50 text-orange-700 border-orange-100',
  activate: 'bg-[#e6edfb] text-[#0051D5] border-[#e6edfb]',
  close: 'bg-slate-50 text-slate-700 border-slate-100',
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
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Real-time monitoring of all platform activity and administrative actions.
            </p>
          </div>
          <div className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold rounded-xl border border-gray-200 shadow-sm uppercase tracking-wider">
            {auditTotal} Entries
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px] max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-[#0051D5] transition-colors" />
            <input
              type="text"
              placeholder="Search by action, entity, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#0051D5]/10 focus:border-[#0051D5] bg-white transition-all shadow-sm"
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
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {['Timestamp', 'Action', 'Entity', 'Details', 'IP Address'].map(h => (
                      <th key={h} className="px-3 py-3 break-words sm:px-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log, i) => (
                    <tr key={log.id ?? i} className="hover:bg-[#e6edfb]/50 transition-colors">
                      <td className="px-3 py-3 align-top break-words sm:px-4">
                        <div className="flex flex-col">
                           <span className="text-gray-900 font-semibold">
                             {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy') : '—'}
                           </span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                             {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : ''}
                           </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top break-words sm:px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${actionColor(log.action)}`}>
                          {log.action || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top break-words sm:px-4">
                        {log.entity_type ? (
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-semibold">{log.entity_type}</span>
                            {log.entity_id && <span className="text-[10px] text-gray-400 font-mono font-medium tracking-tight">#{log.entity_id}</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 align-top sm:px-4">
                        <p className="break-words text-gray-600 font-medium text-sm" title={log.details}>
                          {log.details || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top break-words sm:px-4">
                        <span className="inline-block max-w-full break-words text-gray-400 font-mono text-[10px] font-medium bg-gray-50 px-2 py-1 border border-gray-100 rounded-lg">
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
