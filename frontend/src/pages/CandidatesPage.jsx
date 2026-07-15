import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FaUserTie,
  FaSearch,
  FaPlus,
  FaChevronRight,
} from 'react-icons/fa'
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Edit3,
  ExternalLink,
  Globe,
  Landmark,
  MapPinned,
  MessageSquare,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  Users,
  Vote,
  Check,
  ChevronRight,
  Eye,
  Activity,
  ArrowUpRight,
  Shield,
  Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import FancySelect from '../components/common/FancySelect'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ActionDropdown from '../components/common/ActionDropdown'
import SearchableSelect from '../components/common/SearchableSelect'
import Select from '../components/common/Select'
import useAuth from '../hooks/useAuth'
import { fetchElections } from '../store/slices/electionSlice'
import {
  fetchCandidatesByElection,
  fetchElectionResults,
  addCandidate,
  updateCandidate,
  deleteCandidate
} from '../store/slices/candidateSlice'
import { fetchCandidateCommittees } from '../store/slices/candidateCommitteeSlice'
import { fetchTargets } from '../store/slices/targetSlice'
import ImageUpload from '../components/common/ImageUpload'
import ImageAvatar from '../components/common/ImageAvatar'
import Badge from '../components/common/Badge'

const COMMITTEE_TYPES = [
  { value: 'country', label: 'Working Committee - India', levels: [], icon: Globe },
  { value: 'state', label: 'Pradesh Committee', levels: ['state'], icon: Landmark },
  { value: 'district', label: 'District Committee', levels: ['state', 'district'], icon: MapPinned },
  { value: 'block', label: 'Block Committee', levels: ['state', 'district', 'block'], icon: Users },
  { value: 'booth', label: 'Booth Committee', levels: ['state', 'district', 'block', 'booth'], icon: Hash },
]

const emptyForm = { full_name: '', symbol: '', bio: '', image_url: '', target_id: '' }

function numberFormat(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function compactNumber(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

function MetricCard({ title, value, children, icon: Icon, tone = 'blue' }) {
  const toneMap = {
    blue: { icon: 'text-[#1a337e] bg-blue-50 border-blue-100', text: 'text-[#1a337e]' },
    amber: { icon: 'text-amber-600 bg-amber-50 border-amber-100', text: 'text-amber-600' },
    emerald: { icon: 'text-emerald-600 bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
    indigo: { icon: 'text-[#1a337e] bg-indigo-50 border-indigo-100', text: 'text-[#1a337e]' },
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

function getVoteCount(candidate) {
  return candidate._result?.vote_count ?? candidate.vote_count ?? 0
}

function getVotePercentage(candidate) {
  return candidate._result?.percentage ?? 0
}

// ─── Field Components ────────────────────────────────────────────────────────

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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a337e] transition-colors">
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
        className={`block w-full ${Icon ? 'pl-11' : 'px-4'} py-3 border rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1a337e]/5 focus:border-[#1a337e] disabled:bg-gray-50 disabled:text-gray-400 transition-all shadow-inner ${
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
        <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#1a337e] transition-colors">
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
        className={`block w-full ${Icon ? 'pl-11' : 'px-4'} py-3 border rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1a337e]/5 focus:border-[#1a337e] disabled:bg-gray-50 disabled:text-gray-400 transition-all shadow-inner resize-none ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white'
        }`}
        {...props}
      />
    </div>
  );
}

export default function CandidatesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isAdmin } = useAuth()
  const { elections } = useSelector(s => s.elections)
  const { candidates, results, loading, actionLoading } = useSelector(s => s.candidates)
  const { targets } = useSelector(s => s.targets)

  const [selectedElectionId, setSelectedElectionId] = useState('')

  // CRUD State
  const [showModal, setShowModal] = useState(false)
  const [editCandidateTarget, setEditCandidateTarget] = useState(null)
  const [viewCandidateTarget, setViewCandidateTarget] = useState(null)
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  
  // Hierarchy State
  const [committeeType, setCommitteeType] = useState('state')
  const [selections, setSelections] = useState({
    state: '',
    district: '',
    block: '',
    booth: ''
  })

  useEffect(() => {
    dispatch(fetchElections({}))
    dispatch(fetchTargets())
  }, [dispatch])

  useEffect(() => {
    if (selectedElectionId) {
      dispatch(fetchCandidatesByElection(selectedElectionId))
      dispatch(fetchElectionResults(selectedElectionId))
    }
  }, [selectedElectionId, dispatch])

  const country = useMemo(() => targets.find(t => t.type === 'country'), [targets])

  const openCreate = () => {
    setEditCandidateTarget(null)
    setForm(emptyForm)
    setCommitteeType('state')
    setSelections({ state: '', district: '', block: '', booth: '' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditCandidateTarget(c)
    setForm({
      full_name: c.full_name,
      symbol: c.symbol || '',
      bio: c.bio || '',
      image_url: c.image_url || '',
      image_file: null,
      target_id: c.target_id || ''
    })
    
    // Fill hierarchy selections if target exists
    if (c.target_id) {
       const t = targets.find(i => i.id === c.target_id)
       if (t) {
          setCommitteeType(t.type)
          const newSels = { state: '', district: '', block: '', booth: '' }
          if (t.type === 'state') newSels.state = t.id
          if (t.type === 'district') {
            newSels.district = t.id
            newSels.state = t.parent_id
          }
          if (t.type === 'block') {
            newSels.block = t.id
            const dist = targets.find(i => i.id === t.parent_id)
            newSels.district = t.parent_id
            newSels.state = dist?.parent_id || ''
          }
          if (t.type === 'booth') {
            newSels.booth = t.id
            const block = targets.find(i => i.id === t.parent_id)
            const dist = targets.find(i => i.id === block?.parent_id)
            newSels.block = t.parent_id
            newSels.district = block?.parent_id || ''
            newSels.state = dist?.parent_id || ''
          }
          setSelections(newSels)
       }
    }
    setShowModal(true)
  }

  const handleLevelChange = (level, value) => {
    setSelections(prev => {
      const next = { ...prev, [level]: value }
      if (level === 'state') { next.district = ''; next.block = ''; next.booth = ''; }
      if (level === 'district') { next.block = ''; next.booth = ''; }
      if (level === 'block') { next.booth = ''; }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Determine the target ID from hierarchy
    const activeConfig = COMMITTEE_TYPES.find(c => c.value === committeeType)
    let targetId = null
    if (committeeType === 'country') targetId = country?.id
    else {
      const leafLevel = activeConfig.levels[activeConfig.levels.length - 1]
      targetId = selections[leafLevel]
    }

    if (!targetId && committeeType !== 'country') {
      toast.error('Please complete the location selection')
      return
    }

    try {
      let payload = { ...form, target_id: targetId }
      
      if (form.image_file) {
        const formData = new FormData()
        formData.append('full_name', form.full_name)
        formData.append('symbol', form.symbol || '')
        formData.append('bio', form.bio || '')
        formData.append('target_id', String(targetId))
        formData.append('image', form.image_file)
        if (!editCandidateTarget) formData.append('election_id', String(parseInt(selectedElectionId)))
        payload = formData
      } else {
        const copy = { ...payload }
        delete copy.image_file
        if (!editCandidateTarget) copy.election_id = parseInt(selectedElectionId)
        payload = copy
      }

      if (editCandidateTarget) {
        await dispatch(updateCandidate({ id: editCandidateTarget.id, data: payload })).unwrap()
        toast.success('Candidate updated')
      } else {
        await dispatch(addCandidate(payload)).unwrap()
        toast.success('Candidate added')
      }
      setShowModal(false)
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteCandidateTarget) return
    try {
      await dispatch(deleteCandidate(deleteCandidateTarget.id)).unwrap()
      toast.success('Candidate removed')
      setDeleteCandidateTarget(null)
    } catch (err) {
      toast.error(err || 'Delete failed')
    }
  }

  const selectedElection = elections.find(e => String(e.id) === String(selectedElectionId))

  const rows = useMemo(() => candidates.map(c => ({
    ...c,
    _result: results?.candidates?.find(r => r.candidate_id === c.id)
  })), [candidates, results])

  const totalVotes = useMemo(() => rows.reduce((sum, candidate) => sum + Number(getVoteCount(candidate)), 0), [rows])
  const topShare = useMemo(() => rows.reduce((max, candidate) => Math.max(max, getVotePercentage(candidate)), 0), [rows])

  const activeConfig = COMMITTEE_TYPES.find(c => c.value === committeeType)

  return (
    <MainLayout title="Candidate Registry">
      <div className="mx-auto w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50">
          <div className="flex-1 max-w-xl">
             <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Personnel Operations</span>
             </div>
             <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-6">Candidate Management</h2>
             <Select
                label="Switch Election Context"
                value={selectedElectionId}
                onChange={e => setSelectedElectionId(e.target.value)}
                options={elections.map(e => ({ value: e.id, label: `${e.title} (${e.status.toUpperCase()})` }))}
                placeholder="-- Select Active Node --"
             />
          </div>
          <div className="flex flex-wrap gap-3">
            {selectedElection && (
              <button
                onClick={() => navigate(`/elections/${selectedElectionId}`)}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-600 transition hover:bg-gray-50 active:scale-95 shadow-sm"
                type="button"
              >
                <Eye className="h-4 w-4" />
                Inspect Protocol
              </button>
            )}
            {isAdmin && selectedElection?.status === 'draft' && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1a337e] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#1a337e] shadow-xl shadow-[#1a337e]/20 active:scale-95"
                type="button"
              >
                <Plus className="h-5 w-5" />
                Register Candidate
              </button>
            )}
          </div>
        </header>

        {!selectedElectionId ? (
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-24 text-center shadow-xl shadow-gray-200/50">
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
               <Activity className="h-12 w-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Protocol Offline</h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
               Select an active election context to initialize the candidate registry.
            </p>
          </div>
        ) : loading ? (
          <div className="flex h-64 items-center justify-center bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <MetricCard title="Candidates" value={numberFormat(rows.length)} icon={UserCheck} tone="blue">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authorized personnel</p>
                </MetricCard>
                <MetricCard title="Total Votes" value={compactNumber(totalVotes)} icon={Vote} tone="emerald">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cast to date</p>
                </MetricCard>
                <MetricCard title="Top Share" value={`${topShare.toFixed(1)}%`} icon={BarChart3} tone="amber">
                   <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${topShare}%` }} />
                   </div>
                </MetricCard>
              </div>

              <article className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                   <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-[#1a337e] rounded-full" />
                      <h3 className="text-xl font-black tracking-tight text-gray-900">Candidates</h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      </div>

                      <div className="space-y-4">
                      {candidates.length === 0 ? (
                      <div className="py-20 text-center">
                       <Users className="h-16 w-16 mx-auto opacity-10 text-[#1a337e] mb-4" />
                       <p className="text-sm font-black uppercase tracking-widest text-gray-300">No Candidates Found</p>
                      </div>
                      ) : (
                      rows.map(candidate => (
                      <CandidateProfileCard
                        key={candidate.id}
                        candidate={candidate}
                        canManage={isAdmin && selectedElection?.status === 'draft'}
                        onView={setViewCandidateTarget}
                        onEdit={openEdit}
                        onDelete={setDeleteCandidateTarget}
                      />
                      ))
                      )}
                      </div>
                      </article>
                      </div>

                      <aside className="space-y-8 lg:col-span-4">
                      <section className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
                      <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-6 bg-[#1a337e] rounded-full" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Election Details</h3>
                      </div>
                      <div className="space-y-6">
                      <InfoRow icon={CalendarDays} label="Election" value={selectedElection?.title || '—'} />
                      <div className="flex items-center justify-between">
                       <InfoRow icon={ShieldCheck} label="Status" value={<Badge status={selectedElection?.status} />} />
                      </div>
                      <InfoRow icon={Users} label="Total Candidates" value={`${rows.length} Registered`} />
                      </div>
                      <button
                      type="button"
                      onClick={() => navigate(`/elections/${selectedElectionId}`)}
                      className="mt-8 w-full rounded-2xl py-4 text-xs font-black uppercase tracking-widest text-[#1a337e] bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-95"
                      >
                      View Details
                      </button>
                      </section>

                      <div className="rounded-[2.5rem] bg-[#1a337e] p-8 text-white shadow-2xl shadow-[#1a337e]/30 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                      <TrendingUp size={160} />
                      </div>
                      <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest mt-2 text-indigo-200">Total Votes Cast</p>
                    <div className="mt-8 flex -space-x-3">
                      {rows.slice(0, 5).map(candidate => (
                        <ImageAvatar
                          key={`stack-${candidate.id}`}
                          src={candidate.image_url}
                          name={candidate.full_name}
                          sizeClass="w-12 h-12"
                          imageClassName="border-4 border-[#1a337e] rounded-2xl shadow-lg"
                          fallbackClassName="border-4 border-[#1a337e] bg-[#1a337e] text-white text-sm font-black rounded-2xl shadow-lg"
                        />
                      ))}
                      {rows.length > 5 && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-[#1a337e] bg-[#1a337e] text-[10px] font-black shadow-lg">
                          +{rows.length - 5}
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editCandidateTarget ? 'Edit Candidate' : 'Add Candidate'}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-0" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Column: Identity */}
            <div className="md:col-span-6 p-8 space-y-6 bg-gray-50/50 rounded-tl-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Basic Info</span>
                </div>
                
                <Field label="Full Name" required>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    required
                    placeholder="e.g. Rahul Sharma"
                    icon={User}
                  />
                </Field>

                <Field label="Symbol / Identifier">
                  <Input
                    value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                    placeholder="e.g. Lotus"
                    icon={Trophy}
                  />
                </Field>

                <Field label="Personnel Photo">
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <ImageUpload
                      file={form.image_file}
                      existingUrl={form.image_url}
                      onFileChange={(f) => setForm(prev => ({ ...prev, image_file: f }))}
                      id="candidate-image-input"
                    />
                  </div>
                </Field>

                <Field label="Brief Bio">
                  <Textarea
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Candidate credentials..."
                    icon={MessageSquare}
                  />
                </Field>
              </div>
            </div>

            {/* Right Column: Deployment */}
            <div className="md:col-span-6 p-8 space-y-6 bg-white rounded-tr-2xl border-l border-gray-100">
               <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-[#1a337e] rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">Jurisdictional Path</span>
                </div>

                <div className="grid grid-cols-1 gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                  {COMMITTEE_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => {
                        setCommitteeType(ct.value)
                        setSelections({ state: '', district: '', block: '', booth: '' })
                      }}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 ${
                        committeeType === ct.value 
                          ? 'bg-[#1a337e] text-white font-bold shadow-lg shadow-[#1a337e]/20' 
                          : 'text-gray-500 hover:bg-indigo-50 hover:text-[#1a337e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <ct.icon size={14} />
                         <span className="text-[11px] uppercase tracking-wider">{ct.label.split(' ')[0]} Tier</span>
                      </div>
                      {committeeType === ct.value ? <Check size={14} strokeWidth={3} /> : <ChevronRight size={10} className="opacity-20" />}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 pt-1 border-t border-gray-50 mt-2">
                  {committeeType === 'country' ? (
                    <div className="py-8 text-center space-y-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                       <Globe className="text-[#1a337e] w-8 h-8 mx-auto animate-pulse" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#1a337e]">National Directorate India</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeConfig.levels.includes('state') && (
                        <Field label="Pradesh / State" required>
                          <SearchableSelect
                            placeholder="Select State..."
                            options={targets.filter(t => t.type === 'state')}
                            value={selections.state}
                            onChange={(v) => handleLevelChange('state', v)}
                          />
                        </Field>
                      )}

                      {activeConfig.levels.includes('district') && selections.state && (
                        <Field label="District Unit" required>
                          <SearchableSelect
                            placeholder="Select District..."
                            options={targets.filter(t => t.type === 'district' && t.parent_id === selections.state)}
                            value={selections.district}
                            onChange={(v) => handleLevelChange('district', v)}
                          />
                        </Field>
                      )}

                      {activeConfig.levels.includes('block') && selections.district && (
                        <Field label="Block Unit" required>
                          <SearchableSelect
                            placeholder="Select Block..."
                            options={targets.filter(t => t.type === 'block' && t.parent_id === selections.district)}
                            value={selections.block}
                            onChange={(v) => handleLevelChange('block', v)}
                          />
                        </Field>
                      )}

                      {activeConfig.levels.includes('booth') && selections.block && (
                        <Field label="Booth Unit" required>
                          <SearchableSelect
                            placeholder="Select Booth..."
                            options={targets.filter(t => t.type === 'booth' && t.parent_id === selections.block)}
                            value={selections.booth}
                            onChange={(v) => handleLevelChange('booth', v)}
                          />
                        </Field>
                      )}
                    </div>
                  )}
                </div>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700 transition-colors"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={actionLoading || (activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]])} 
              className="px-10 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#1a337e] rounded-xl hover:brightness-110 shadow-xl shadow-[#1a337e]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                editCandidateTarget ? 'Update Profile' : 'Add Candidate'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCandidateTarget}
        onClose={() => setDeleteCandidateTarget(null)}
        onConfirm={handleDelete}
        title="Remove Candidate"
        message={`Remove "${deleteCandidateTarget?.full_name}" from this election? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
      />

      {/* Candidate Detail Modal */}
      <Modal isOpen={!!viewCandidateTarget} onClose={() => setViewCandidateTarget(null)} title="Candidate Details" size="2xl">
        {viewCandidateTarget && (
          <div className="space-y-8">
            <div className="flex items-start gap-8 pb-8 border-b border-gray-100">
              <ImageAvatar
                src={viewCandidateTarget.image_url}
                name={viewCandidateTarget.full_name}
                sizeClass="w-32 h-32"
                imageClassName="rounded-[2.5rem] border-4 border-white shadow-2xl"
                fallbackClassName="rounded-[2.5rem] border-4 border-white bg-indigo-50 text-[#1a337e] text-5xl font-black shadow-2xl flex items-center justify-center"
              />
              <div className="flex-1 min-w-0 pt-2">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="h-1.5 w-6 rounded-full bg-[#1a337e]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Verified Candidate</span>
                 </div>
                 <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2 truncate">{viewCandidateTarget.full_name}</h3>
                 <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                       <ShieldCheck size={12} strokeWidth={3} />
                       Active
                    </span>
                    {viewCandidateTarget.symbol && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5">
                        <Trophy size={12} strokeWidth={3} />
                        {viewCandidateTarget.symbol}
                      </span>
                    )}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Location Details</p>
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-inner space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#1a337e] shadow-sm">
                             <MapPinned size={18} strokeWidth={2.4} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Area</p>
                             <p className="text-sm font-black text-gray-900">{viewCandidateTarget.target?.name || 'Not set'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[#1a337e] shadow-sm">
                             <Users size={18} strokeWidth={2.4} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Committee Type</p>
                             <p className="text-sm font-black text-gray-900 capitalize">{viewCandidateTarget.target?.type || 'General'}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Voting Stats</p>
                    <div className="bg-[#1a337e] rounded-3xl p-6 shadow-xl shadow-[#1a337e]/20 space-y-4 text-white">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Vote Share</p>
                             <p className="text-3xl font-black tracking-tighter">{(getVotePercentage(viewCandidateTarget)).toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Votes</p>
                             <p className="text-xl font-black">{numberFormat(getVoteCount(viewCandidateTarget))}</p>
                          </div>
                       </div>
                       <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${getVotePercentage(viewCandidateTarget)}%` }} />
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">About Candidate</p>
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative min-h-[200px]">
                       <div className="absolute top-4 right-4 opacity-5">
                          <MessageSquare size={80} />
                       </div>
                       <p className="text-sm font-medium text-gray-600 leading-relaxed relative z-10">
                          {viewCandidateTarget.bio || 'Information about this candidate will be added soon. Check back later for details on their experience and goals.'}
                       </p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-50">
               <button
                 onClick={() => setViewCandidateTarget(null)}
                 className="px-10 py-3 text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
               >
                 Close
               </button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}

function CandidateProfileCard({ candidate, canManage, onView, onEdit, onDelete }) {
  const voteCount = getVoteCount(candidate)
  const votePercentage = getVotePercentage(candidate)

  return (
    <div 
      onClick={() => onView(candidate)}
      className="group relative flex flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:flex-row md:items-center overflow-hidden cursor-pointer active:scale-[0.99]"
    >
      <ImageAvatar
        src={candidate.image_url}
        name={candidate.full_name}
        sizeClass="w-24 h-24"
        imageClassName="rounded-2xl border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
        fallbackClassName="rounded-2xl border border-gray-100 bg-gray-50 text-[#1a337e] text-2xl font-black shadow-inner"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h4 className="truncate text-xl font-black text-gray-900 tracking-tight group-hover:text-[#1a337e] transition-colors">
            {candidate.full_name}
          </h4>
        </div>
        <p className="line-clamp-2 text-sm text-gray-500 font-medium leading-relaxed mb-4">{candidate.bio || 'Professional biography pending synchronization with central registry.'}</p>
        <div className="flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 border border-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500">
            <MapPinned className="h-3.5 w-3.5" />
            {candidate.target?.name || 'No Area Assigned'}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#1a337e]">
            <Vote className="h-3.5 w-3.5" />
            {numberFormat(voteCount)} Votes Recorded
          </div>
          {candidate.symbol && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700">
              <Trophy className="h-3.5 w-3.5" />
              {candidate.symbol}
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col items-end gap-4 md:w-56">
        <div className="w-full">
           <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-[#1a337e] mb-2">
             <span>Vote Share</span>
             <span>{votePercentage.toFixed(1)}%</span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner border border-gray-200">
             <div
               className="bg-[#1a337e] h-full transition-all duration-1000 shadow-lg"
               style={{ width: `${votePercentage}%` }}
             />
           </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          {canManage && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(candidate); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                title="Modify Profile"
              >
                <Edit3 size={16} strokeWidth={2.4} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(candidate); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                title="Remove Registry"
              >
                <Trash2 size={16} strokeWidth={2.4} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-2xl bg-gray-50 text-[#1a337e] border border-gray-100 shadow-sm transition-transform group-hover:scale-110">
        <Icon className="h-6 w-6" strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">{label}</p>
        <div className="truncate font-black text-gray-900 tracking-tight text-lg leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  )
}
