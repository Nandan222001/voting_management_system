import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaPlus, FaMapMarkerAlt, FaSearch, FaChevronRight, FaChevronDown, FaEdit, FaTrash } from 'react-icons/fa'
import { Check, Building2, Globe, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SearchableSelect from '../components/common/SearchableSelect'
import { fetchTargets, createTarget, updateTarget, deleteTarget } from '../store/slices/targetSlice'
import { fetchPlatformStats, selectPlatformStats } from '../store/slices/tenantSlice'

const COMMITTEE_TYPES = [
  { value: 'country', label: 'Working Committee - India', levels: [] },
  { value: 'state', label: 'Pradesh Committee', levels: ['state'] },
  { value: 'district', label: 'District Committee', levels: ['state', 'district'] },
  { value: 'block', label: 'Block Committee', levels: ['state', 'district', 'block'] },
  { value: 'booth', label: 'Booth Committee', levels: ['state', 'district', 'block', 'booth'] },
]

// ─── Recursive Committee Node Component ───────────────────────────────────────

function CommitteeNode({ node, allTargets, onEdit, onDelete, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(level < 1) 
  const children = allTargets.filter(t => t.parent_id === node.id)
  const hasChildren = children.length > 0

  const typeConfig = COMMITTEE_TYPES.find(ct => ct.value === node.type)

  return (
    <div className="select-none">
      <div 
        className={`flex items-center justify-between group py-3 px-4 rounded-xl transition-all border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm ${level === 0 ? 'bg-blue-50/50' : ''}`}
      >
        <div className="flex items-center gap-3 flex-1">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
              type="button"
            >
              {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
            </button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
               <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          )}
          
          <div className="flex items-center gap-2 min-w-0">
             <span className="font-bold text-slate-800 truncate">{node.name}</span>
             <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-white text-gray-400 border border-gray-100 uppercase tracking-widest whitespace-nowrap">
                {typeConfig ? typeConfig.label.split(' ')[0] : node.type}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(node)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
            type="button"
          >
            <FaEdit size={14} />
          </button>
          <button 
            onClick={() => onDelete(node)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
            type="button"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-6 mt-1 border-l-2 border-gray-100 pl-2 space-y-1">
          {children.map(child => (
            <CommitteeNode 
              key={child.id} 
              node={child} 
              allTargets={allTargets} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Inline Creation Modal ─────────────────────────────────────────────────────

function InlineAddModal({ isOpen, onClose, type, onSave, loading, initialName }) {
  const [name, setName] = useState(initialName || '')
  useEffect(() => { if (isOpen) setName(initialName || '') }, [isOpen, initialName])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{type} Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A237E]/20 outline-none"
            placeholder={`e.g. ${type === 'state' ? 'Maharashtra' : 'New Area'}`}
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
          <button type="submit" disabled={loading} className="bg-[#1A237E] text-white px-6 py-2 rounded-lg text-xs font-bold hover:brightness-110 disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Entity'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const dispatch = useDispatch()
  const { targets, loading } = useSelector(s => s.targets)
  const platformStats = useSelector(selectPlatformStats)

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState(null)
  
  // Selection Flow State
  const [committeeType, setCommitteeType] = useState('state')
  const [selections, setSelections] = useState({
    state: '',
    district: '',
    block: '',
    booth: ''
  })
  
  // Inline Creation State
  const [inlineModal, setInlineAdd] = useState({ open: false, type: '', parentId: null, name: '' })
  const [inlineSubmitting, setInlineSubmitting] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearchTerm] = useState('')

  useEffect(() => {
    dispatch(fetchTargets())
    dispatch(fetchPlatformStats())
  }, [dispatch])

  // Hierarchical Data Processing
  const rootNodes = useMemo(() => targets.filter(t => !t.parent_id), [targets])
  const states = useMemo(() => targets.filter(t => t.type === 'state'), [targets])
  const districts = useMemo(() => targets.filter(t => t.type === 'district'), [targets])
  const blocks = useMemo(() => targets.filter(t => t.type === 'block'), [targets])
  const country = useMemo(() => targets.find(t => t.type === 'country'), [targets])

  function resetFlow() {
    setSelections({ state: '', district: '', block: '', booth: '' })
  }

  function openCreate() {
    setEditTarget(null)
    setCommitteeType('state')
    resetFlow()
    setShowModal(true)
  }

  function openEdit(t) {
    setEditTarget(t)
    setCommitteeType(t.type)
    
    // Reverse hierarchy fill
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

  const handleInlineSave = async (name) => {
    setInlineSubmitting(true)
    try {
      const res = await dispatch(createTarget({ name: name.trim(), type: inlineModal.type, parent_id: inlineModal.parentId })).unwrap()
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    
    let parentId = null
    let derivedName = ''

    if (committeeType === 'state') {
      parentId = country?.id
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

    if (committeeType === 'country') {
      finalData.name = 'India'
      finalData.parent_id = null
    }

    try {
      if (editTarget) {
        await dispatch(updateTarget({ id: editTarget.id, data: finalData })).unwrap()
        toast.success('Committee updated')
      } else {
        await dispatch(createTarget(finalData)).unwrap()
        toast.success('Committee created')
      }
      setShowModal(false)
      dispatch(fetchTargets())
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Action failed')
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

  const totalCount = platformStats?.total_tenants || 0;
  const activeCount = platformStats?.active_tenants || 0;
  const draftCount = platformStats?.draft_tenants || 0;
  const suspendedCount = platformStats?.suspended_tenants || 0;

  return (
    <MainLayout title="Committee Management">
      <div className="w-full space-y-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Total Tenants */}
          <div className="relative overflow-hidden rounded-lg bg-[#1A237E] p-6 text-white shadow-lg">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#dde1ff]/80">Total Tenants</p>
              <h2 className="mt-1 text-3xl font-black">{totalCount.toLocaleString()}</h2>
              <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#c1c6ff]">
                <TrendingUp className="h-3 w-3" /> Combined reach
              </p>
            </div>
            <Building2 className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10" />
          </div>

          <div className="rounded-lg border border-[#c4c6d0] bg-[#ebecf0] p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474e]/70">Active</p>
            <h3 className="mt-1 text-3xl font-bold text-[#2e7d32]">{activeCount.toLocaleString()}</h3>
          </div>

          <div className="rounded-lg border border-[#c4c6d0] bg-[#ebecf0] p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474e]/70">Draft</p>
            <h3 className="mt-1 text-3xl font-bold text-[#1A237E]">{draftCount.toLocaleString()}</h3>
          </div>

          <div className="rounded-lg border border-[#c4c6d0] bg-[#ebecf0] p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44474e]/70">Suspended</p>
            <h3 className="mt-1 text-3xl font-bold text-[#d32f2f]">{suspendedCount.toLocaleString()}</h3>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 border-b border-[#c4c6d0] pb-5">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[#1A237E] px-5 py-3 text-sm font-bold text-white hover:brightness-110 shadow-lg active:scale-95 transition-all"
          >
            <FaPlus className="h-4 w-4" /> Add Committee
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                 <div className="flex items-center gap-2 text-xs font-black uppercase text-[#1A237E] tracking-widest">
                    <Globe size={14} /> Organization Tree
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {targets.length} Nodes Registered
                 </span>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><LoadingSpinner /></div>
              ) : rootNodes.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                   <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                   <p className="text-gray-400 font-medium">No committee hierarchy defined.</p>
                </div>
              ) : (
                <div className="space-y-2">
                   {rootNodes.map(node => (
                     <CommitteeNode 
                        key={node.id} 
                        node={node} 
                        allTargets={targets} 
                        onEdit={openEdit} 
                        onDelete={setDeleteTargetItem} 
                     />
                   ))}
                </div>
              )}
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                 <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-4 border-b border-gray-50 pb-2">Hierarchy Legend</h3>
                 <div className="space-y-4">
                    {COMMITTEE_TYPES.map(ct => (
                      <div key={ct.value} className="flex items-center justify-between">
                         <span className="text-xs font-bold text-gray-500">{ct.label}</span>
                         <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-tighter border border-blue-100">
                            {targets.filter(t => t.type === ct.value).length}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-[#1A237E] text-white rounded-2xl p-6 shadow-lg shadow-blue-900/10">
                 <TrendingUpIcon className="mb-4 text-blue-200 w-8 h-8" />
                 <h4 className="text-lg font-bold">Organizational Coverage</h4>
                 <p className="text-xs text-blue-100/70 mt-1 leading-relaxed">Your structure covers {states.length} states and {blocks.length} blocks nationwide.</p>
                 <button className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">View Audit Trail</button>
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Committee' : 'Create New Committee'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-8 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Committee Type</label>
                <div className="grid grid-cols-1 gap-2 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                  {COMMITTEE_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => {
                        setCommitteeType(ct.value)
                        resetFlow()
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                        committeeType === ct.value 
                          ? 'bg-[#1A237E] text-white font-bold shadow-md ring-1 ring-[#1A237E]' 
                          : 'text-gray-500 hover:bg-white hover:text-[#1A237E]'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider">{ct.label}</span>
                      {committeeType === ct.value ? <Check size={12} /> : <FaChevronRight size={10} className="opacity-30" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 border-l border-gray-100 pl-8">
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50 pb-2">Location Hierarchy</p>
               
               {committeeType === 'country' ? (
                 <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                       <Check className="text-[#1A237E] w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">National level committee selected (India).</p>
                 </div>
               ) : (
                 <div className="space-y-5">
                   {activeConfig.levels.includes('state') && (
                     <SearchableSelect
                       label="Pradesh / State"
                       placeholder="Select State..."
                       options={targets.filter(t => t.type === 'state')}
                       value={selections.state}
                       onChange={(v) => handleLevelChange('state', v)}
                       onAddNew={(name) => setInlineAdd({ open: true, type: 'state', parentId: country?.id, name })}
                     />
                   )}

                   {activeConfig.levels.includes('district') && selections.state && (
                     <SearchableSelect
                       label="District"
                       placeholder="Select District..."
                       options={targets.filter(t => t.type === 'district' && t.parent_id === selections.state)}
                       value={selections.district}
                       onChange={(v) => handleLevelChange('district', v)}
                       onAddNew={(name) => setInlineAdd({ open: true, type: 'district', parentId: selections.state, name })}
                     />
                   )}

                   {activeConfig.levels.includes('block') && selections.district && (
                     <SearchableSelect
                       label="Block"
                       placeholder="Select Block..."
                       options={targets.filter(t => t.type === 'block' && t.parent_id === selections.district)}
                       value={selections.block}
                       onChange={(v) => handleLevelChange('block', v)}
                       onAddNew={(name) => setInlineAdd({ open: true, type: 'block', parentId: selections.district, name })}
                     />
                   )}

                   {activeConfig.levels.includes('booth') && selections.block && (
                     <SearchableSelect
                       label="Booth"
                       placeholder="Select Booth..."
                       options={targets.filter(t => t.type === 'booth' && t.parent_id === selections.block)}
                       value={selections.booth}
                       onChange={(v) => handleLevelChange('booth', v)}
                       onAddNew={(name) => setInlineAdd({ open: true, type: 'booth', parentId: selections.block, name })}
                     />
                   )}

                   {activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]] && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-700 text-xs font-medium">
                        <FaMapMarkerAlt className="shrink-0 w-4 h-4" />
                        <span className="text-[10px] uppercase font-black tracking-widest leading-none mt-0.5">Please complete selection path.</span>
                      </div>
                   )}
                 </div>
               )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || inlineSubmitting || (activeConfig.levels.length > 0 && !selections[activeConfig.levels[activeConfig.levels.length - 1]])} 
              className="px-10 py-3 text-xs font-black uppercase tracking-widest text-white bg-[#1A237E] rounded-xl hover:bg-[#0d1245] shadow-lg shadow-[#1A237E]/20 transition-all active:scale-95 disabled:opacity-40"
            >
              {submitting ? 'Processing...' : editTarget ? 'Save Changes' : 'Confirm Committee'}
            </button>
          </div>
        </form>
      </Modal>

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
