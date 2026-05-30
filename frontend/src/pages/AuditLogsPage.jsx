import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AlertTriangle, CheckCircle2, Download, Filter, History, Search, ShieldCheck, X, Globe, Activity, Lock, ShieldAlert } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchAuditLogs } from '../store/slices/voteSlice'
import Pagination from '../components/common/Pagination'
import { format } from 'date-fns'

function numberFormat(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function MetricCard({ title, value, children, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: { icon: 'text-blue-600 bg-blue-50 border-blue-100', text: 'text-blue-600' },
    amber: { icon: 'text-amber-600 bg-amber-50 border-amber-100', text: 'text-amber-600' },
    emerald: { icon: 'text-emerald-600 bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
    indigo: { icon: 'text-indigo-600 bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
    red: { icon: 'text-red-600 bg-red-50 border-red-100', text: 'text-red-600' },
  };

  const style = toneMap[tone] || toneMap.blue;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110 ${style.icon}`}>
          <Icon className="h-6 w-6" strokeWidth={2.4} />
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">{title}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        {value}
      </div>
      <div className="mt-4 border-t border-gray-50 pt-4">
        {children}
      </div>
    </div>
  );
}

const ACTION_COLORS = {
  login: 'bg-blue-50 text-blue-700 border-blue-100',
  logout: 'bg-gray-50 text-gray-600 border-gray-100',
  register: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  vote: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  create: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  update: 'bg-amber-50 text-amber-700 border-amber-100',
  delete: 'bg-red-50 text-red-700 border-red-100',
  approve: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  block: 'bg-orange-50 text-orange-700 border-orange-100',
  activate: 'bg-blue-50 text-blue-700 border-blue-100',
  close: 'bg-slate-50 text-slate-700 border-slate-100',
}

function actionColor(action) {
  if (!action) return 'bg-gray-50 text-gray-500 border-transparent'
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k))
  return key ? `${ACTION_COLORS[key]} border` : 'bg-gray-50 text-gray-500 border-transparent'
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
  
  const filtered = useMemo(() => {
    if (!search) return logsArray
    const s = search.toLowerCase()
    return logsArray.filter(l =>
      (l.action || '').toLowerCase().includes(s) ||
      (l.entity_type || '').toLowerCase().includes(s) ||
      (l.user_name || '').toLowerCase().includes(s) ||
      (l.tenant_name || '').toLowerCase().includes(s) ||
      (l.ip_address || '').includes(s)
    )
  }, [search, logsArray])

  const stats = useMemo(() => {
    const critical = logsArray.filter(l => /delete|block|failed|root|critical|suspend/i.test(`${l.action || ''} ${l.details || ''}`)).length
    const uniqueTenants = new Set(logsArray.map(l => l.tenant_id).filter(Boolean)).size
    return { critical, uniqueTenants }
  }, [logsArray])

  return (
    <MainLayout title="Security Logs">
      <div className="w-full space-y-8">
        <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-red-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Audit Protocol Active</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Governance & Security</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 leading-relaxed">
              Real-time monitoring of system-wide authorization events. Every action is cryptographically tied to a tenant node for total transparency.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard
            title="Total Events"
            icon={History}
            tone="blue"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(auditTotal)}</span>
              </>
            }
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lifetime system logs</p>
          </MetricCard>

          <MetricCard
            title="Critical Alerts"
            icon={ShieldAlert}
            tone="red"
            value={
              <>
                <span className="text-4xl font-black text-red-600 tracking-tight">{numberFormat(stats.critical)}</span>
              </>
            }
          >
             <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Require Investigation</p>
             </div>
          </MetricCard>

          <MetricCard
            title="Active Tenants"
            icon={Globe}
            tone="indigo"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(stats.uniqueTenants)}</span>
              </>
            }
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reporting Node Nodes</p>
          </MetricCard>

          <MetricCard
            title="Protocol Status"
            icon={Activity}
            tone="emerald"
            value={
              <>
                <span className="text-4xl font-black text-emerald-600 tracking-tight">Active</span>
              </>
            }
          >
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Encrypted & Signed</span>
             </div>
          </MetricCard>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl bg-gray-50 border border-gray-200 p-6 md:flex-row md:items-center shadow-sm">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center px-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Protocol:</span>
            {['', 'delete', 'update', 'login', 'create'].map((value) => (
              <button
                key={value || 'all'}
                onClick={() => {
                  setActionFilter(value)
                  setPage(1)
                }}
                className={`rounded-xl px-5 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  actionFilter === value 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-600 hover:text-indigo-600'
                }`}
              >
                {value || 'All Events'}
              </button>
            ))}
          </div>
          <div className="hidden h-10 w-px bg-gray-200 md:block" />
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, user, node, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-12 pr-10 text-sm font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all shadow-inner"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {loading ? (
            <div className="flex justify-center py-32"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-32 text-center">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gray-50 text-gray-200 border border-gray-100">
                <History className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Protocol Silent</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm font-bold text-gray-400 uppercase tracking-widest">No matching logs found in the current stream.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] border-separate border-spacing-y-2 px-4 pb-4">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <th className="px-6 py-5 text-left">Timestamp</th>
                    <th className="px-6 py-5 text-left">Organization / Node</th>
                    <th className="px-6 py-5 text-left">Protocol</th>
                    <th className="px-6 py-5 text-left">Payload Details</th>
                    <th className="px-6 py-5 text-right">Access Ref</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {filtered.map((log, i) => (
                    <tr key={log.id ?? i} className="group transition-all duration-200">
                      <td className="rounded-l-2xl bg-white border border-r-0 border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="whitespace-nowrap text-xs font-black text-gray-900">
                            {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy') : '-'}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-500">
                            {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : ''}
                          </span>
                        </div>
                      </td>
                      <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-gray-900">{log.tenant_name || log.entity_type || 'Platform'}</span>
                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{log.user_name || 'System Execution'}</span>
                        </div>
                      </td>
                      <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <span className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider border shadow-sm ${actionColor(log.action)}`}>
                          {log.action?.replace(/[._]/g, ' ') || '-'}
                        </span>
                      </td>
                      <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <p className="max-w-md text-xs font-bold leading-relaxed text-gray-500 line-clamp-2 group-hover:line-clamp-none transition-all" title={log.details}>
                          {log.details || 'Internal operation metadata processed.'}
                        </p>
                      </td>
                      <td className="rounded-r-2xl bg-white border border-l-0 border-gray-100 px-6 py-5 text-right group-hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-end">
                           <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[10px] font-black text-gray-500 border border-gray-200">
                              {log.ip_address || '0.0.0.0'}
                           </span>
                           {log.entity_id && <span className="mt-1 block font-black text-[9px] text-gray-300 uppercase tracking-widest">ID:{log.entity_id}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-4 rounded-b-3xl">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
