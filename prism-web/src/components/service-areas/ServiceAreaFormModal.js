'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import { toast } from '@/lib/toast'

export default function ServiceAreaFormModal({
  cooperativeId,
  area,
  areaOffices,
  onManageAreaOffices,
  onClose,
  onSaved,
}) {
  const isEditing = !!area

  const [substation, setSubstation] = useState(area?.substation || '')
  const [feeder, setFeeder] = useState(area?.feeder || '')
  const [barangay, setBarangay] = useState(area?.barangay || '')
  const [municipality, setMunicipality] = useState(area?.municipality || '')
  const [province, setProvince] = useState(area?.province || 'Camarines Sur')
  const [areaOffice, setAreaOffice] = useState(area?.area_office || '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!substation.trim() || !feeder.trim() || !barangay.trim() || !municipality.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const payload = {
      substation: substation.trim(),
      feeder: feeder.trim(),
      barangay: barangay.trim(),
      municipality: municipality.trim(),
      province: province.trim() || null,
      area_office: areaOffice || null,
    }

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('service_areas')
        .update(payload)
        .eq('id', area.id)

      if (updateError) {
        toast.error(updateError.message)
        setError(updateError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('service_areas').insert({
        cooperative_id: cooperativeId,
        ...payload,
      })

      if (insertError) {
        toast.error(insertError.message)
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    toast.success(isEditing ? 'Service area updated' : 'Service area added')
    onSaved()
  }

  return (
    <Modal title={isEditing ? 'Edit Service Area' : 'Add Service Area'} onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4 -mt-2">
        Define the substation, feeder, barangay, and responsible area office covered
        under this service area.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Substation
          </label>
          <input
            required
            value={substation}
            onChange={(e) => setSubstation(e.target.value)}
            placeholder="e.g. 20 MVA Libmanan Substation"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Feeder
          </label>
          <input
            required
            value={feeder}
            onChange={(e) => setFeeder(e.target.value)}
            placeholder="e.g. Feeder 9"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Barangay
            </label>
            <input
              required
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              placeholder="e.g. San Isidro"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Municipality
            </label>
            <input
              required
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="e.g. Libmanan"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Province
          </label>
          <input
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="e.g. Camarines Sur"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Area Office
          </label>
          <select
            value={areaOffice}
            onChange={(e) => setAreaOffice(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm"
          >
            <option value="">No area office assigned</option>
            {areaOffices.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onManageAreaOffices}
            className="text-xs text-blue-700 font-medium mt-1.5"
          >
            Manage area offices
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
            {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Service Area'}
          </button>
        </div>
      </form>
    </Modal>
  )
}