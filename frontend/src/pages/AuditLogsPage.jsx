import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AlertTriangle, CheckCircle2, Download, Filter, History, Search, ShieldCheck, X } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchAuditLogs } from '../store/slices/voteSlice'
import Pagination from '../components/common/Pagination'
import { format } from 'date-fns'

const ACTION_COLORS = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-600',
  register: 'bg-teal-100 text-teal-700',
  vote: 'bg-green-100 text-green-700',
  create: 'bg-blue-100 text-[#1A237E]',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  block: 'bg-orange-100 text-orange-700',
  activate: 'bg-purple-100 text-purple-700',
  close: 'bg-slate-100 text-slate-700',
}

function actionColor(action) {
  if (!action) return 'bg-gray-50 text-gray-500'
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_COLORS[key] : 'bg-gray-50 text-gray-500'
}

export default function AuditLogsPage() {
  const dispatch = useDispatch()
  const { auditLogs = [], totalAuditLogs: auditTotal = 0, loading } = useSelector(s => s.votes)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const perPage = 20

  useEffect(() => {
    dispatch(fetchAuditLogs({ page, per_page: perPage, action: actionFilter || undefined }))
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
  const criticalCount = logsArray.filter(l => /delete|block|failed|root|critical|suspend/i.test(`${l.action || ''} ${l.details || ''}`)).length
  const activeTenants = new Set(logsArray.map(l => l.tenant_id || l.tenant || l.entity_type).filter(Boolean)).size

  return (
    <MainLayout title="Security Logs">
      <div className="w-full space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="mb-1 text-2xl font-black text-[#1A237E]">Audit & Security Logs</h2>
            <p className="max-w-2xl text-sm leading-6 text-[#44464f]">
              Governance oversight for platform events. Critical actions are highlighted for fast investigation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-[#1A237E] px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg">
              <Download className="h-4 w-4" />
              Export Trail
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#74777f] px-4 py-2.5 text-sm font-medium text-[#1b1b1f] transition hover:bg-[#f4f3f7]">
              <ShieldCheck className="h-4 w-4" />
              Verify Integrity
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Events', value: auditTotal || logsArray.length, tone: 'text-[#1A237E]', icon: History },
            { label: 'Critical Alerts', value: criticalCount, tone: 'text-[#b3261e]', icon: AlertTriangle },
            { label: 'System Integrity', value: '100%', tone: 'text-[#388e3c]', icon: CheckCircle2 },
            { label: 'Tenant Activity', value: activeTenants || filtered.length, tone: 'text-[#1b1b1f]', icon: Filter },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-[#c4c6d0] bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#74777f]">{label}</span>
                <Icon className={`h-5 w-5 ${tone}`} />
              </div>
              <p className={`mt-2 text-3xl font-black ${tone}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4 rounded-lg bg-[#eeeef4] p-4 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center px-2 text-sm font-bold text-[#44464f]">Action:</span>
            {['', 'delete', 'update', 'login', 'create'].map((value) => (
              <button
                key={value || 'all'}
                onClick={() => {
                  setActionFilter(value)
                  setPage(1)
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase transition ${
                  actionFilter === value ? 'bg-[#1A237E] text-white' : 'bg-white text-[#44464f] hover:bg-[#e8eaf6]'
                }`}
              >
                {value || 'All'}
              </button>
            ))}
          </div>
          <div className="hidden h-8 w-px bg-[#c4c6d0] md:block" />
          <div className="relative min-w-[260px] flex-1 md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74777f]" />
            <input
              type="text"
              placeholder="Search by action, entity, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#c4c6d0] bg-white py-2.5 pl-11 pr-10 text-sm text-[#1b1b1f] placeholder-[#74777f] focus:border-[#1A237E] focus:outline-none focus:ring-2 focus:ring-[#e8eaf6]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#1A237E]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border border-[#c4c6d0] bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-[#c4c6d0] bg-[#f4f3f7] text-[#74777f]">
                <History className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1b1f]">No activity found</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm font-medium text-[#74777f]">Adjust the search or action filter.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#c4c6d0] bg-[#f4f3f7] text-xs font-black uppercase tracking-widest text-[#74777f]">
                    {['Timestamp', 'Event Entity', 'Action', 'Resource / Details', 'IP Address'].map(h => (
                      <th key={h} className="px-3 py-4 sm:px-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6d0]">
                  {filtered.map((log, i) => (
                    <tr key={log.id ?? i} className="transition-colors hover:bg-[#1A237E]/[0.04]">
                      <td className="px-3 py-4 align-top sm:px-6">
                        <div className="flex flex-col">
                          <span className="whitespace-nowrap font-semibold text-[#1b1b1f]">
                            {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy') : '-'}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#74777f]">
                            {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <span className="font-semibold text-[#1b1b1f]">{log.entity_type || '-'}</span>
                        {log.entity_id && <span className="block font-mono text-[10px] text-[#74777f]">#{log.entity_id}</span>}
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <span className={`inline-flex rounded px-3 py-1 text-[10px] font-black uppercase tracking-wider ${actionColor(log.action)}`}>
                          {log.action || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <p className="text-sm font-medium leading-relaxed text-[#44464f]" title={log.details}>{log.details || '-'}</p>
                      </td>
                      <td className="px-3 py-4 align-top sm:px-6">
                        <span className="inline-block whitespace-nowrap rounded bg-[#eeeef4] px-2 py-1 font-mono text-[10px] font-medium text-[#74777f]">
                          {log.ip_address || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-[#c4c6d0] bg-[#f4f3f7]">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
