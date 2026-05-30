import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Users, 
  Layers, 
  Trash2, 
  Edit3, 
  Check, 
  ChevronRight, 
  Info, 
  Globe, 
  Activity, 
  ArrowUpRight,
  Shield,
  Hash,
  Landmark,
  Trophy,
  X,
  Eye,
  MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import {
  fetchCandidateCommittees,
  createCandidateCommittee,
  updateCandidateCommittee,
  deleteCandidateCommittee
} from '../store/slices/candidateCommitteeSlice'
import ImageAvatar from '../components/common/ImageAvatar'

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
        <span className="text-4xl font-black text-gray-900 tracking-tight">{value}</span>
      </div>
      <div className="mt-4 border-t border-gray-50 pt-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children, hint, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 ml-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] font-black text-red-600 ml-1">{error}</p>}
      {hint && !error && <p className="text-[10px] font-bold text-gray-300 ml-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled, required, hasError, icon: Icon, ...props }) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
          <Icon size={16} strokeWidth={2.4} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`block w-full ${Icon ? 'pl-11' : 'px-4'} py-3 border rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 disabled:bg-gray-50 disabled:text-gray-400 transition-all shadow-inner ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white'
        }`}
        {...props}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, disabled, required, hasError, rows = 3, icon: Icon, ...props }) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
          <Icon size={16} strokeWidth={2.4} />
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`block w-full ${Icon ? 'pl-11' : 'px-4'} py-3 border rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 disabled:bg-gray-50 disabled:text-gray-400 transition-all shadow-inner resize-none ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white'
        }`}
        {...props}
      />
    </div>
  );
}

const emptyForm = { name: '', description: '' }

export default function CandidateCommitteesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { committees, loading } = useSelector(s => s.candidateCommittees)

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchCandidateCommittees())
  }, [dispatch])

  const stats = useMemo(() => ({
    total: committees.length,
    active: committees.filter(c => (c.candidate_count ?? 0) > 0).length,
    totalCandidates: committees.reduce((sum, c) => sum + (c.candidate_count ?? 0), 0)
  }), [committees])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(c) {
    setEditTarget(c)
    setForm({ name: c.name, description: c.description || '' })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editTarget) {
        await dispatch(updateCandidateCommittee({ id: editTarget.id, data: form })).unwrap()
        toast.success('Committee updated')
      } else {
        await dispatch(createCandidateCommittee(form)).unwrap()
        toast.success('Committee created')
      }
      setShowModal(false)
      dispatch(fetchCandidateCommittees())
    } catch (err) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteCandidateCommittee(deleteTarget.id)).unwrap()
      toast.success('Committee deleted')
      setDeleteTarget(null)
      dispatch(fetchCandidateCommittees())
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const filtered = committees.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <MainLayout title="Committee Registry">
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Organizational Units</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Functional Committees</h2>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-900/20 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Committee
          </button>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard title="Total Groups" value={numberFormat(stats.total)} icon={Layers} tone="blue">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered functional bodies</p>
          </MetricCard>
          
          <MetricCard title="Active Assignments" value={numberFormat(stats.active)} icon={Activity} tone="emerald">
             <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Personnel attached</span>
             </div>
          </MetricCard>

          <MetricCard title="Candidate Base" value={numberFormat(stats.totalCandidates)} icon={Users} tone="indigo">
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Total unit members</p>
          </MetricCard>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl bg-gray-50 border border-gray-200 p-6 md:flex-row md:items-center shadow-sm">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by group name or description..."
              value={search}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-12 pr-10 text-sm font-bold text-gray-900 placeholder-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all shadow-inner"
            />
            {search && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
          {loading ? (
            <div className="py-32 flex justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center">
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                <Landmark className="w-12 h-12 text-gray-200" />
              </div>
              <p className="text-gray-900 font-black uppercase tracking-tight text-xl">Registry Silent</p>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">
                {search ? `No matches found for "${search}"` : 'Deploy your first functional committee to begin.'}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] border-separate border-spacing-y-2 px-6 pb-6">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <th className="px-6 py-5 text-left">Committee Identity</th>
                    <th className="px-6 py-5 text-left">Unit Description</th>
                    <th className="px-6 py-5 text-left">Personnel</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {filtered.map((c) => (
                    <tr key={c.id} className="group transition-all duration-200">
                      <td className="rounded-l-2xl bg-white border border-r-0 border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm transition-transform group-hover:scale-105">
                             <Landmark size={20} strokeWidth={2.4} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 tracking-tight">{c.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">ID: {String(c.id).padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-500 max-w-md line-clamp-1 group-hover:line-clamp-none transition-all">
                           {c.description || 'Global operational unit with internal functional scope.'}
                        </p>
                      </td>
                      <td className="bg-white border-y border-gray-100 px-6 py-5 group-hover:bg-gray-50 transition-colors">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                          <Users size={12} strokeWidth={2.4} />
                          {c.candidate_count ?? 0} Members
                        </div>
                      </td>
                      <td className="rounded-r-2xl bg-white border border-l-0 border-gray-100 px-6 py-5 text-right group-hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={() => openEdit(c)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                            title="Modify Unit"
                          >
                            <Edit3 size={16} strokeWidth={2.4} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                            title="Decommission Unit"
                          >
                            <Trash2 size={16} strokeWidth={2.4} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Modify Committee Unit' : 'Add Committee'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-8 py-2">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Basic Info</span>
              </div>
              <Field label="Committee Name" required>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Disciplinary Committee"
                  icon={Landmark}
                />
              </Field>
              <Field label="Unit Description">
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Define the scope and responsibilities of this unit..."
                  icon={MessageSquare}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#1A237E] rounded-lg hover:bg-[#0d1245] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[150px] justify-center"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                editTarget ? 'Update Registry' : 'Add Committee'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Decommission Unit"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action will remove all functional assignments.`}
        confirmLabel="Confirm"
        variant="danger"
      />
    </MainLayout>
  )
}
