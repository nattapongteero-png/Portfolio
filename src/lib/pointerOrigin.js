// -----------------------------------------------------------------------------
// pointerOrigin.js
// Where the last press landed, in viewport coordinates. Every page transition on
// this site opens as a circle, and the circle grows from the thing you pressed —
// so the animation needs one fact that React state cannot give it in time: the
// coordinates of the press that caused the navigation, available synchronously
// inside the handler that runs on it.
//
// Recorded on `pointerdown` in the CAPTURE phase, so it is set before any
// handler that might navigate.
// -----------------------------------------------------------------------------

let last = null

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      last = { x: e.clientX, y: e.clientY }
    },
    { capture: true, passive: true }
  )
  // A keyboard activation has no coordinates. Falling back to the element that
  // has focus keeps the circle answering the control that was actually used.
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = document.activeElement
      if (!el || el === document.body) return
      const r = el.getBoundingClientRect()
      last = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    },
    { capture: true }
  )
}

// The centre of the screen is the honest default: with no press to point at, a
// circle from a corner would claim an origin that never happened.
export function pointerOrigin() {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  if (last) return last
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

// The radius that reaches the farthest corner from a point, so the reveal
// finishes exactly when the screen is covered and not a frame later.
export function coverRadius({ x, y }) {
  if (typeof window === 'undefined') return 0
  const w = window.innerWidth
  const h = window.innerHeight
  return Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)))
}

export const circleAt = (o, r) => `circle(${r}px at ${o.x}px ${o.y}px)`
