// -----------------------------------------------------------------------------
// StageProgress.jsx
// The vertical progress rail shared by the project stage and the detail reel.
// One component, because the two are the same promise to the reader: how far
// through this set of screens you are, and how much is left.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'

// Takes the raw fractional scroll position and eases a displayed value toward it
// every frame, so the bar glides even when the scroller snaps from one screen to
// the next. Frame-rate independent: the step
// is derived from the elapsed time, not from a fixed fraction per frame.
function StageProgress({ value, horizontal = false, positionClass }) {
  const target = Math.min(Math.max(value, 0), 1)
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)
  const targetRef = useRef(target)
  const rafRef = useRef(0)
  targetRef.current = target

  useEffect(() => {
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      // 120ms time constant: quick enough to feel attached to the page, slow
      // enough to carry a snap across as a movement instead of a cut.
      const k = 1 - Math.exp(-dt / 0.12)
      const next = shownRef.current + (targetRef.current - shownRef.current) * k
      const settled = Math.abs(targetRef.current - next) < 0.0005
      shownRef.current = settled ? targetRef.current : next
      setShown(shownRef.current)
      rafRef.current = settled ? 0 : requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return (
    <div
      // Placed by the caller when it lives somewhere other than the default
      // right corner — the project stage draws it under the page title now.
      className={`pointer-events-none fixed z-[17] block ${
        positionClass ?? 'right-5 top-[calc(env(safe-area-inset-top,0px)+16px)] md:right-9 md:top-[60px]'
      }`}
      role="progressbar"
      aria-label="ความคืบหน้าของผลงาน"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target * 100)}
    >
      {/* The empty track carries the reading too — it is what says how much is
          left — so it is drawn dark enough to be seen on its own rather than
          only as the ground under the fill. */}
      {/* 5px, not 3: at three the full radius is 1.5px and both ends read as cut
          square. The fill carries its own radius as well as being clipped by the
          track, so its lower end is a cap rather than a chop. */}
      <div
        className={
          horizontal
            ? 'relative h-[5px] w-[96px] overflow-hidden rounded-full bg-[#21221f]/20 md:w-[168px]'
            : 'relative h-[96px] w-[5px] overflow-hidden rounded-full bg-[#21221f]/20 md:h-[168px]'
        }
      >
        <span
          className={
            horizontal
              ? 'absolute inset-y-0 left-0 block rounded-full bg-[#21221f]'
              : 'absolute inset-x-0 top-0 block rounded-full bg-[#21221f]'
          }
          style={
            horizontal
              ? { width: `${shown * 100}%`, minWidth: 5, willChange: 'width' }
              : { height: `${shown * 100}%`, minHeight: 5, willChange: 'height' }
          }
        />
      </div>
    </div>
  )
}


export default StageProgress
