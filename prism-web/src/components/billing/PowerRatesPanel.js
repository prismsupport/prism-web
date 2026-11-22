
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { PageLoading } from '@/components/ui/Skeleton'
import { toast } from '@/lib/toast'

const CLASSES = [
  { key: 'residential', label: 'Residential', hint: 'Residential consumers' },
  { key: 'low_voltage', label: 'Low Voltage', hint: 'Commercial, industrial, irrigation, public buildings, streetlights' },
  { key: 'high_voltage', label: 'High Voltage', hint: 'Industrial and commercial' },
]

const MAX_PHOTO_MB = 5

const INPUT =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400'

const monthLabel = (ym) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  })

const peso = (n) => `₱${Number(n).toFixed(4)}`

const toNum = (v) =>
  v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v)

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function emptyForm() {
  return {
    residential: { total: '', components: [] },
    low_voltage: { total: '', components: [] },
    high_voltage: { total: '', components: [] },
  }
}

function Delta({ current, previous }) {
  if (current == null || previous == null) return null

  const diff = Math.round((current - previous) * 10000) / 10000

  if (diff === 0) {
    return (
      <span className="text-xs text-gray-400">
        No change from last month
      </span>
    )
  }

  const up = diff > 0

  return (
    <span className={`text-xs font-semibold ${up ? 'text-red-600' : 'text-green-600'}`}>
      {up ? '▲' : '▼'} {peso(Math.abs(diff))} vs last month ({peso(previous)})
    </span>
  )
}

export default function PowerRatesPanel() {
  const [coopId, setCoopId] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Advisory states
  const [post, setPost] = useState(false)
  const [advisoryOpen, setAdvisoryOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [descEdited, setDescEdited] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)

  const load = useCallback(async () => {
    const supabase = createClient()

    const id = await getMyCooperativeId(supabase)
    setCoopId(id)

    const { data, error: loadError } = await supabase
      .from('power_rates')
      .select('rate_id, billing_month, consumer_class, total_rate, components, advisory_id')
      .order('billing_month', { ascending: false })
      .limit(120)

    if (loadError) setError(loadError.message)

    setRows(
      (data || []).map((r) => ({
        ...r,
        ym: r.billing_month.slice(0, 7),
      }))
    )

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Existing rates for the selected month
  const saved = useMemo(
    () => rows.filter((r) => r.ym === month),
    [rows, month]
  )

  // Previous rates for comparison
  const previous = useMemo(() => {
    const out = {}

    CLASSES.forEach((c) => {
      out[c.key] =
        rows.find((r) => r.consumer_class === c.key && r.ym < month) || null
    })

    return out
  }, [rows, month])

  const linkedAdvisory =
    saved.find((r) => r.advisory_id)?.advisory_id || null

  // Populate the form when the selected month changes
  useEffect(() => {
    const next = emptyForm()

    CLASSES.forEach((c) => {
      const existing = saved.find((r) => r.consumer_class === c.key)

      if (existing) {
        next[c.key] = {
          total: String(existing.total_rate),
          components: (existing.components || []).map((x) => ({
            label: x.label,
            amount: String(x.amount),
          })),
        }
      } else if (previous[c.key]?.components?.length) {
        next[c.key].components = previous[c.key].components.map((x) => ({
          label: x.label,
          amount: '',
        }))
      }
    })

    setForm(next)
    setTitle(`Power Rates - ${monthLabel(month)}`)
    setDescEdited(false)
    setPost(false)
    setAdvisoryOpen(false)
    setPhotoFile(null)
    setError('')
  }, [month, saved, previous])

  // Calculate totals from breakdown components
  const totals = useMemo(() => {
    const out = {}

    CLASSES.forEach((c) => {
      const filled = form[c.key].components.filter(
        (x) => x.label.trim() && toNum(x.amount) != null
      )

      out[c.key] = filled.length
        ? Math.round(
            filled.reduce((s, x) => s + Number(x.amount), 0) * 10000
          ) / 10000
        : toNum(form[c.key].total)
    })

    return out
  }, [form])

  // Automatically generate advisory description
  useEffect(() => {
    if (descEdited) return

    const lines = CLASSES.filter(
      (c) => totals[c.key] != null
    ).map((c) => {
      const prev = previous[c.key]

      let line = `${c.label} rate for ${monthLabel(month)} is ${peso(totals[c.key])}/kWh`

      if (prev) {
        const diff =
          Math.round(
            (totals[c.key] - Number(prev.total_rate)) * 10000
          ) / 10000

        line +=
          diff === 0
            ? `, unchanged from ${monthLabel(prev.ym)}`
            : `, ${diff > 0 ? 'up' : 'down'} ${peso(Math.abs(diff))} from ${monthLabel(prev.ym)} (${peso(prev.total_rate)}/kWh)`
      }

      return line + '.'
    })

    setDescription(lines.join('\n'))
  }, [totals, previous, month, descEdited])

  function setTotal(cls, value) {
    setForm((f) => ({
      ...f,
      [cls]: {
        ...f[cls],
        total: value,
      },
    }))
  }

  function setComponent(cls, index, changes) {
    setForm((f) => ({
      ...f,
      [cls]: {
        ...f[cls],
        components: f[cls].components.map((x, i) =>
          i === index ? { ...x, ...changes } : x
        ),
      },
    }))
  }

  function addComponent(cls) {
    setForm((f) => ({
      ...f,
      [cls]: {
        ...f[cls],
        components: [
          ...f[cls].components,
          { label: '', amount: '' },
        ],
      },
    }))
  }

  function removeComponent(cls, index) {
    setForm((f) => ({
      ...f,
      [cls]: {
        ...f[cls],
        components: f[cls].components.filter((_, i) => i !== index),
      },
    }))
  }

  // Validate and select poster
  function handlePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed.')
      return
    }

    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`The image must be smaller than ${MAX_PHOTO_MB} MB.`)
      return
    }

    setError('')
    setPhotoFile(file)
  }

  // Save power rates and optionally publish advisory
  async function handleSave(e) {
    e.preventDefault()
    setError('')

    const payload = []

    for (const c of CLASSES) {
      const total = totals[c.key]

      if (total == null) continue

      const components = form[c.key].components
        .filter((x) => x.label.trim() && toNum(x.amount) != null)
        .map((x) => ({
          label: x.label.trim(),
          amount: Number(x.amount),
        }))

      payload.push({
        consumer_class: c.key,
        total_rate: total,
        components,
      })
    }

    if (payload.length === 0) {
      setError('Enter at least one rate.')
      return
    }

    if (post && !description.trim()) {
      setError('Write a short description for the advisory.')
      return
    }

    if (post && !title.trim()) {
      setError('Enter an advisory title.')
      return
    }

    setSaving(true)

    const supabase = createClient()
    let photoPath = null

    // Upload poster if an advisory is being published
    if (post && photoFile) {
      photoPath = `${coopId}/rates-${month}-${Date.now()}-${photoFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('advisory-photos')
        .upload(photoPath, photoFile, { upsert: false })

      if (uploadError) {
        toast.error(uploadError)
        setError(uploadError.message)
        setSaving(false)
        return
      }
    }

    // Save rates through existing Supabase RPC
    const { error: saveError } = await supabase.rpc('save_power_rates', {
      p_billing_month: `${month}-01`,
      p_rates: payload,
      p_post: post,
      p_title: title.trim() || null,
      p_description: post ? description.trim() : null,
      p_photo_url: photoPath,
    })

    if (saveError) {
      if (photoPath) {
        await supabase.storage
          .from('advisory-photos')
          .remove([photoPath])
      }

      toast.error(saveError)
      setError(saveError.message)
      setSaving(false)
      return
    }

    toast.success(
      post
        ? 'Rates saved and posted as an advisory'
        : 'Rates saved'
    )

    setPhotoFile(null)
    setAdvisoryOpen(false)
    setPost(false)

    await load()

    setSaving(false)
  }

  if (loading) return <PageLoading />

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* Monthly Rates Header */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Monthly rates
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {monthLabel(month)}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Php per kWh. Consumers see these on the Billing page of the mobile app.
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Billing month
            </span>

            <input
              type="month"
              required
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </label>
        </div>

        {saved.length > 0 && (
          <Alert tone="info" className="mt-4 mb-0">
            Rates for this month are already saved. Saving again updates them
            {linkedAdvisory
              ? ' and, if you post, the linked advisory'
              : ''}.
          </Alert>
        )}
      </Card>

      {/* Consumer Class Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {CLASSES.map((c) => {
          const hasComponents = form[c.key].components.some(
            (x) => x.label.trim() && toNum(x.amount) != null
          )

          return (
            <Card key={c.key}>
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {c.label}
                </h3>

                <p className="text-xs text-gray-400">
                  {c.hint}
                </p>
              </div>

              {/* Optional Breakdown */}
              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Breakdown{' '}
                    <span className="font-normal normal-case text-gray-400">
                      (optional)
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Add individual charges to calculate the total rate.
                  </p>
                </div>

                {form[c.key].components.map((x, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-2"
                  >
                    <input
                      value={x.label}
                      maxLength={60}
                      onChange={(e) =>
                        setComponent(c.key, i, {
                          label: e.target.value,
                        })
                      }
                      placeholder="Charge name (e.g. Generation)"
                      className={INPUT}
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={x.amount}
                        onChange={(e) =>
                          setComponent(c.key, i, {
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.0000"
                        className={`${INPUT} min-w-0 flex-1`}
                      />

                      <button
                        type="button"
                        onClick={() => removeComponent(c.key, i)}
                        className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addComponent(c.key)}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  + Add charge
                </button>
              </div>

              {/* Total Rate */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Total {hasComponents ? '(sum of breakdown)' : 'per kWh'}
                  </span>

                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    disabled={hasComponents}
                    value={
                      hasComponents
                        ? totals[c.key] ?? ''
                        : form[c.key].total
                    }
                    onChange={(e) => setTotal(c.key, e.target.value)}
                    placeholder="0.0000"
                    className={`${INPUT} disabled:opacity-70`}
                  />
                </label>

                <div className="mt-3">
                  <Delta
                    current={totals[c.key]}
                    previous={
                      previous[c.key]
                        ? Number(previous[c.key].total_rate)
                        : null
                    }
                  />
                </div>
              </div>
            </Card>
          )
        })}

      </div>

      {/* Page Error */}
      {!advisoryOpen && error && (
        <Alert>{error}</Alert>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3">

        <button
          type="button"
          onClick={() => {
            setError('')
            setPost(true)
            setAdvisoryOpen(true)
          }}
          disabled={saving}
          className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50"
        >
          Post as Advisory
        </button>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Rates'}
        </Button>

      </div>

      {/* Advisory Popup */}
      {advisoryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setAdvisoryOpen(false)
              setPost(false)
              setError('')
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

            {/* Popup Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Post Power Rates Advisory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Prepare the announcement for your consumers.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setAdvisoryOpen(false)
                  setPost(false)
                  setError('')
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close advisory popup"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Popup Content */}
            <div className="space-y-5 overflow-y-auto p-6">

              {error && <Alert>{error}</Alert>}

              {/* Title */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Advisory Title
                </span>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter advisory title"
                  className={INPUT}
                  maxLength={150}
                />
              </label>

              {/* Description */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Description
                </span>

                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setDescEdited(true)
                  }}
                  placeholder="Write the advisory details..."
                  className={`${INPUT} resize-y`}
                />

                {descEdited && (
                  <button
                    type="button"
                    onClick={() => setDescEdited(false)}
                    className="mt-2 text-xs font-medium text-blue-700 hover:underline"
                  >
                    Rewrite from the rates above
                  </button>
                )}
              </label>

              {/* Poster Attachment */}
              <div>
                <div className="mb-2">
                  <span className="block text-sm font-semibold text-gray-700">
                    Advisory Poster{' '}
                    <span className="font-normal text-gray-400">
                      (Optional)
                    </span>
                  </span>

                  <p className="mt-1 text-xs text-gray-500">
                    Upload an image to accompany your power rates announcement.
                  </p>
                </div>

                <label
                  htmlFor="advisory-poster"
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>

                  <span className="text-sm font-semibold text-gray-700">
                    {photoFile
                      ? 'Change poster image'
                      : 'Click to upload a poster'}
                  </span>

                  <span className="mt-1 text-xs text-gray-500">
                    JPG or PNG · Maximum file size: {MAX_PHOTO_MB} MB
                  </span>

                  <input
                    id="advisory-poster"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhoto}
                    className="hidden"
                  />
                </label>

                {/* Selected File */}
                {photoFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {photoFile.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {(photoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPhotoFile(null)}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Popup Footer */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">

              <button
                type="button"
                onClick={() => {
                  setAdvisoryOpen(false)
                  setPost(false)
                  setError('')
                }}
                disabled={saving}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <Button type="submit" disabled={saving}>
                {saving ? 'Publishing…' : 'Save and Publish'}
              </Button>

            </div>
          </div>
        </div>
      )}

    </form>
  )
}
