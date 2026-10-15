'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import TrashIcon from '@/components/ui/icons/TrashIcon'
import { toast } from "@/lib/toast"

const SCOPE_TYPES = ['entire_cooperative', 'feeder', 'municipality', 'barangay']

const scopeLabels = {
  entire_cooperative: 'Entire Cooperative',
  feeder: 'Feeder',
  municipality: 'Municipality',
  barangay: 'Barangay',
}

const MAX_PHOTO_SIZE_MB = 5

export default function AdvisoryFormModal({ cooperativeId, advisory, onClose, onSaved }) {
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

  // Photo attachment state
  const [existingPhotoPath, setExistingPhotoPath] = useState(advisory?.photo_url || null)
  const [existingPhotoPreviewUrl, setExistingPhotoPreviewUrl] = useState(null)
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [newPhotoPreviewUrl, setNewPhotoPreviewUrl] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

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

  // Load a signed URL for the existing photo (if editing an advisory that has one)
  useEffect(() => {
    async function loadExistingPhoto() {
      if (!existingPhotoPath) return
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('advisory-photos')
        .createSignedUrl(existingPhotoPath, 3600)
      if (data) setExistingPhotoPreviewUrl(data.signedUrl)
    }
    loadExistingPhoto()
  }, [existingPhotoPath])

  // Release the local preview URL for a newly-picked file when it's replaced/unmounted
  useEffect(() => {
    return () => {
      if (newPhotoPreviewUrl) URL.revokeObjectURL(newPhotoPreviewUrl)
    }
  }, [newPhotoPreviewUrl])

  const feederOptions = Array.from(
    new Set(serviceAreas.map((a) => a.feeder).filter(Boolean))
  ).sort()

  const municipalityOptions = Array.from(
    new Set(serviceAreas.map((a) => a.municipality).filter(Boolean))
  ).sort()

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

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError('')

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file.')
      return
    }
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      setPhotoError(`Image must be smaller than ${MAX_PHOTO_SIZE_MB}MB.`)
      return
    }

    if (newPhotoPreviewUrl) URL.revokeObjectURL(newPhotoPreviewUrl)
    setNewPhotoFile(file)
    setNewPhotoPreviewUrl(URL.createObjectURL(file))
    setRemovePhoto(false)
  }

  function handleRemovePhoto() {
    if (newPhotoPreviewUrl) URL.revokeObjectURL(newPhotoPreviewUrl)
    setNewPhotoFile(null)
    setNewPhotoPreviewUrl(null)
    setRemovePhoto(true)
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
    let photoPathToSave = removePhoto ? null : existingPhotoPath

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

    // Handle photo upload / removal now that advisoryId is available
    if (newPhotoFile) {
      const filePath = `${cooperativeId}/${advisoryId}-${Date.now()}-${newPhotoFile.name}`

      const { error: uploadError } = await supabase.storage
        .from('advisory-photos')
        .upload(filePath, newPhotoFile, { upsert: false })

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      // Clean up the previous photo if this edit replaces it
      if (isEditing && existingPhotoPath) {
        await supabase.storage.from('advisory-photos').remove([existingPhotoPath])
      }

      photoPathToSave = filePath
    } else if (removePhoto && isEditing && existingPhotoPath) {
      await supabase.storage.from('advisory-photos').remove([existingPhotoPath])
      photoPathToSave = null
    }

    if (photoPathToSave !== existingPhotoPath || newPhotoFile) {
      const { error: photoUpdateError } = await supabase
        .from('advisories')
        .update({ photo_url: photoPathToSave })
        .eq('advisory_id', advisoryId)

      if (photoUpdateError) {
        setError(photoUpdateError.message)
        setLoading(false)
        return
      }
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

    toast.success(isEditing ? "Advisory updated" : "Advisory published")
    
    onSaved()
  }

  const photoPreviewToShow = newPhotoPreviewUrl || (!removePhoto ? existingPhotoPreviewUrl : null)

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

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Photo Attachment <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          {photoPreviewToShow ? (
            <div className="relative">
              <img
                src={photoPreviewToShow}
                alt="Advisory attachment preview"
                className="w-full max-h-56 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow"
                title="Remove photo"
              >
                <TrashIcon />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg py-6 cursor-pointer hover:border-gray-300 text-center">
              <span className="text-sm text-gray-500">
                Click to upload a photo (JPG, PNG — max {MAX_PHOTO_SIZE_MB}MB)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}

          {photoError && (
            <p className="text-xs text-red-600 mt-1.5">{photoError}</p>
          )}
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