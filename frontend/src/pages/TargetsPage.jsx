import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaMapMarkerAlt, FaSearch, FaChevronRight, FaChevronDown, FaEdit, FaTrash } from 'react-icons/fa'
import { Check, Building2, Globe, TrendingUp, MapPin, Layers, Users, Shield, Hash, AlertTriangle, ChevronRight, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SearchableSelect from '../components/common/SearchableSelect'
import { fetchTargets, createTarget, updateTarget, deleteTarget } from '../store/slices/targetSlice'
import { fetchPlatformStats, selectPlatformStats } from '../store/slices/tenantSlice'
import { fetchUsers, selectUsers } from '../store/slices/userSlice'

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

function Field({ label, required, children, hint, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled, required, hasError, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`block w-full px-3 py-2 border rounded-lg text-sm text-[#1066b1] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
      }`}
      {...props}
    />
  );
}

const COMMITTEE_TYPES = [
  { value: 'country', label: 'Working Committee - India', levels: [], icon: Globe, color: 'text-indigo-600 bg-indigo-50' },
  { value: 'state', label: 'Pradesh Committee', levels: ['state'], icon: MapPin, color: 'text-blue-600 bg-blue-50' },
  { value: 'district', label: 'District Committee', levels: ['state', 'district'], icon: Layers, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'block', label: 'Block Committee', levels: ['state', 'district', 'block'], icon: Users, color: 'text-amber-600 bg-amber-50' },
  { value: 'booth', label: 'Booth Committee', levels: ['state', 'district', 'block', 'booth'], icon: Hash, color: 'text-rose-600 bg-rose-50' },
]

// ─── Recursive Committee Node Component ───────────────────────────────────────

function CommitteeNode({ node, childrenMap, onEdit, onDelete, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(level < 1) 
  const children = childrenMap[node.id] || []
  const hasChildren = children.length > 0

  const typeConfig = COMMITTEE_TYPES.find(ct => ct.value === node.type)
  const Icon = typeConfig?.icon || Shield

  return (
    <div className="select-none">
      <div 
        className={`flex items-center justify-between group py-3 px-5 rounded-2xl transition-all duration-300 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-lg ${level === 0 ? 'bg-indigo-50/30' : ''}`}
      >
        <div className="flex items-center gap-4 flex-1">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg border transition-all duration-300 ${isExpanded ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'}`}
              type="button"
            >
              {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
            </button>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-gray-200 group-hover:bg-gray-400 transition-colors" />
            </div>
          )}
          
          <div className="flex items-center gap-3 min-w-0">
             <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-transparent shadow-sm transition-transform group-hover:scale-110 ${typeConfig?.color || 'bg-gray-50 text-gray-600'}`}>
                <Icon className="h-5 w-5" strokeWidth={2.4} />
             </div>
             <div className="flex flex-col">
               <span className="font-black text-gray-900 tracking-tight truncate">{node.name}</span>
               <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                    {typeConfig ? typeConfig.label : node.type}
                 </span>
                 {node.president && (
                   <>
                     <span className="text-gray-300">•</span>
                     <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                       <UserCheck size={10} /> {node.president.full_name}
                     </span>
                   </>
                 )}
               </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={() => onEdit(node)}
            className="flex h-9 w-9 items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm shadow-blue-100"
            title="Edit"
            type="button"
          >
            <FaEdit size={12} />
          </button>
          <button 
            onClick={() => onDelete(node)}
            className="flex h-9 w-9 items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm shadow-red-100"
            title="Delete"
            type="button"
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-8 mt-2 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-0 top-0 bottom-4 w-0.5 bg-gradient-to-b from-gray-200 to-transparent rounded-full" style={{ left: '-18px' }} />
          
          <div className="space-y-2">
            {children.map(child => (
              <div key={child.id} className="relative">
                {/* Horizontal connecting line */}
                <div className="absolute left-0 top-6 w-4 h-0.5 bg-gray-200 rounded-full" style={{ left: '-18px' }} />
                
                <CommitteeNode 
                  node={child} 
                  childrenMap={childrenMap} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  level={level + 1} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline Creation Modal ─────────────────────────────────────────────────────

function InlineAddModal({ isOpen, onClose, type, onSave, loading, initialName }) {
  const [name, setName] = useState(initialName || '')

  useEffect(() => { 
    if (isOpen) {
      setName(initialName || '')
    }
  }, [isOpen, initialName])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        <Field label={`${type} Name`} required>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1A237E]/10 outline-none transition-all shadow-inner"
            placeholder={`e.g. ${type === 'state' ? 'Maharashtra' : 'New Area'}`}
            required
          />
        </Field>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700 transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="bg-[#1A237E] text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-[#1A237E]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Committee Modal ──────────────────────────────────────────────────────

function EditCommitteeModal({ isOpen, onClose, target, onSave, loading, availablePresidents }) {
  const [name, setName] = useState('')
  const [presidentId, setPresidentId] = useState('')

  useEffect(() => {
    if (isOpen && target) {
      setName(target.name)
      setPresidentId(target.president_id || '')
    }
  }, [isOpen, target])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ name: name.trim(), president_id: presidentId ? parseInt(presidentId) : null })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modify Committee Unit" size="md">
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        <Field label="Committee Name" required>
           <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all shadow-inner"
            required
          />
        </Field>

        <Field label="Committee President" hint="Exclusive leadership assignment.">
          <SearchableSelect
            placeholder="Select President..."
            options={availablePresidents.map(u => ({ id: u.id, name: `${u.full_name} (${u.email})` }))}
            value={presidentId}
            onChange={setPresidentId}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase text-gray-400 hover:text-gray-700 transition-all">Cancel</button>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-indigo-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Update Registry'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { targets, loading } = useSelector(s => s.targets)
  const users = useSelector(selectUsers)
  const platformStats = useSelector(selectPlatformStats)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState(null)
  
  // Selection Flow State
  const [committeeType, setCommitteeType] = useState('state')
  const [selections, setSelections] = useState({
    country: '',
    state: '',
    district: '',
    block: '',
    booth: '',
    president_id: ''
  })
  
  // Inline Creation State
  const [inlineModal, setInlineAdd] = useState({ open: false, type: '', parentId: null, name: '' })
  const [inlineSubmitting, setInlineSubmitting] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchTargets())
    dispatch(fetchPlatformStats())
    dispatch(fetchUsers({ limit: 1000 }))
  }, [dispatch])

  // Performance Optimization: Children Map
  const childrenMap = useMemo(() => {
    const map = {}
    targets.forEach(t => {
      if (t.parent_id) {
        if (!map[t.parent_id]) map[t.parent_id] = []
        map[t.parent_id].push(t)
      }
    })
    return map
  }, [targets])

  // Hierarchical Data Processing
  const rootNodes = useMemo(() => targets.filter(t => !t.parent_id), [targets])
  const states = useMemo(() => targets.filter(t => t.type === 'state'), [targets])
  const districts = useMemo(() => targets.filter(t => t.type === 'district'), [targets])
  const blocks = useMemo(() => targets.filter(t => t.type === 'block'), [targets])
  const country = useMemo(() => targets.find(t => t.type === 'country'), [targets])

  function resetFlow() {
    setSelections({ country: '', state: '', district: '', block: '', booth: '', president_id: '' })
  }

  function openCreate() {
    setCommitteeType('state')
    resetFlow()
    setShowAddModal(true)
  }

  function openEdit(t) {
    setEditTarget(t)
    setShowEditModal(true)
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

  const handleInlineSave = async (name) => {
    setInlineSubmitting(true)
    try {
      const res = await dispatch(createTarget({ 
        name: name.trim(), 
        type: inlineModal.type, 
        parent_id: inlineModal.parentId
      })).unwrap()
      toast.success('Entity added successfully')
      handleLevelChange(inlineModal.type, res.id)
      dispatch(fetchTargets())
      setInlineAdd({ open: false, type: '', parentId: null, name: '' })
    } catch (err) {
      toast.error(err?.message || 'Failed to add entity')
    } finally {
      setInlineSubmitting(false)
    }
  }

  async function handleAddSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    
    let parentId = null
    let derivedName = ''

    if (committeeType === 'country') {
      parentId = null
      derivedName = targets.find(t => String(t.id) === String(selections.country))?.name || 'Working Committee'
    } else if (committeeType === 'state') {
      parentId = selections.country || country?.id
      derivedName = states.find(s => String(s.id) === String(selections.state))?.name || 'New State'
    } else if (committeeType === 'district') {
      parentId = selections.state
      derivedName = districts.find(d => String(d.id) === String(selections.district))?.name || 'New District'
    } else if (committeeType === 'block') {
      parentId = selections.district
      derivedName = blocks.find(b => String(b.id) === String(selections.block))?.name || 'New Block'
    } else if (committeeType === 'booth') {
      parentId = selections.block
      derivedName = targets.find(b => String(b.id) === String(selections.booth))?.name || 'New Booth'
    }

    const finalData = { 
      name: derivedName, 
      type: committeeType,
      parent_id: parentId ? parseInt(parentId) : null
    }

    try {
      await dispatch(createTarget(finalData)).unwrap()
      toast.success('Committee created')
      setShowAddModal(false)
      dispatch(fetchTargets())
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSubmit = async (updatedData) => {
    setSubmitting(true)
    try {
      await dispatch(updateTarget({ id: editTarget.id, data: updatedData })).unwrap()
      toast.success('Committee updated')
      setShowEditModal(false)
      dispatch(fetchTargets())
    } catch (err) {
      toast.error(err?.message || 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteTarget(deleteTargetItem.id)).unwrap()
      toast.success('Committee deleted')
      setDeleteTargetItem(null)
      dispatch(fetchTargets())
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const filtered = targets.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.type || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeConfig = COMMITTEE_TYPES.find(c => c.value === committeeType)

  const availablePresidents = useMemo(() => {
    const assignedIds = targets
      .map(t => t.president_id)
      .filter(id => id && (!editTarget || id !== editTarget.president_id))
    
    return users.filter(u => !assignedIds.includes(u.id))
  }, [users, targets, editTarget])

  const statsData = useMemo(() => ({
    total: targets.length,
    states: targets.filter(t => t.type === 'state').length,
    districts: targets.filter(t => t.type === 'district').length,
    blocks: targets.filter(t => t.type === 'block').length,
    booths: targets.filter(t => t.type === 'booth').length,
  }), [targets]);

  return (
    <MainLayout title="Committee Management">
      <div className="w-full space-y-8">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <MetricCard
            title="Total Committees"
            icon={Layers}
            tone="blue"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(statsData.total)}</span>
                <span className="mb-1 flex items-center text-xs font-bold text-indigo-600">
                  Committees
                </span>
              </>
            }
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered across all committees</p>
          </MetricCard>

          <MetricCard
            title="Pradesh committees"
            icon={MapPin}
            tone="indigo"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(statsData.states)}</span>
                <span className="mb-1 text-xs font-bold text-indigo-600">States</span>
              </>
            }
          >
             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (statsData.states / 36) * 100)}%` }} />
             </div>
          </MetricCard>

          <MetricCard
            title="District committees"
            icon={Layers}
            tone="emerald"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(statsData.districts)}</span>
                <span className="mb-1 text-xs font-bold text-emerald-600">District</span>
              </>
            }
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified jurisdictional bodies</p>
          </MetricCard>

          <MetricCard
            title="Ground Reach"
            icon={Users}
            tone="amber"
            value={
              <>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{numberFormat(statsData.blocks + statsData.booths)}</span>
                <span className="mb-1 text-xs font-bold text-amber-600">Local</span>
              </>
            }
          >
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                <span className="text-amber-600">{statsData.blocks} Blocks</span>
                <span className="text-gray-300">•</span>
                <span className="text-amber-600">{statsData.booths} Booths</span>
             </div>
          </MetricCard>
        </section>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-8">
          <div className="relative w-full md:w-96 group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search by name or type..."
              value={search}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
          </div>
          <button
            onClick={openCreate}
            className="w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-700 shadow-xl shadow-indigo-900/20 active:scale-95 transition-all"
          >
            <FaPlus className="h-4 w-4" /> Add Committee
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-inner">
                    <Globe className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-gray-900">Organization Tree</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Jurisdictional Hierarchy</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-indigo-600 leading-none">{targets.length}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Nodes Active</span>
                </div>
              </div>

              <div className="p-6 bg-gray-50/30 rounded-3xl border border-gray-200 shadow-sm min-h-[500px]">
                {loading ? (
                  <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                ) : rootNodes.length === 0 ? (
                  <div className="py-20 text-center">
                     <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10 text-gray-200" />
                     </div>
                     <p className="text-gray-400 font-black uppercase tracking-widest text-sm opacity-40">Empty Hierarchy</p>
                     <p className="text-xs text-gray-400 mt-1">Initialize your first committee to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {rootNodes.map(node => (
                       <CommitteeNode 
                          key={node.id} 
                          node={node} 
                          childrenMap={childrenMap} 
                          onEdit={openEdit} 
                          onDelete={setDeleteTargetItem} 
                       />
                     ))}
                  </div>
                )}
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Hierarchy Legend</h3>
                 </div>
                 <div className="space-y-3">
                    {COMMITTEE_TYPES.map(ct => {
                      const count = targets.filter(t => t.type === ct.value).length
                      const TypeIcon = ct.icon
                      return (
                        <div key={ct.value} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all">
                           <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${ct.color}`}>
                                <TypeIcon size={14} strokeWidth={2.4} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-gray-500">{ct.label.split(' ')[0]}</span>
                           </div>
                           <span className="text-xs font-black text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100">
                              {count}
                           </span>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="bg-indigo-600 text-white rounded-3xl p-8 shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp size={160} />
                 </div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                       <TrendingUp className="text-white w-7 h-7" />
                    </div>
                    <h4 className="text-xl font-black tracking-tight">Coverage Insight</h4>
                    <p className="text-sm text-indigo-100/70 mt-3 leading-relaxed font-medium">Your platform currently oversees <span className="text-white font-bold">{states.length} States</span> and <span className="text-white font-bold">{blocks.length} Blocks</span> across the national network.</p>
                    <button 
                      onClick={() => navigate('/audit-logs')}
                      className="mt-8 w-full py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                    >
                      Inspect Audit logs
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Committee" size="3xl">
        <form onSubmit={handleAddSubmit} className="space-y-0" autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left Column: Classification */}
            <div className="md:col-span-6 p-8 space-y-6 bg-gray-50/50 rounded-tl-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Classification</span>
                </div>
                <div className="grid grid-cols-1 gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                  {COMMITTEE_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => {
                        setCommitteeType(ct.value)
                        resetFlow()
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                        committeeType === ct.value 
                          ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-900/20 scale-[1.02]' 
                          : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <ct.icon size={14} strokeWidth={committeeType === ct.value ? 3 : 2} />
                         <span className="text-[11px] uppercase tracking-wider">{ct.label.split(' ')[0]} Committee</span>
                      </div>
                      {committeeType === ct.value ? <Check size={14} strokeWidth={3} /> : <ChevronRight size={10} className="opacity-20" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Deployment */}
            <div className="md:col-span-6 p-8 space-y-6 bg-white rounded-tr-2xl border-l border-gray-100">
               <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Jurisdictional Deployment</span>
                </div>
               
                {committeeType === 'country' ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95">
                    <Field label="National Node" required>
                        <SearchableSelect
                          placeholder="Select National Committee..."
                          options={targets.filter(t => t.type === 'country')}
                          value={selections.country}
                          onChange={(v) => setSelections(s => ({ ...s, country: v }))}
                          onAddNew={(name) => setInlineAdd({ open: true, type: 'country', parentId: null, name })}
                        />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeConfig.levels.includes('state') && (
                      <Field label="Pradesh / State" required>
                          <SearchableSelect
                            placeholder="Select State..."
                            options={targets.filter(t => t.type === 'state')}
                            value={selections.state}
                            onChange={(v) => handleLevelChange('state', v)}
                            onAddNew={(name) => setInlineAdd({ open: true, type: 'state', parentId: country?.id, name })}
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
                            onAddNew={(name) => setInlineAdd({ open: true, type: 'district', parentId: selections.state, name })}
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
                            onAddNew={(name) => setInlineAdd({ open: true, type: 'block', parentId: selections.district, name })}
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
                            onAddNew={(name) => setInlineAdd({ open: true, type: 'booth', parentId: selections.block, name })}
                          />
                      </Field>
                    )}

                    {activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]] && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 animate-pulse">
                          <AlertTriangle className="shrink-0 w-4 h-4 mt-0.5" />
                          <span className="text-[10px] uppercase font-black tracking-widest leading-relaxed">System requires a complete hierarchical path for confirmation.</span>
                        </div>
                    )}
                  </div>
                )}
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || inlineSubmitting || (activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]])}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#1A237E] rounded-lg hover:bg-[#0d1245] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 min-w-[150px] justify-center"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Add Committee'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <EditCommitteeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        target={editTarget}
        onSave={handleUpdateSubmit}
        loading={submitting}
        availablePresidents={availablePresidents}
      />

      <InlineAddModal
        isOpen={inlineModal.open}
        onClose={() => setInlineAdd({ ...inlineModal, open: false })}
        type={inlineModal.type}
        parentId={inlineModal.parentId}
        initialName={inlineModal.name}
        onSave={handleInlineSave}
        loading={inlineSubmitting}
      />

      <ConfirmDialog
        isOpen={!!deleteTargetItem}
        onClose={() => setDeleteTargetItem(null)}
        onConfirm={handleDelete}
        title="Delete Committee"
        message={`Are you sure you want to delete "${deleteTargetItem?.name}"? This will remove it from all associated hierarchies.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </MainLayout>
  )
}

function TrendingUpIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
