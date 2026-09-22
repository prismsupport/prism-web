'use client'

import { useEffect, useRef } from 'react'

export default function ReportMap({ lat, lng, label, markers }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const rawPoints = markers && markers.length > 0 ? markers : lat != null ? [{ lat, lng, label }] : []
  const points = rawPoints.filter((p) => p.lat != null && p.lng != null)

  useEffect(() => {
    let cancelled = false
    if (!containerRef.current || points.length === 0) return

    import('leaflet').then((L) => {
      if (cancelled || mapRef.current) return

      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current).setView([points[0].lat, points[0].lng], 17)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const markerInstances = points.map((p) =>
        L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.label || 'Location')
      )

      if (points.length > 1) {
        const group = L.featureGroup(markerInstances)
        map.fitBounds(group.getBounds().pad(0.2))
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [JSON.stringify(points)])

  if (points.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        No location data available.
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}