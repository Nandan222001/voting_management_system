import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FaUserTie,
} from 'react-icons/fa'
import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Edit3,
  ExternalLink,
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
} from 'lucide-react'
import toast from 'react-hot-toast'
import MainLayout from '../components/layout/MainLayout'
import FancySelect from '../components/common/FancySelect'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ActionDropdown from '../components/common/ActionDropdown'
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

  const openCreate = () => {
    setEditCandidateTarget(null)
    setForm(emptyForm)
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
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let payload = form
      if (form.image_file) {
        payload = new FormData()
        payload.append('full_name', form.full_name)
        payload.append('symbol', form.symbol || '')
        payload.append('bio', form.bio || '')
        if (form.committee_id) payload.append('committee_id', String(form.committee_id))
        if (form.target_id) payload.append('target_id', String(form.target_id))
        payload.append('image', form.image_file)
        if (!editCandidateTarget) payload.append('election_id', String(parseInt(selectedElectionId)))
      } else {
        const copy = { ...form }
        delete copy.image_file
        payload = copy
      }

      if (editCandidateTarget) {
        await dispatch(updateCandidate({ id: editCandidateTarget.id, data: payload })).unwrap()
        toast.success('Candidate updated')
      } else {
        await dispatch(addCandidate(payload instanceof FormData ? payload : { ...payload, election_id: parseInt(selectedElectionId) })).unwrap()
        toast.success('Candidate added')
      }
      setShowModal(false)
    } catch (err) {
      toast.error(err || 'Operation failed')
    }
  }

  const handleDelete = async () => {
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

  const featuredCandidate = rows[0]
  const totalVotes = rows.reduce((sum, candidate) => sum + Number(getVoteCount(candidate)), 0)
  const topShare = rows.reduce((max, candidate) => Math.max(max, getVotePercentage(candidate)), 0)

  return (
    <MainLayout title="Candidates Management">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#64748b]">Select Election</label>
              <select
                value={selectedElectionId}
                onChange={e => setSelectedElectionId(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a365d]/20"
              >
                <option value="">-- Choose an election --</option>
                {elections.map(e => (
                  <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2">
              {selectedElection && (
                <button
                  onClick={() => navigate(`/elections/${selectedElectionId}`)}
                  className="flex items-center gap-2 rounded-xl border border-[#1a365d]/30 px-4 py-2.5 text-sm font-semibold text-[#1a365d] transition hover:bg-[#dbeafe]"
                  type="button"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </button>
              )}
              {isAdmin && selectedElection?.status === 'draft' && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 rounded-xl bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
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
            <CandidateHero
              candidate={featuredCandidate}
              selectedElection={selectedElection}
              canManage={isAdmin && selectedElection?.status === 'draft'}
              onEdit={openEdit}
              onDelete={setDeleteCandidateTarget}
            />

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
        title={editCandidateTarget ? 'Edit Candidate' : 'Add Candidate'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'full_name', label: 'Full Name', required: true },
            { name: 'symbol', label: 'Symbol / Initial', required: false },
          ].map(({ name, label, required }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={form[name]}
                onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <ImageUpload
              file={form.image_file}
              existingUrl={form.image_url}
              onFileChange={(f) => setForm(prev => ({ ...prev, image_file: f }))}
              id="candidate-image-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <FancySelect
                value={form.committee_id}
                onChange={e => setForm(f => ({ ...f, committee_id: e.target.value }))}
                placeholder="-- No specific committee --"
                options={committees.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target / Area</label>
              <FancySelect
                value={form.target_id}
                onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}
                placeholder="-- No specific area --"
                options={targets.map(t => ({ value: t.id, label: `${t.name} (${t.type})` }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={actionLoading} 
              className="px-4 py-2 text-sm text-white bg-[rgb(16_102_177)] rounded-lg hover:bg-[rgb(16_102_177)] disabled:opacity-60"
            >
              {actionLoading ? 'Saving…' : editCandidateTarget ? 'Update' : 'Add'}
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

function CandidateHero({ candidate, selectedElection, canManage, onEdit, onDelete }) {
  if (!candidate) return null

  return (
    <section className="relative min-h-[360px] overflow-hidden rounded-3xl border border-[#e2e8f0] bg-[#1a365d] shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.42),transparent_34%),linear-gradient(135deg,#1a365d_0%,#0f172a_100%)]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.18) 45%, transparent 46%)' }} />
      <div className="relative z-10 flex min-h-[360px] flex-col justify-end gap-6 p-6 md:flex-row md:items-end md:p-10">
        <div className="relative flex-shrink-0">
          <ImageAvatar
            src={candidate.image_url}
            name={candidate.full_name}
            sizeClass="w-32 h-32 md:w-40 md:h-40"
            imageClassName="rounded-2xl border-4 border-white shadow-xl bg-white object-cover"
            fallbackClassName="rounded-2xl border-4 border-white shadow-xl bg-white text-[#1a365d] text-4xl font-black"
          />
          <div className="absolute -bottom-2 -right-2 rounded-full border-2 border-white bg-blue-500 p-1 text-white">
            <BadgeCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            {candidate.symbol && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase text-white backdrop-blur-md">
                {candidate.symbol}
              </span>
            )}
            <span className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-bold uppercase text-green-200 backdrop-blur-md">
              Verified Candidate
            </span>
          </div>
          <h2 className="truncate text-3xl font-black tracking-tight text-white md:text-5xl">{candidate.full_name}</h2>
          <p className="mt-2 text-lg font-medium text-blue-100 md:text-xl">
            Candidate for {selectedElection?.title || 'Selected Election'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-white px-6 py-3 font-bold text-[#1a365d] shadow-lg transition active:scale-95" type="button">
            Follow Candidate
          </button>
          <button className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md transition active:scale-95" type="button">
            <MessageSquare className="mr-2 inline h-4 w-4" />
            Contact Campaign
          </button>
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
    </section>
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
