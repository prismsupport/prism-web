import { friendlyError } from '@/lib/friendlyError'

let toasts = []
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function push(type, message, duration = 4000) {
  if (toasts.some((t) => t.type === type && t.message === message)) return
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, type, message }]
  emit()
  setTimeout(() => dismiss(id), duration)
}

export function subscribe(listener) {
  listeners.add(listener)
  listener([...toasts])
  return () => {
    listeners.delete(listener)
  }
}

export const toast = {
  success: (m) => push('success', m),
  error: (m) => push('error', friendlyError(m), 6000),
  info: (m) => push('info', m),
}