// -----------------------------------------------------------------------------
// ArcWipe.jsx
// Changing project from the section list is not a scroll — it is a page change,
// and it plays like one: the page you are on dims, a pale curtain with a curved
// leading edge slides up ACROSS it, and the new page's lines come up behind it.
//
// ONE curtain, one direction, one pass. Two earlier attempts got this wrong in
// opposite ways: one covered with a sweep and uncovered with a second sweep, so
// the edge had to jump back to the bottom between them; the next made the
// curtain a band with two edges, which reads as two curtains, one coming and one
// going. The reference has neither. Its curtain is the pale ground of the page
// arriving, it never leaves, and what happens after it has crossed is not
// another wipe but the new page's content rising into it.
//
// Nothing about the old page fades. It stays exactly where it is, at full
// detail, until the curtain's edge passes over it.
//
// The curve of that edge is the point. A straight edge reads as a panel sliding;
// an edge that lags in the middle and runs ahead at the sides reads as something
// drawn ACROSS the screen. The boundary is the bottom edge of an ellipse far
// wider than the viewport, so only its shallowest part is ever on screen — cut
// with a radial-gradient mask rather than `clip-path: ellipse()`, which can only
// keep the INSIDE of its shape when what is wanted here is the outside.
// -----------------------------------------------------------------------------

import { useCallback, useRef } from 'react'

// The ellipse. RX is a multiple of the viewport's width — wide enough that the
// arc on screen is a shallow curve and not a dome. RY sets the sag with it:
// sag = RY · (1 − √(1 − (0.5/RX_MULT)²)), which at these numbers is ~128px on a
// 1440-wide screen, matching the ~117 measured off the reference.
const RX_MULT = 1.35
const RY = 1800

// Beats, measured off the reference by burst-screenshotting its own transition
// and reading the arc's position out of the pixels frame by frame:
//
//   0 – 300ms    the page darkens, nothing else moves
//   300 – 580ms  it holds there, dark and still
//   580 – 1750ms the edge crosses the screen, once
const DIM_MS = 300
// Barely a breath. The reference holds its dim for ~280ms, but under our dim the
// press has ALREADY waited through the fade — measured back to back, the two
// pauses stacked into what read as the page hanging before the curtain moved.
const HOLD_MS = 60
const SWEEP_MS = 1250
// How long the curtain takes to hand over to the page it was standing in for.
// Short, and it overlaps the content rising in, so it is not felt as a step of
// its own.
const SETTLE_MS = 180

// The reference's own curve: its edge's remaining distance fell by a constant
// ratio each frame — an exponential decay, not a cubic ease. τ ≈ 196ms at the
// measured 0.61 per 97ms; a little longer here for a softer tail. A cubic stops
// moving before its duration is up, where this keeps creeping the last few
// pixels, and that long soft ending is what the smoothness is made of.
const TAU = 250
const expOut = (t) => (1 - Math.exp((-t * SWEEP_MS) / TAU)) / (1 - Math.exp(-SWEEP_MS / TAU))

function sagFor(vw) {
  const rx = RX_MULT * vw
  return RY * (1 - Math.sqrt(Math.max(0, 1 - (vw / 2 / rx) ** 2)))
}

// `bottom` is where the arc's LOWEST point (its middle) sits, in px from the top
// of the viewport. Everything BELOW the arc is painted.
function edgeMask(bottom, vw) {
  const rx = RX_MULT * vw
  const cy = bottom - RY
  return `radial-gradient(${rx}px ${RY}px at 50% ${cy}px, transparent 99.5%, #000 100%)`
}

// How dark the page goes before the curtain crosses it.
const DIM_ALPHA = 0.5
// The curtain is the arriving page's own ground — the same #fafafa every section
// stands on — so when it hands over there is nothing to see change.
const GROUND = '#fafafa'

export default function useArcWipe() {
  const elRef = useRef(null)
  const dimRef = useRef(null)
  const rafRef = useRef(0)
  const timersRef = useRef([])
  const busyRef = useRef(false)

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  // `onCovered` is called on the frame the curtain has crossed the whole screen
  // — the only moment the page underneath may be changed without it being seen.
  const play = useCallback(
    async (onCovered) => {
      if (busyRef.current) return
      const el = elRef.current
      if (!el) {
        onCovered?.()
        return
      }
      busyRef.current = true
      stop()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const sag = sagFor(vw)

      // 1. The page goes quiet, and stays quiet for a beat. A layer OVER it,
      // never a `filter` on the page itself: a filter on an ancestor establishes
      // a containing block and a new rasterisation root, and on this feed —
      // whose root already carries the reveal's clip-path — it blanked the whole
      // page to flat grey.
      const dim = dimRef.current
      if (dim) {
        // Eased at both ends, measured against the reference's own dim: it
        // starts gently and only then digs in.
        dim.style.transition = `opacity ${DIM_MS}ms cubic-bezier(.65,0,.35,1)`
        dim.style.opacity = String(DIM_ALPHA)
      }
      // Parked FULLY under the bottom of the screen. The arc's SIDES sit a full
      // sag ABOVE its middle, so parking the middle at vh+2 left the corners of
      // the curtain already poking ~sag px into view through the whole dim+hold
      // — a curtain that "appears, waits, then slides". Park the middle a sag
      // lower and the first painted frame truly shows nothing.
      const parked = vh + sag + 2
      const start = edgeMask(parked, vw)
      el.style.transition = ''
      el.style.webkitMaskImage = start
      el.style.maskImage = start
      el.style.opacity = '1'
      await new Promise((r) => timersRef.current.push(setTimeout(r, DIM_MS + HOLD_MS)))

      // 2. One pass, bottom to top, straight over the old page.
      //
      // It STOPS the moment its edge reaches the top rather than running out its
      // clock. The exponential's last stretch is a crawl across pixels that are
      // already off screen — a quarter of a second where the screen is blank and
      // nothing at all is happening, which is exactly the pause that read as the
      // page having hung.
      await new Promise((resolve) => {
        const t0 = performance.now()
        const frame = (now) => {
          const t = Math.min(1, (now - t0) / SWEEP_MS)
          const b = parked + (-sag - 4 - parked) * expOut(t)
          const m = edgeMask(b, vw)
          el.style.webkitMaskImage = m
          el.style.maskImage = m
          // The arc's SIDES lead its middle by the sag, so the screen is covered
          // as soon as the middle reaches the top.
          if (t < 1 && b > 1) rafRef.current = requestAnimationFrame(frame)
          else resolve()
        }
        rafRef.current = requestAnimationFrame(frame)
      })

      // 3. Crossed. The page underneath changes behind a screen that is now one
      // flat colour, and the curtain hands over to it — the content rising in is
      // what is actually watched here, not the handover.
      onCovered?.()
      if (dim) {
        dim.style.transition = ''
        dim.style.opacity = '0'
      }
      // The hand-over starts on the SAME frame as the swap, not after it: the
      // content's own rise begins under the curtain and is already well under
      // way by the time the curtain is gone.
      el.style.transition = `opacity ${SETTLE_MS}ms linear`
      el.style.opacity = '0'
      await new Promise((r) => timersRef.current.push(setTimeout(r, SETTLE_MS)))
      el.style.transition = ''
      busyRef.current = false
    },
    [stop]
  )

  // Both layers sit UNDER the nav (z-16/17): the section list and the menu stay
  // put while the page behind them is swapped, which is what makes it read as
  // one site changing pages rather than the whole screen being replaced.
  const overlay = (
    <>
      <div
        ref={dimRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[13] bg-black opacity-0"
      />
      <div
        ref={elRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[14] opacity-0"
        style={{ background: GROUND }}
      />
    </>
  )

  return { overlay, play }
}

export const ARC_WIPE_MS = DIM_MS + HOLD_MS + SWEEP_MS + SETTLE_MS
