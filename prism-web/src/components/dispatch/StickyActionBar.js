// Keeps the main ticket actions (Assign, Decline, Re-open) in view while the
// supervisor scrolls. Place it as the last child of the scrolling column.
// Renders nothing when it has no children.
import { Children } from 'react'

export default function StickyActionBar({ children, id }) {
  if (!id && Children.toArray(children).filter(Boolean).length === 0) return null
  return (
    <div id={id} className="sticky bottom-0 z-10 rounded-xl bg-white px-3 pt-3 pb-1">
      {children}
    </div>
  )
}