// -----------------------------------------------------------------------------
// useViewportSize.js
// One shared, rAF-coalesced source of viewport width/height.
//
// Why not `window.addEventListener('resize', ...)` per component: dragging a
// window edge (or the DevTools device frame) fires `resize` on every compositor
// frame, and each listener that answered it re-rendered a whole feed section —
// five of them, one holding a WebGL canvas and a cross-origin iframe. That is
// the "frozen while resizing, then wrong" behaviour: the work per event was
// larger than the gap between events.
//
// So: ONE listener for the whole app, coalesced to a single rAF, and it only
// publishes when the size actually changed. Components read the value like any
// other state, and a resize costs exactly one render pass.
//
// `visualViewport` is included because on a phone the URL bar collapsing changes
// the usable height without firing a window `resize`.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react'

const read = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

let current = typeof window !== 'undefined' ? read() : { width: 0, height: 0 }
const listeners = new Set()
let raf = 0
let bound = false

function publish() {
  raf = 0
  const next = read()
  if (next.width === current.width && next.height === current.height) return
  current = next
  listeners.forEach((fn) => fn(current))
}

function schedule() {
  if (raf) return // already queued for this frame — drop the extra events
  raf = requestAnimationFrame(publish)
}

function bind() {
  if (bound) return
  bound = true
  window.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)
  window.visualViewport?.addEventListener('resize', schedule)
}

export default function useViewportSize() {
  const [size, setSize] = useState(current)
  useEffect(() => {
    bind()
    listeners.add(setSize)
    // A mount that happens after someone else already resized would otherwise
    // start from a stale module value.
    if (size.width !== current.width || size.height !== current.height) setSize(current)
    return () => listeners.delete(setSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return size
}
