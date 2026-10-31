'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { FormInput, FormSelect } from '@/components/ui/FormControls'
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
        <FormInput
          label="Substation"
          required
          value={substation}
          onChange={(e) => setSubstation(e.target.value)}
          placeholder="e.g. 20 MVA Libmanan Substation"
        />

        <FormInput
          label="Feeder"
          required
          value={feeder}
          onChange={(e) => setFeeder(e.target.value)}
          placeholder="e.g. Feeder 9"
        />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <FormInput
            wrapperClassName=""
            label="Barangay"
            required
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            placeholder="e.g. San Isidro"
          />
          <FormInput
            wrapperClassName=""
            label="Municipality"
            required
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            placeholder="e.g. Libmanan"
          />
        </div>

        <FormInput
          label="Province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="e.g. Camarines Sur"
        />

        <div className="mb-5">
          <FormSelect
            wrapperClassName=""
            label="Area Office"
            value={areaOffice}
            onChange={(e) => setAreaOffice(e.target.value)}
          >
            <option value="">No area office assigned</option>
            {areaOffices.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </FormSelect>
          <button
            type="button"
            onClick={onManageAreaOffices}
            className="text-xs text-blue-700 font-medium mt-1.5"
          >
            Manage area offices
          </button>
        </div>

        <Alert>{error}</Alert>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" dim={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Service Area'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
