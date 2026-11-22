'use client'

import { useEffect, useRef } from 'react'
import { useStatusLabels } from '@/lib/workflow/StatusLabelsContext'
import { pinColor, PIN_COLORS } from '@/lib/priorityColors'

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

function pinIcon(L, color) {
  return L.divIcon({
    className: 'prism-pin',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42" style="display:block;filter:drop-shadow(0 2px 2px rgba(15,23,42,.35))"><path d="M15 41C15 41 2 25.5 2 15a13 13 0 0 1 26 0c0 10.5-13 26-13 26z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  })
}

// A marker that has a "priority" field (even null) is drawn as a coloured pin:
// highest priority = red, lowest = blue, not set = gray.
// Markers without a priority field keep the normal blue Leaflet marker.
// For a single location, pass the optional priority prop.
export default function ReportMap({ lat, lng, label, markers, priority }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const { priorityLevels, priorityLabel } = useStatusLabels()

  const rawPoints =
    markers && markers.length > 0
      ? markers
      : lat != null
      ? [{ lat, lng, label, ...(priority !== undefined ? { priority } : {}) }]
      : []
  const points = rawPoints.filter((p) => p.lat != null && p.lng != null)
  const showLegend = points.some((p) => 'priority' in p)

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

      const markerInstances = points.map((p) => {
        const colored = 'priority' in p
        const options = { riseOnHover: true }
        if (colored) options.icon = pinIcon(L, pinColor(p.priority, priorityLevels))

        const popup =
          `<strong>${esc(p.label || 'Location')}</strong>` +
          (colored
            ? `<br/>Priority: ${esc(p.priority ? priorityLabel(p.priority) : 'Not set')}`
            : '')

        const marker = L.marker([p.lat, p.lng], options).addTo(map).bindPopup(popup)
        marker._icon?.classList.add('report-map-marker')
        return marker
      })

      let selectedMarker = null

      function clearSelectedMarker() {
        if (!selectedMarker) return
        selectedMarker.closePopup()
        selectedMarker._icon?.classList.remove('report-map-marker-selected')
        selectedMarker = null
      }

      markerInstances.forEach((marker) => {
        marker.on('mouseover', () => {
          marker._icon?.classList.add('report-map-marker-hover')
          marker.openPopup()
        })

        marker.on('mouseout', () => {
          marker._icon?.classList.remove('report-map-marker-hover')
          if (selectedMarker !== marker) marker.closePopup()
        })

        marker.on('click', () => {
          if (selectedMarker && selectedMarker !== marker) {
            selectedMarker._icon?.classList.remove('report-map-marker-selected')
          }
          selectedMarker = marker
          marker._icon?.classList.add('report-map-marker-selected')
          marker.openPopup()
        })

        marker.on('popupclose', () => {
          if (selectedMarker === marker) {
            marker._icon?.classList.remove('report-map-marker-selected')
            selectedMarker = null
          }
        })
      })

      map.on('click', clearSelectedMarker)

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
  }, [JSON.stringify(points), JSON.stringify(priorityLevels)])

  if (points.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-sm text-gray-500">
        No location data available.
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-3 rounded-lg bg-white/95 px-3 py-1.5 text-[11px] font-medium text-gray-700 shadow">
          {[
            ['Highest priority', PIN_COLORS.highest],
            ['Lowest priority', PIN_COLORS.lowest],
            ['Not set', PIN_COLORS.none],
          ].map(([text, color]) => (
            <span key={text} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}