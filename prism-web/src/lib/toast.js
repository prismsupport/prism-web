let toasts = [];
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(type, message) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, type, message }];
  emit();
  setTimeout(() => dismiss(id), 4000);
}

export function subscribe(listener) {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export const toast = {
  success: (m) => push("success", m),
  error: (m) => push("error", m),
  info: (m) => push("info", m),
};