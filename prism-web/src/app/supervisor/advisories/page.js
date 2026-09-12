'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'

const SCOPE_TYPES = ['entire_cooperative', 'feeder', 'municipality', 'barangay']

const scopeLabels = {
  entire_cooperative: 'Entire Cooperative',
  feeder: 'Feeder',
  municipality: 'Municipality',
  barangay: 'Barangay',
}

const statusStyles = {
  upcoming: 'bg-amber-50 text-amber-700',
  active: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
}

// Compares "now" against the advisory's date/start_time/end_time to
// determine its real-time status — nothing is trusted from a stored value.
function computeStatus(advisory) {
  const now = new Date()
  const start = new Date(`${advisory.date}T${advisory.start_time}`)
  const end = new Date(`${advisory.date}T${advisory.end_time}`)

  if (now < start) return 'upcoming'
  if (now >= start && now <= end) return 'active'
  return 'completed'
}

function formatTime(timeString) {
  const [h, m] = timeString.split(':')
  const hour = parseInt(h, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${m} ${period}`
}

export default function AdvisoriesPage() {
  const [cooperativeId, setCooperativeId] = useState(null)
  const [advisories, setAdvisories] = useState([])
  const [areaFilter, setAreaFilter] = useState('All Area')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAdvisory, setEditingAdvisory] = useState(null)
  const [deletingAdvisory, setDeletingAdvisory] = useState(null)

  useEffect(() => {
    loadAdvisories()
  }, [])

  async function loadAdvisories() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: myRow } = await supabase
      .from('users')
      .select('cooperative_id')
      .eq('id', user.id)
      .single()

    if (!myRow) {
      setError('Unable to load your cooperative.')
      setLoading(false)
      return
    }

    setCooperativeId(myRow.cooperative_id)

    const { data: advisoryData, error: advisoryError } = await supabase
      .from('advisories')
      .select('*')
      .eq('cooperative_id', myRow.cooperative_id)
      .order('date', { ascending: false })

    if (advisoryError) setError(advisoryError.message)

    const advisoryIds = (advisoryData || []).map((a) => a.advisory_id)
    let targets = []
    if (advisoryIds.length > 0) {
      const { data } = await supabase
        .from('advisory_target')
        .select('*')
        .in('advisory_id', advisoryIds)
      targets = data || []
    }

    const merged = (advisoryData || []).map((a) => ({
      ...a,
      targets: targets.filter((t) => t.advisory_id === a.advisory_id),
      computedStatus: computeStatus(a),
    }))

    setAdvisories(merged)
    setLoading(false)
  }

  async function handleDeleteConfirmed() {
    const supabase = createClient()
    // advisory_target rows are removed automatically via "on delete cascade"
    await supabase
      .from('advisories')
      .delete()
      .eq('advisory_id', deletingAdvisory.advisory_id)
    setDeletingAdvisory(null)
    loadAdvisories()
  }

  const allAreaValues = Array.from(
    new Set(
      advisories.flatMap((a) =>
        a.targets.map((t) =>
          t.scope_type === 'entire_cooperative' ? 'Entire Cooperative' : t.target_value
        )
      )
    )
  ).filter(Boolean)

  const counts = {
    all: advisories.length,
    upcoming: advisories.filter((a) => a.computedStatus === 'upcoming').length,
    active: advisories.filter((a) => a.computedStatus === 'active').length,
    completed: advisories.filter((a) => a.computedStatus === 'completed').length,
  }

  const filtered = advisories.filter((a) => {
    const statusMatch = statusFilter === 'all' || a.computedStatus === statusFilter
    const areaMatch =
      areaFilter === 'All Area' ||
      a.targets.some(
        (t) =>
          t.target_value === areaFilter ||
          (t.scope_type === 'entire_cooperative' && areaFilter === 'Entire Cooperative')
      )
    return statusMatch && areaMatch
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Advisories Management</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Manage and track service interruptions and maintenance schedules.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="All Advisories"
          value={counts.all}
          color="text-blue-700"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          label="Upcoming"
          value={counts.upcoming}
          color="text-amber-600"
          active={statusFilter === 'upcoming'}
          onClick={() => setStatusFilter('upcoming')}
        />
        <StatCard
          label="Active"
          value={counts.active}
          color="text-green-600"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter('active')}
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          color="text-gray-900"
          active={statusFilter === 'completed'}
          onClick={() => setStatusFilter('completed')}
        />
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 tracking-wide">AREA</span>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option>All Area</option>
            {allAreaValues.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + Create New Advisory
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-semibold">Advisory Title</th>
              <th className="px-5 py-3 font-semibold">Description</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Start Time</th>
              <th className="px-5 py-3 font-semibold">End Time</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Affected Scope</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                  No advisories match this view.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((a) => (
                <tr key={a.advisory_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4 font-semibold text-gray-900">{a.title}</td>
                  <td className="px-5 py-4 text-gray-600 max-w-xs truncate">
                    {a.description}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(a.date).toLocaleDateString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{formatTime(a.start_time)}</td>
                  <td className="px-5 py-4 text-gray-600">{formatTime(a.end_time)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-xs font-bold px-2 py-0.5 rounded uppercase ${statusStyles[a.computedStatus]}`}
                    >
                      {a.computedStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {a.targets.map((t) => (
                        <span
                          key={t.target_id}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                        >
                          {t.scope_type === 'entire_cooperative'
                            ? 'Entire Cooperative'
                            : t.target_value}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingAdvisory(a)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeletingAdvisory(a)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {(showCreateModal || editingAdvisory) && (
        <AdvisoryFormModal
          cooperativeId={cooperativeId}
          advisory={editingAdvisory}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAdvisory(null)
          }}
          onSaved={() => {
            setShowCreateModal(false)
            setEditingAdvisory(null)
            loadAdvisories()
          }}
        />
      )}

      {deletingAdvisory && (
        <Modal title="Delete Advisory" onClose={() => setDeletingAdvisory(null)}>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to delete "
            <span className="font-semibold">{deletingAdvisory.title}</span>"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeletingAdvisory(null)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirmed}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatCard({ label, value, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-xl border p-4 transition-all ${
        active ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="text-xs font-bold tracking-wide text-gray-400 uppercase mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </button>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  )
}

// ---------- Create / Edit Advisory modal ----------
function AdvisoryFormModal({ cooperativeId, advisory, onClose, onSaved }) {
  const isEditing = !!advisory

  const [title, setTitle] = useState(advisory?.title || '')
  const [date, setDate] = useState(advisory?.date || '')
  const [startTime, setStartTime] = useState(advisory?.start_time?.slice(0, 5) || '')
  const [endTime, setEndTime] = useState(advisory?.end_time?.slice(0, 5) || '')
  const [description, setDescription] = useState(advisory?.description || '')
  const [targets, setTargets] = useState(
    advisory?.targets?.map((t) => ({
      scope_type: t.scope_type,
      target_value: t.target_value || '',
    })) || [{ scope_type: 'feeder', target_value: '' }]
  )

  const [serviceAreas, setServiceAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadServiceAreas() {
      const supabase = createClient()
      const { data } = await supabase
        .from('service_areas')
        .select('feeder, municipality, barangay')
        .eq('cooperative_id', cooperativeId)
      setServiceAreas(data || [])
    }
    if (cooperativeId) loadServiceAreas()
  }, [cooperativeId])

  const feederOptions = Array.from(
    new Set(serviceAreas.map((a) => a.feeder).filter(Boolean))
  ).sort()

  const municipalityOptions = Array.from(
    new Set(serviceAreas.map((a) => a.municipality).filter(Boolean))
  ).sort()

  // Dedupe barangay+municipality pairs, format as "Barangay (Municipality)"
  const barangayOptions = Array.from(
    new Map(
      serviceAreas
        .filter((a) => a.barangay && a.municipality)
        .map((a) => [
          `${a.barangay}|${a.municipality}`,
          `${a.barangay} (${a.municipality})`,
        ])
    ).values()
  ).sort()

  function optionsForScope(scopeType) {
    if (scopeType === 'feeder') return feederOptions
    if (scopeType === 'municipality') return municipalityOptions
    if (scopeType === 'barangay') return barangayOptions
    return []
  }

  function updateTarget(index, field, value) {
    const updated = [...targets]
    updated[index] = { ...updated[index], [field]: value }
    // Reset the value when the scope type changes, since the old value
    // won't match the new dropdown's options
    if (field === 'scope_type') {
      updated[index].target_value = ''
    }
    setTargets(updated)
  }

  function addTarget() {
    setTargets([...targets, { scope_type: 'feeder', target_value: '' }])
  }

  function removeTarget(index) {
    setTargets(targets.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (targets.length === 0) {
      setError('Add at least one target scope.')
      return
    }

    const missingValue = targets.some(
      (t) => t.scope_type !== 'entire_cooperative' && !t.target_value
    )
    if (missingValue) {
      setError('Select a value for every target scope.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    let advisoryId = advisory?.advisory_id

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('advisories')
        .update({ title, date, start_time: startTime, end_time: endTime, description })
        .eq('advisory_id', advisoryId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      await supabase.from('advisory_target').delete().eq('advisory_id', advisoryId)
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: newAdvisory, error: insertError } = await supabase
        .from('advisories')
        .insert({
          cooperative_id: cooperativeId,
          created_by: user.id,
          title,
          date,
          start_time: startTime,
          end_time: endTime,
          description,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      advisoryId = newAdvisory.advisory_id
    }

    const targetRows = targets.map((t) => ({
      advisory_id: advisoryId,
      scope_type: t.scope_type,
      target_value: t.scope_type === 'entire_cooperative' ? null : t.target_value,
    }))

    const { error: targetError } = await supabase.from('advisory_target').insert(targetRows)

    if (targetError) {
      setError(targetError.message)
      setLoading(false)
      return
    }

    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Edit Advisory' : 'Create New Advisory'}
      onClose={onClose}
    >
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Provide details about the service interruption or maintenance schedule.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Advisory Title
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Power Advisory"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date Selection
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Detailed Description
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter the reason for this power advisory..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <div className="border-t border-gray-100 pt-4 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Target Scope</h3>

          <div className="space-y-2">
            {targets.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={t.scope_type}
                  onChange={(e) => updateTarget(i, 'scope_type', e.target.value)}
                  className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                >
                  {SCOPE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {scopeLabels[s]}
                    </option>
                  ))}
                </select>

                {t.scope_type === 'entire_cooperative' ? (
                  <input
                    disabled
                    value="N/A"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm opacity-50"
                  />
                ) : (
                  <select
                    required
                    value={t.target_value}
                    onChange={(e) => updateTarget(i, 'target_value', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                  >
                    <option value="">
                      {optionsForScope(t.scope_type).length === 0
                        ? 'No options found'
                        : `Select a ${scopeLabels[t.scope_type].toLowerCase()}`}
                    </option>
                    {optionsForScope(t.scope_type).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => removeTarget(i)}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTarget}
            className="text-sm text-blue-700 font-medium mt-3"
          >
            + Add Another Scope
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Publishing…' : isEditing ? 'Save Changes' : 'Publish Advisory'}
          </button>
        </div>
      </form>
    </Modal>
  )
}