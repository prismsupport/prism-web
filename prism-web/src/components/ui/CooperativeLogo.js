'use client'

import { useEffect, useState } from 'react'

function initialsOf(name) {
  const words = String(name || '')
    .replace(/\b(electric|cooperative|inc\.?|coop)\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Shows the cooperative's logo, or its initials when there is no logo (or it fails to load).
export default function CooperativeLogo({ name = '', src, size = 36, className = '' }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])

  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) }

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ? `${name} logo` : 'Cooperative logo'}
        style={style}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-lg bg-white object-contain ${className}`}
      />
    )
  }

  return (
    <span
      style={style}
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700 ${className}`}
    >
      {initialsOf(name)}
    </span>
  )
}