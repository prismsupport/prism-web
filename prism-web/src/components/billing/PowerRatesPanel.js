'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCooperativeId } from '@/lib/supabase/getCooperativeId'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { PageLoading } from '@/components/ui/Skeleton'
import { toast } from '@/lib/toast'
import RateClassCard from '@/components/billing/RateClassCard'
import PowerRatesAdvisoryPopup from '@/components/billing/PowerRatesAdvisoryPopup'
import {
  RATE_CLASSES,
  MAX_PHOTO_MB,
  monthLabel,
  toNum,
  currentMonth,
  emptyForm,
  computeTotals,
  buildAdvisoryDescription,
} from '@/lib/billing/powerRates'

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

    RATE_CLASSES.forEach((c) => {
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

    RATE_CLASSES.forEach((c) => {
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
  const totals = useMemo(() => computeTotals(form), [form])

  // Automatically generate advisory description
  useEffect(() => {
    if (descEdited) return

    setDescription(buildAdvisoryDescription(totals, previous, month))
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

  function closeAdvisory() {
    setAdvisoryOpen(false)
    setPost(false)
    setError('')
  }

  // Save power rates and optionally publish advisory
  async function handleSave(e) {
    e.preventDefault()
    setError('')

    const payload = []

    for (const c of RATE_CLASSES) {
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

        {RATE_CLASSES.map((c) => (
          <RateClassCard
            key={c.key}
            cls={c}
            formClass={form[c.key]}
            total={totals[c.key]}
            previousRate={previous[c.key]}
            setTotal={setTotal}
            setComponent={setComponent}
            addComponent={addComponent}
            removeComponent={removeComponent}
          />
        ))}

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
        <PowerRatesAdvisoryPopup
          error={error}
          saving={saving}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          descEdited={descEdited}
          setDescEdited={setDescEdited}
          photoFile={photoFile}
          setPhotoFile={setPhotoFile}
          onPhoto={handlePhoto}
          onClose={closeAdvisory}
        />
      )}

    </form>
  )
}