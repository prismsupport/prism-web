'use client'

import ReportMap from '@/components/ui/ReportMap'
import ModalBackdrop from '@/components/ui/ModalBackdrop'

export default function MapModal({ lat, lng, label, markers, onClose }) {
  return (
    <ModalBackdrop onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl h-[70vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 shadow"
        >
          ✕
        </button>
        <ReportMap lat={lat} lng={lng} label={label} markers={markers} />
      </div>
    </ModalBackdrop>
  )
}
