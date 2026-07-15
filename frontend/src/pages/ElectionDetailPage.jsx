import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Filter,
  MapPinned,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  StopCircle,
  Trophy,
  BarChart,
  BarChart3,
  Trash2,
  Users,
  Vote,
  Globe,
  Landmark,
  Check,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { FaPlus, FaChevronRight } from 'react-icons/fa'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Modal from '../components/common/Modal'
import FancySelect from '../components/common/FancySelect'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ActionDropdown from '../components/common/ActionDropdown'
import useAuth from '../hooks/useAuth'
import { fetchElectionById } from '../store/slices/electionSlice'
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
import SearchableSelect from '../components/common/SearchableSelect'

const CHART_COLORS = ['#1a337e', '#1a337e', '#1a337e', '#0891b2', '#059669', '#d97706', '#dc2626']

const COMMITTEE_TYPES = [
  { value: 'country', label: 'Working Committee - India', levels: [] },
  { value: 'state', label: 'Pradesh Committee', levels: ['state'] },
  { value: 'district', label: 'District Committee', levels: ['state', 'district'] },
  { value: 'block', label: 'Block Committee', levels: ['state', 'district', 'block'] },
  { value: 'booth', label: 'Booth Committee', levels: ['state', 'district', 'block', 'booth'] },
]

const emptyForm = { full_name: '', symbol: '', bio: '', image_url: '', image_file: null, committee_id: '', target_id: '' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numberFormat(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function compactNumber(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

function safeFormat(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
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

export default function ElectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAdmin } = useAuth()

  const { currentElection, loading: electionLoading } = useSelector(s => s.elections)
  const { candidates, results, loading: candLoading, actionLoading } = useSelector(s => s.candidates)
  const { committees } = useSelector(s => s.candidateCommittees)
  const { targets } = useSelector(s => s.targets)

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
    dispatch(fetchElectionById(id))
    dispatch(fetchCandidatesByElection(id))
    dispatch(fetchElectionResults(id))
    dispatch(fetchCandidateCommittees())
    dispatch(fetchTargets())
  }, [id, dispatch])

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
      committee_id: c.committee_id || '',
      target_id: c.target_id || ''
    })
    
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
        if (form.committee_id) formData.append('committee_id', String(form.committee_id))
        formData.append('image', form.image_file)
        if (!editCandidateTarget) formData.append('election_id', String(parseInt(id)))
        payload = formData
      } else {
        const copy = { ...payload }
        delete copy.image_file
        if (!editCandidateTarget) copy.election_id = parseInt(id)
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
      dispatch(fetchCandidatesByElection(id))
      dispatch(fetchElectionResults(id))
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
      dispatch(fetchCandidatesByElection(id))
      dispatch(fetchElectionResults(id))
    } catch (err) {
      toast.error(err || 'Delete failed')
    }
  }

  const rankedResults = (results?.candidates || [])
    .slice()
    .sort((a, b) => (a.rank || 999) - (b.rank || 999) || b.vote_count - a.vote_count)
  
  const totalVotes = results?.total_votes ?? 0
  
  const chartData = rankedResults.map(c => ({
    name: c.candidate_name,
    votes: c.vote_count,
    percentage: c.percentage
  }))

  const activeConfig = COMMITTEE_TYPES.find(c => c.value === committeeType)

  if (electionLoading) return <MainLayout title="Election Monitoring" noPadding={true}><LoadingSpinner message="Loading election context..." /></MainLayout>

  return (
    <MainLayout title="Election Control Room" noPadding={true}>
      <div className="w-full px-4 md:px-6 space-y-8 pt-4">
        {/* Header Navigation */}
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/elections')}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-[#1a337e] hover:border-[#1a337e] transition-all shadow-sm group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge status={currentElection?.status} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">ID: {id}</span>
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-[#191c1e]">
                {currentElection?.title}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
             <button
                onClick={() => dispatch(fetchElectionResults(id))}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
             >
                <BarChart className="h-4 w-4" />
                Refresh Results
             </button>
             {isAdmin && currentElection?.status === 'draft' && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 rounded-xl bg-[#1a337e] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-[#1a337e]/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus className="h-5 w-5" />
                  Register Candidate
                </button>
             )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
           {/* Main Content: Results & Chart */}
           <div className="lg:col-span-8 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                 <MetricCard title="Candidates" value={numberFormat(candidates.length)} icon={Users} tone="blue">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total authorized</p>
                 </MetricCard>
                 <MetricCard title="Total Votes" value={compactNumber(totalVotes)} icon={Vote} tone="emerald">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cast in registry</p>
                 </MetricCard>
                 <MetricCard title="Winner Status" value={results?.winner_declared ? 'Declared' : 'Awaiting'} icon={ShieldCheck} tone="amber">
                    <div className="flex items-center gap-2">
                       <div className={`h-1.5 w-1.5 rounded-full ${results?.winner_declared ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Protocol check</span>
                    </div>
                 </MetricCard>
              </div>

              {/* Chart Section */}
              {(currentElection?.status === 'active' || currentElection?.status === 'closed') && chartData.length > 0 && (
                <article className="rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="flex items-center gap-2 text-xl font-black text-[#1a337e]">
                        <BarChart3 className="h-5 w-5" />
                        Vote Distribution
                      </h3>
                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                         <span className="flex items-center gap-1.5"><CircleDot className="h-3 w-3 text-[#1a337e] animate-pulse" /> Live Feed</span>
                      </div>
                   </div>
                   <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                   </div>
                </article>
              )}

              {/* Candidates Registry */}
              <article className="rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 text-xl font-black text-[#1a337e]">
                      <UserCheck className="h-5 w-5" />
                      Candidate Registry
                    </h3>
                    <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                       {candidates.length} Profiles
                    </span>
                 </div>
                 
                 <div className="space-y-4">
                    {candLoading ? (
                      <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : candidates.length === 0 ? (
                      <div className="py-20 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                         <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                         <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No candidates registered.</p>
                      </div>
                    ) : (
                      candidates.map(candidate => (
                        <CandidateProfileCard
                          key={candidate.id}
                          candidate={candidate}
                          result={rankedResults.find(r => r.candidate_id === candidate.id)}
                          canManage={isAdmin && currentElection?.status === 'draft'}
                          onView={setViewCandidateTarget}
                          onEdit={openEdit}
                          onDelete={setDeleteCandidateTarget}
                        />
                      ))
                    )}
                 </div>
              </article>
           </div>

           {/* Sidebar: Context & Actions */}
           <aside className="lg:col-span-4 space-y-8">
              <InfoPanel title="Election Detail" badge={currentElection?.status}>
                 <div className="space-y-4">
                     <InfoRow icon={Globe} label="Jurisdiction" value={
                       currentElection?.targets?.length > 0
                         ? currentElection.targets.length === 1
                           ? `${currentElection.targets[0].name} (${currentElection.targets[0].type})`
                           : `${currentElection.targets.length} Jurisdictions`
                         : currentElection?.target
                           ? `${currentElection.target.name} (${currentElection.target.type})`
                           : 'National Level'
                     } />
                    <InfoRow icon={CalendarDays} label="Start Date" value={safeFormat(currentElection?.start_date)} />
                    <InfoRow icon={Clock3} label="Created At" value={safeFormat(currentElection?.created_at)} />
                 </div>
                 <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</p>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                       "{currentElection?.description || 'No detailed briefing provided for this election.'}"
                    </p>
                 </div>
              </InfoPanel>

              {results?.winner_declared && results?.winner && (
                <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 p-6 text-white shadow-xl shadow-amber-900/20 animate-in zoom-in-95 duration-500">
                   <div className="flex items-center justify-between mb-6">
                      <p className="text-xs font-black uppercase tracking-widest opacity-80">Elected Representative</p>
                      <Trophy className="h-6 w-6 text-white/50" />
                   </div>
                   <div className="flex items-center gap-4">
                      <ImageAvatar
                        src={results.winner.image_url}
                        name={results.winner.candidate_name}
                        sizeClass="w-16 h-16"
                        imageClassName="ring-4 ring-white/20"
                        fallbackClassName="bg-white/20 text-white font-black"
                      />
                      <div>
                         <p className="text-2xl font-black tracking-tight">{results.winner.candidate_name}</p>
                         <p className="text-xs font-bold text-white/70">{results.winner.vote_count.toLocaleString()} Total Votes</p>
                      </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Victory Share</p>
                            <p className="text-xl font-black">{results.winner.percentage.toFixed(1)}%</p>
                         </div>
                         <button onClick={() => navigate('/results')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">Details</button>
                      </div>
                   </div>
                </div>
              )}

               
           </aside>
        </div>
      </div>

      {/* Advanced Candidate Form Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editCandidateTarget ? 'Update Candidate Profile' : 'Register New Candidate'}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-0" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Column: Profile & Info */}
            <div className="md:col-span-6 p-6 space-y-5 bg-gray-50/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-[#1a337e] rounded-full" />
                <p className="text-xs font-black uppercase text-[#1a337e] tracking-widest">Candidate Identity</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1a337e] transition-colors" />
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      required
                      placeholder="Enter legal name"
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[#1a337e] focus:ring-2 focus:ring-[#1a337e]/10 focus:border-[#1a337e] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Symbol / Initial</label>
                  <div className="relative group">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1a337e] transition-colors" />
                    <input
                      type="text"
                      value={form.symbol}
                      onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                      placeholder="e.g. Lotus, Hand, etc."
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[#1a337e] focus:ring-2 focus:ring-[#1a337e]/10 focus:border-[#1a337e] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Candidate Photo</label>
                  <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                    <ImageUpload
                      file={form.image_file}
                      existingUrl={form.image_url}
                      onFileChange={(f) => setForm(prev => ({ ...prev, image_file: f }))}
                      id="candidate-image-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Professional Bio</label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-300 group-focus-within:text-[#1a337e] transition-colors" />
                    <textarea
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      placeholder="Describe candidate's background..."
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#1a337e]/10 focus:border-[#1a337e] outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Jurisdiction */}
            <div className="md:col-span-6 p-6 space-y-6 border-l border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-[#1a337e] rounded-full" />
                <p className="text-xs font-black uppercase text-[#1a337e] tracking-widest">Jurisdictional Scope</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Committee Level</label>
                  <div className="grid grid-cols-1 gap-1.5 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                    {COMMITTEE_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => {
                          setCommitteeType(ct.value)
                          setSelections({ state: '', district: '', block: '', booth: '' })
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                          committeeType === ct.value 
                            ? 'bg-[#1a337e] text-white font-bold shadow-md ring-1 ring-[#1a337e]' 
                            : 'text-gray-500 hover:bg-white hover:text-[#1a337e]'
                        }`}
                      >
                        <span className="text-[11px] uppercase tracking-wider">{ct.label}</span>
                        {committeeType === ct.value ? <Check size={12} /> : <ChevronRight size={10} className="opacity-30" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-1 border-t border-gray-50 mt-2">
                  {committeeType === 'country' ? (
                    <div className="py-8 text-center space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                       <Globe className="text-[#1a337e] w-8 h-8 mx-auto animate-pulse" />
                       <p className="text-xs font-black uppercase text-[#1a337e] tracking-widest">National Level (India)</p>
                       <p className="text-[10px] text-[#1a337e]/70 font-medium">Automatic jurisdiction assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeConfig && activeConfig.levels.includes('state') && (
                        <SearchableSelect
                          label="Pradesh / State"
                          placeholder="Search state..."
                          options={targets.filter(t => t.type === 'state')}
                          value={selections.state}
                          onChange={(v) => handleLevelChange('state', v)}
                        />
                      )}

                      {activeConfig && activeConfig.levels.includes('district') && selections.state && (
                        <SearchableSelect
                          label="District"
                          placeholder="Search district..."
                          options={targets.filter(t => t.type === 'district' && t.parent_id === selections.state)}
                          value={selections.district}
                          onChange={(v) => handleLevelChange('district', v)}
                        />
                      )}

                      {activeConfig && activeConfig.levels.includes('block') && selections.district && (
                        <SearchableSelect
                          label="Block"
                          placeholder="Search block..."
                          options={targets.filter(t => t.type === 'block' && t.parent_id === selections.district)}
                          value={selections.block}
                          onChange={(v) => handleLevelChange('block', v)}
                        />
                      )}

                      {activeConfig && activeConfig.levels.includes('booth') && selections.block && (
                        <SearchableSelect
                          label="Booth"
                          placeholder="Search booth..."
                          options={targets.filter(t => t.type === 'booth' && t.parent_id === selections.block)}
                          value={selections.booth}
                          onChange={(v) => handleLevelChange('booth', v)}
                        />
                      )}
                      
                      {activeConfig && activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]] && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 items-start">
                          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider leading-relaxed">
                            Please complete the geographic path to assign the candidate.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-gray-50">
                  <FancySelect
                    label="Functional Committee"
                    value={form.committee_id}
                    onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                    placeholder="-- No Functional Group --"
                    options={committees.map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              Discard Changes
            </button>
            <button 
              type="submit" 
              disabled={actionLoading} 
              className="px-10 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#1a337e] rounded-xl hover:brightness-110 shadow-xl shadow-[#1a337e]/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FaPlus className="w-3 h-3" />
              )}
              {editCandidateTarget ? 'Update Profile' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCandidateTarget}
        onClose={() => setDeleteCandidateTarget(null)}
        onConfirm={handleDelete}
        title="Remove Candidate"
        message={`Remove "${deleteCandidateTarget?.full_name}" from this election?`}
        confirmLabel="Remove"
        variant="danger"
      />

      {/* Candidate Detail Modal */}
      <Modal isOpen={!!viewCandidateTarget} onClose={() => setViewCandidateTarget(null)} title="Candidate Details" size="2xl">
        {viewCandidateTarget && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
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
                             <p className="text-3xl font-black tracking-tighter">{(rankedResults.find(r => r.candidate_id === viewCandidateTarget.id)?.percentage || 0).toFixed(1)}%</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Votes</p>
                             <p className="text-xl font-black">{numberFormat(rankedResults.find(r => r.candidate_id === viewCandidateTarget.id)?.vote_count || 0)}</p>
                          </div>
                       </div>
                       <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${rankedResults.find(r => r.candidate_id === viewCandidateTarget.id)?.percentage || 0}%` }} />
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

function CandidateProfileCard({ candidate, result, canManage, onView, onEdit, onDelete }) {
  const voteCount = result?.vote_count ?? 0
  const votePercentage = result?.percentage ?? 0
  const isWinner = result?.is_winner

  return (
    <div 
      onClick={() => onView(candidate)}
      className={`flex flex-col gap-6 rounded-2xl border p-4 transition-all hover:shadow-md md:flex-row md:items-center cursor-pointer active:scale-[0.99] ${
        isWinner ? 'border-amber-300 bg-amber-50/30' : 'border-[#e2e8f0] bg-white'
      }`}
    >
      <div className="relative">
        <ImageAvatar
          src={candidate.image_url}
          name={candidate.full_name}
          sizeClass="w-20 h-20"
          imageClassName="rounded-xl border border-[#e2e8f0] object-cover"
          fallbackClassName="rounded-xl border border-[#e2e8f0] bg-slate-100 text-[#1a337e] text-xl font-black"
        />
        {isWinner && (
           <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg">
              <Trophy size={14} />
           </div>
        )}
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <h4 className="truncate text-lg font-black text-slate-800">{candidate.full_name}</h4>
          {candidate.committee?.name && (
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1a337e] border border-blue-100">
              {candidate.committee.name}
            </span>
          )}
          {isWinner && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 border border-amber-200">
               Winner
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-[#64748b]">{candidate.bio || 'No biography has been provided.'}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#64748b]">
          <span className="inline-flex items-center gap-1">
            <MapPinned className="h-3.5 w-3.5 text-[#1a337e]" />
            {candidate.target?.name || 'No area assigned'}
          </span>
          <span className="inline-flex items-center gap-1 text-[#1a337e]">
            <Vote className="h-3.5 w-3.5" />
            {compactNumber(voteCount)} votes
          </span>
          {candidate.symbol && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              {candidate.symbol}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex w-full items-center gap-3 md:w-44">
        <div className="w-full">
           <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-black uppercase">
              <span>{votePercentage.toFixed(1)}% Share</span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#1a337e] h-full transition-all duration-1000"
                style={{ width: `${votePercentage}%` }}
              />
           </div>
        </div>
        {canManage && (
          <div onClick={e => e.stopPropagation()}>
            <ActionDropdown
              align="right"
              actions={[
                { key: 'edit', label: 'Edit', icon: Edit3, onClick: () => onEdit(candidate) },
                { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete(candidate) },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function InfoPanel({ title, badge, children }) {
  return (
    <section className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <h3 className="mb-6 flex items-center justify-between text-lg font-black text-slate-800">
        {title}
        {badge && <Badge status={badge} />}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-slate-50 text-[#1a337e] border border-gray-100 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">{label}</p>
        <p className="truncate font-bold text-slate-800 text-sm">{value || '—'}</p>
      </div>
    </div>
  )
}
