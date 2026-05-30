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
  Trophy,
  UserCheck,
  Users,
  Vote,
  Check,
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

const COMMITTEE_TYPES = [
  { value: 'country', label: 'Working Committee - India', levels: [] },
  { value: 'state', label: 'Pradesh Committee', levels: ['state'] },
  { value: 'district', label: 'District Committee', levels: ['state', 'district'] },
  { value: 'block', label: 'Block Committee', levels: ['state', 'district', 'block'] },
  { value: 'booth', label: 'Booth Committee', levels: ['state', 'district', 'block', 'booth'] },
]

const emptyForm = { full_name: '', symbol: '', bio: '', image_url: '', committee_id: '', target_id: '' }

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

function compactNumber(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

function getVoteCount(candidate) {
  return candidate._result?.vote_count ?? candidate.vote_count ?? 0
}

function getVotePercentage(candidate) {
  return candidate._result?.percentage ?? 0
}

export default function CandidatesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isAdmin } = useAuth()
  const { elections } = useSelector(s => s.elections)
  const { candidates, results, loading, actionLoading } = useSelector(s => s.candidates)
  const { committees } = useSelector(s => s.candidateCommittees)
  const { targets } = useSelector(s => s.targets)

  const [selectedElectionId, setSelectedElectionId] = useState('')

  // CRUD State
  const [showModal, setShowModal] = useState(false)
  const [editCandidateTarget, setEditCandidateTarget] = useState(null)
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
    dispatch(fetchCandidateCommittees())
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
      committee_id: c.committee_id || '',
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
        if (form.committee_id) formData.append('committee_id', String(form.committee_id))
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

  const rows = candidates.map(c => ({
    ...c,
    _result: results?.candidates?.find(r => r.candidate_id === c.id)
  }))

  const totalVotes = rows.reduce((sum, candidate) => sum + Number(getVoteCount(candidate)), 0)
  const topShare = rows.reduce((max, candidate) => Math.max(max, getVotePercentage(candidate)), 0)

  const activeConfig = COMMITTEE_TYPES.find(c => c.value === committeeType)

  return (
    <MainLayout title="Candidates Management">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
               <Select
                  label="Select Election"
                  value={selectedElectionId}
                  onChange={e => setSelectedElectionId(e.target.value)}
                  options={elections.map(e => ({ value: e.id, label: `${e.title} (${e.status})` }))}
                  placeholder="-- Choose an election --"
               />
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2 pb-0.5">
              {selectedElection && (
                <button
                  onClick={() => navigate(`/elections/${selectedElectionId}`)}
                  className="flex items-center gap-2 rounded-xl border border-[#1a365d]/30 px-4 py-2.5 text-sm font-semibold text-[#1a365d] transition hover:bg-[#dbeafe]"
                  type="button"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Details
                </button>
              )}
              {isAdmin && selectedElection?.status === 'draft' && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 rounded-xl bg-[#1A237E] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition hover:brightness-110 active:scale-95"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add Candidate
                </button>
              )}
            </div>
          </div>
        </section>

        {!selectedElectionId ? (
          <EmptyState
            icon={<FaUserTie className="h-12 w-12 text-gray-300" />}
            title="Select an Election"
            message="Choose an election above to view its candidates."
          />
        ) : loading ? (
          <LoadingSpinner message="Loading candidates..." />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={<FaUserTie className="h-12 w-12 text-gray-300" />}
            title="No Candidates"
            message="No candidates have been added to this election yet."
            action={
              selectedElection?.status === 'draft' && (
                <button
                  onClick={() => navigate(`/elections/${selectedElectionId}`)}
                  className="rounded-lg bg-[#1a365d] px-4 py-2 text-sm text-white hover:brightness-110"
                >
                  Add Candidates
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <MetricCard icon={UserCheck} label="Candidates" value={rows.length} tone="blue" />
                  <MetricCard icon={Vote} label="Recorded Votes" value={compactNumber(totalVotes)} tone="green" />
                  <MetricCard icon={BarChart3} label="Top Share" value={`${topShare.toFixed(1)}%`} tone="orange" />
                </div>

                <article className="rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
                  <h3 className="mb-6 flex items-center gap-2 text-xl font-black text-[#1a365d]">
                    <UserCheck className="h-5 w-5" />
                    Candidate Registry
                  </h3>
                  <div className="space-y-4">
                    {rows.map(candidate => (
                      <CandidateProfileCard
                        key={candidate.id}
                        candidate={candidate}
                        canManage={isAdmin && selectedElection?.status === 'draft'}
                        onEdit={openEdit}
                        onDelete={setDeleteCandidateTarget}
                      />
                    ))}
                  </div>
                </article>
              </div>

              <aside className="space-y-8 lg:col-span-4">
                <InfoPanel title="Election Context" badge={selectedElection?.status || 'Selected'}>
                  <div className="space-y-4">
                    <InfoRow icon={CalendarDays} label="Election" value={selectedElection?.title || '—'} />
                    <InfoRow icon={ShieldCheck} label="Status" value={selectedElection?.status || '—'} />
                    <InfoRow icon={Users} label="Candidates" value={rows.length} />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/elections/${selectedElectionId}`)}
                    className="mt-6 w-full rounded-xl border border-[#cbd5e1] py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    View Election Details
                  </button>
                </InfoPanel>

                <InfoPanel title="Committees">
                  <div className="space-y-3">
                    {rows.slice(0, 4).map(candidate => (
                      <div key={`committee-${candidate.id}`} className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#1a365d]">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">{candidate.committee?.name || 'No committee assigned'}</p>
                          <p className="truncate text-xs text-[#64748b]">{candidate.full_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoPanel>

                <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-[#1a365d] p-6 text-white">
                  <p className="mb-2 text-xs font-bold uppercase opacity-60">Election Impact</p>
                  <p className="mb-4 text-3xl font-black tracking-tight">{compactNumber(totalVotes)}</p>
                  <p className="text-sm leading-snug opacity-80">Votes currently represented across the selected candidate field.</p>
                  <div className="mt-6 flex -space-x-3">
                    {rows.slice(0, 3).map(candidate => (
                      <ImageAvatar
                        key={`stack-${candidate.id}`}
                        src={candidate.image_url}
                        name={candidate.full_name}
                        sizeClass="w-10 h-10"
                        imageClassName="border-2 border-[#1a365d]"
                        fallbackClassName="border-2 border-[#1a365d] bg-slate-700 text-white text-xs"
                      />
                    ))}
                    {rows.length > 3 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1a365d] bg-slate-700 text-[10px] font-bold">
                        +{rows.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

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
                <div className="w-1.5 h-6 bg-[#1A237E] rounded-full" />
                <p className="text-xs font-black uppercase text-[#1A237E] tracking-widest">Candidate Identity</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1A237E] transition-colors" />
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      required
                      placeholder="Enter legal name"
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[#1066b1] focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Symbol / Initial</label>
                  <div className="relative group">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#1A237E] transition-colors" />
                    <input
                      type="text"
                      value={form.symbol}
                      onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                      placeholder="e.g. Lotus, Hand, etc."
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[#1066b1] focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E] outline-none transition-all"
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
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-300 group-focus-within:text-[#1A237E] transition-colors" />
                    <textarea
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      placeholder="Describe candidate's background..."
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#1A237E]/10 focus:border-[#1A237E] outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Jurisdiction */}
            <div className="md:col-span-6 p-6 space-y-6 border-l border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-[#1A237E] rounded-full" />
                <p className="text-xs font-black uppercase text-[#1A237E] tracking-widest">Jurisdictional Scope</p>
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
                            ? 'bg-[#1A237E] text-white font-bold shadow-md ring-1 ring-[#1A237E]' 
                            : 'text-gray-500 hover:bg-white hover:text-[#1A237E]'
                        }`}
                      >
                        <span className="text-[11px] uppercase tracking-wider">{ct.label}</span>
                        {committeeType === ct.value ? <Check size={12} /> : <FaChevronRight size={10} className="opacity-30" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-1 border-t border-gray-50 mt-2">
                  {committeeType === 'country' ? (
                    <div className="py-8 text-center space-y-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                       <Globe className="text-[#1A237E] w-8 h-8 mx-auto animate-pulse" />
                       <p className="text-xs font-black uppercase text-[#1A237E] tracking-widest">National Level (India)</p>
                       <p className="text-[10px] text-blue-600/70 font-medium">Automatic jurisdiction assignment</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      {activeConfig.levels.includes('state') && (
                        <SearchableSelect
                          label="Pradesh / State"
                          placeholder="Search state..."
                          options={targets.filter(t => t.type === 'state')}
                          value={selections.state}
                          onChange={(v) => handleLevelChange('state', v)}
                        />
                      )}

                      {activeConfig.levels.includes('district') && selections.state && (
                        <SearchableSelect
                          label="District"
                          placeholder="Search district..."
                          options={targets.filter(t => t.type === 'district' && t.parent_id === selections.state)}
                          value={selections.district}
                          onChange={(v) => handleLevelChange('district', v)}
                        />
                      )}

                      {activeConfig.levels.includes('block') && selections.district && (
                        <SearchableSelect
                          label="Block"
                          placeholder="Search block..."
                          options={targets.filter(t => t.type === 'block' && t.parent_id === selections.district)}
                          value={selections.block}
                          onChange={(v) => handleLevelChange('block', v)}
                        />
                      )}

                      {activeConfig.levels.includes('booth') && selections.block && (
                        <SearchableSelect
                          label="Booth"
                          placeholder="Search booth..."
                          options={targets.filter(t => t.type === 'booth' && t.parent_id === selections.block)}
                          value={selections.booth}
                          onChange={(v) => handleLevelChange('booth', v)}
                        />
                      )}
                      
                      {activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]] && (
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
              className="px-10 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#1A237E] rounded-xl hover:brightness-110 shadow-xl shadow-[#1A237E]/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
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
    </MainLayout>
  )
}

function MetricCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-[#1a365d]',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <div className={`rounded-xl p-3 ${toneClasses[tone] || toneClasses.blue}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#64748b]">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function CandidateProfileCard({ candidate, canManage, onEdit, onDelete }) {
  const voteCount = getVoteCount(candidate)
  const votePercentage = getVotePercentage(candidate)

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[#e2e8f0] bg-white p-4 transition-shadow hover:shadow-md md:flex-row md:items-center">
      <ImageAvatar
        src={candidate.image_url}
        name={candidate.full_name}
        sizeClass="w-20 h-20"
        imageClassName="rounded-xl border border-[#e2e8f0] object-cover"
        fallbackClassName="rounded-xl border border-[#e2e8f0] bg-slate-100 text-[#1a365d] text-xl font-black"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <h4 className="truncate text-lg font-black text-slate-800">{candidate.full_name}</h4>
          {candidate.committee?.name && (
            <span className="rounded bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#334155]">
              {candidate.committee.name}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-[#64748b]">{candidate.bio || 'No biography has been provided.'}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#64748b]">
          <span className="inline-flex items-center gap-1">
            <MapPinned className="h-3.5 w-3.5" />
            {candidate.target?.name || 'No area assigned'}
          </span>
          <span className="inline-flex items-center gap-1 text-[#1a365d]">
            <Vote className="h-3.5 w-3.5" />
            {formatNumber(voteCount)} votes
          </span>
          {candidate.symbol && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              {candidate.symbol}
            </span>
          )}
        </div>
      </div>
      <div className="flex w-full items-center gap-3 md:w-44">
        <VoteShare result={{ percentage: votePercentage }} />
        {canManage && (
          <ActionDropdown
            align="right"
            actions={[
              { key: 'edit', label: 'Edit', icon: Edit3, onClick: () => onEdit(candidate) },
              { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete(candidate) },
            ]}
          />
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
        {badge && <span className="rounded-md bg-[#dbeafe] px-2 py-1 text-xs font-bold capitalize text-[#1a365d]">{badge}</span>}
      </h3>
      {children}
    </section>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-slate-100 text-[#1a365d]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#64748b]">{label}</p>
        <p className="truncate font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function CandidateIdentity({ candidate }) {
  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <ImageAvatar
        src={candidate.image_url}
        name={candidate.full_name}
        sizeClass="w-10 h-10"
        imageClassName="ring-1 ring-gray-200"
        fallbackClassName="bg-gray-100 text-gray-900 text-sm ring-1 ring-gray-200"
      />
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 truncate">{candidate.full_name}</p>
        {candidate.bio && <p className="text-xs text-gray-500 truncate max-w-xs">{candidate.bio}</p>}
      </div>
    </div>
  )
}

function VoteShare({ result }) {
  const value = result?.percentage ?? 0
  return (
    <div className="w-24">
      <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-medium">
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-[rgb(16_102_177)] h-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
