'use client'

import { useEffect, useRef } from 'react'

export default function ReportMap({ lat, lng, label, markers }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const points = markers && markers.length > 0 ? markers : lat != null ? [{ lat, lng, label }] : []

  useEffect(() => {
    if (!containerRef.current || mapRef.current || points.length === 0) return

    import('leaflet').then((L) => {
      if (mapRef.current) return

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

      const markerGroup = []
      points.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.label || 'Location')
        markerGroup.push(marker)
      })

      // If there's more than one point, fit the map to show all of them
      if (points.length > 1) {
        const group = L.featureGroup(markerGroup)
        map.fitBounds(group.getBounds().pad(0.2))
      }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [points])

  if (points.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        No location data available.
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}