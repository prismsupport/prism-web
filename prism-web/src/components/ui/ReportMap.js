'use client'

import { useEffect, useRef } from 'react'

export default function ReportMap({ lat, lng, label }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current || lat == null || lng == null) return

    import('leaflet').then((L) => {
      if (mapRef.current) return

      // Leaflet's default marker icon paths break under Next.js's bundler.
      // Pointing directly at a CDN fixes the broken-image marker.
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current).setView([lat, lng], 17)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      L.marker([lat, lng]).addTo(map).bindPopup(label || 'Reported location')
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [lat, lng, label])

  if (lat == null || lng == null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        No location data available.
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}