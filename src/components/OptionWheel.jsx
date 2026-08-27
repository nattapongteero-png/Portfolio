// -----------------------------------------------------------------------------
// OptionWheel.jsx
// React Bits' OptionWheel — options laid out along a circular arc, the one in
// the middle sharp and bright, the rest curling away, blurring and fading.
//
// One addition for this app: a CONTROLLED mode. Pass `value` and the wheel
// stops owning its own input and simply eases toward whatever position it is
// given. The feed's nav needs that, because upstream the wheel registers a
// non-passive `wheel` listener and calls preventDefault() on it — dropped on
// top of a scrolling page as-is, it swallows the page's own scrolling wherever
// it overlaps. In controlled mode the page scroll IS the wheel's input, so the
// listener (and the drag handling) is never attached at all. Clicking an option
// still selects it.
// -----------------------------------------------------------------------------

import { useRef, useState, useCallback, useEffect } from 'react'
import './OptionWheel.css'

const DEFAULT_ITEMS = [
  'Ambient',
  'House',
  'Techno',
  'Jazz',
  'Lo-Fi',
  'Synthwave',
  'Trance',
  'Funk',
  'Disco',
  'Hip-Hop',
  'Chillwave',
  'Drum & Bass',
]

const OptionWheel = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 3,
  onChange,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'left',
  fontSize = 3,
  spacing = 1.4,
  // Extra px between the focused option and the list under it — see `leadGap`
  // in the config below.
  leadGap = 0,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  // Not upstream. The wheel ships with one size for every option and builds
  // hierarchy purely from blur, fade and rotation — which reads as five equally
  // important titles. `itemScale` shrinks each step away from the middle so the
  // option you are on is plainly the headline and its neighbours are labels.
  itemScale = 0,
  minScale = 0.4,
  // Not upstream. How many steps either side of the middle stay on screen —
  // `1` shows only the previous and next option. Options fade out across the
  // last step rather than blinking off, so the cull is invisible while
  // scrolling. Infinity keeps the full wheel.
  visible = Infinity,
  // Asymmetric culling. `visibleBefore` counts the titles you have already
  // scrolled PAST (above the focus); `visibleAfter` the ones still to come.
  visibleBefore,
  visibleAfter,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  soundUrl = '',
  soundVolume = 0.5,
  className = '',
  // Controlled mode — see the header note. A number here drives the wheel and
  // disables its own wheel/drag input entirely.
  value,
  // Freezes the wheel's pointer affordances to the selected option only: the
  // neighbours stop reacting to hover and stop taking clicks. Used while the
  // selected section has something open inside it.
  locked = false,
  // Rendered instead of the plain label for a given index (used for the nav's
  // "Pawmely / Prototype" breadcrumb).
  renderItem,
}) => {
  const controlled = typeof value === 'number'
  const rootRef = useRef(null)
  const itemRefs = useRef([])
  const posRef = useRef(controlled ? value : defaultSelected)
  const targetRef = useRef(controlled ? value : defaultSelected)
  const rafRef = useRef(null)
  const lastRef = useRef(0)
  const cfgRef = useRef({})
  const onChangeRef = useRef(onChange)
  const selectedRef = useRef(Math.round(controlled ? value : defaultSelected))
  const wheelTimerRef = useRef(null)
  const dragRef = useRef(null)
  const dragMovedRef = useRef(false)
  const audioRef = useRef(null)
  const audioUrlRef = useRef('')
  const lastTickRef = useRef(0)
  const [selectedIndex, setSelectedIndex] = useState(Math.round(controlled ? value : defaultSelected))
  const [isDragging, setIsDragging] = useState(false)

  const remPx =
    typeof window !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16

  onChangeRef.current = onChange
  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    // Extra px inserted between the FOCUSED option and the list under it. The
    // focused title is set several times larger than the rows below it, so an
    // even row pitch leaves its descenders nearly touching the first list item
    // while the list items sit far apart from each other. This is the one gap
    // that has to be measured separately from the pitch.
    leadGap,
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    itemScale,
    minScale,
    visible,
    visibleBefore: visibleBefore ?? visible,
    visibleAfter: visibleAfter ?? visible,
    side,
    loop,
    smoothing,
    draggable,
    soundUrl,
    soundVolume,
  }

  // Single rAF loop that eases the wheel position toward its target with
  // frame-rate independent exponential smoothing, then lays every option out
  // along the curve based on its distance from the current position.
  const runFrame = useCallback((now) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05)
    lastRef.current = now
    const cfg = cfgRef.current
    const tau = Math.max(cfg.smoothing, 1) / 1000
    const k = 1 - Math.exp(-dt / tau)

    const target = targetRef.current
    const cur = posRef.current
    let next = cur + (target - cur) * k
    const settled = Math.abs(target - next) < 0.001
    if (settled) next = target
    posRef.current = next

    const els = itemRefs.current
    const n = cfg.count
    const mirror = cfg.side === 'right' ? -1 : 1
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbors equal to one row height, so tilt controls how tightly it curls.
    const tiltRad = (cfg.tilt * Math.PI) / 180
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0
    for (let i = 0; i < n; i++) {
      const el = els[i]
      if (!el) continue
      let d = i - next
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n
        if (d > n / 2) d -= n
      }
      const dist = Math.abs(d)
      let x = 0
      // The lead gap belongs to the space AFTER the focused row, so every row
      // below it is pushed down by the same amount rather than the gap growing
      // with distance. Rows above are pushed up by it for symmetry.
      const lead = d > 0 ? cfg.leadGap : d < 0 ? -cfg.leadGap : 0
      let y = d * cfg.rowH + lead
      let rot = 0
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad))
        y = R * Math.sin(ang) + lead
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve
        rot = (mirror * ang * 180) / Math.PI
      }
      // Scaled about the left edge (transform-origin: left center), so the
      // titles stay flush to the same margin as they shrink.
      const scale = Math.max(cfg.minScale, 1 - dist * cfg.itemScale)
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`
      // Beyond `visible` the option is gone; the last step is a ramp, so it
      // dissolves as it passes the edge instead of vanishing between frames.
      // d < 0 is a title above the focus — one you have already passed.
      const limit = d < 0 ? cfg.visibleBefore : cfg.visibleAfter
      const cull = Math.min(1, Math.max(0, limit + 1 - dist))
      const op = Math.max(cfg.minOpacity, 1 - dist * cfg.fade) * cull
      el.style.opacity = String(op)
      el.style.pointerEvents = op < 0.05 ? 'none' : ''
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none'
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4))
    }

    rafRef.current = settled ? null : requestAnimationFrame(runFrame)
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(runFrame)
  }, [runFrame])

  // Optional tick on selection change, throttled so fast scrolling can't spam
  // it, and with playback failures (e.g. autoplay policies) silently ignored.
  const playTick = useCallback(() => {
    const { soundUrl: url, soundVolume: vol } = cfgRef.current
    if (!url) return
    const now = performance.now()
    if (now - lastTickRef.current < 70) return
    lastTickRef.current = now
    if (!audioRef.current || audioUrlRef.current !== url) {
      audioRef.current = new Audio(url)
      audioRef.current.preload = 'auto'
      audioUrlRef.current = url
    }
    const audio = audioRef.current
    audio.volume = Math.min(Math.max(vol, 0), 1)
    audio.currentTime = 0
    audio.play()?.catch(() => {})
  }, [])

  const applyTarget = useCallback(
    (v0, snap, silent) => {
      const cfg = cfgRef.current
      let v = v0
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0))
      if (snap) v = Math.round(v)
      targetRef.current = v
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count
      if (idx !== selectedRef.current) {
        selectedRef.current = idx
        setSelectedIndex(idx)
        // `silent` is the controlled path: the owner already knows where it
        // put the wheel, and echoing it back would loop.
        if (!silent) {
          onChangeRef.current?.(idx, cfg.items[idx])
          playTick()
        }
      }
      startLoop()
    },
    [startLoop, playTick]
  )

  // Controlled: follow the value we're given, and never touch page input.
  useEffect(() => {
    if (!controlled) return
    applyTarget(value, false, true)
  }, [controlled, value, applyTarget])

  // Wheel / touchpad scrolling, registered manually so it can be non-passive.
  // Skipped entirely when controlled — this listener preventDefaults, and over
  // a scrolling page that means the nav eats the page's scroll.
  useEffect(() => {
    if (controlled) return
    const el = rootRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const cfg = cfgRef.current
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY
      // Cap each event at one step so notchy mouse wheels move exactly one
      // option per click, while touchpads still scroll continuously.
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH))
      applyTarget(targetRef.current + step, false)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 140)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    }
  }, [applyTarget, controlled])

  const handlePointerDown = useCallback(
    (e) => {
      if (controlled || !cfgRef.current.draggable) return
      dragRef.current = { y: e.clientY, start: targetRef.current, id: e.pointerId }
      dragMovedRef.current = false
      setIsDragging(true)
    },
    [controlled]
  )

  const handlePointerMove = useCallback(
    (e) => {
      const drag = dragRef.current
      if (!drag) return
      const dy = e.clientY - drag.y
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true
        // Capture only once a real drag starts, so plain clicks still reach
        // the items and navigate to them.
        rootRef.current?.setPointerCapture(drag.id)
      }
      if (dragMovedRef.current) applyTarget(drag.start - dy / cfgRef.current.rowH, false)
    },
    [applyTarget]
  )

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsDragging(false)
    if (dragMovedRef.current) applyTarget(targetRef.current, true)
  }, [applyTarget])

  const handleItemClick = useCallback(
    (index) => {
      if (dragMovedRef.current) return
      const cfg = cfgRef.current
      // Controlled: the owner moves the wheel, so just report the choice.
      if (controlled) {
        onChangeRef.current?.(index, cfg.items[index])
        return
      }
      const cur = targetRef.current
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count)
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count
        else if (d < -cfg.count / 2) d += cfg.count
      }
      applyTarget(cur + d, true)
    },
    [applyTarget, controlled]
  )

  const handleKeyDown = useCallback(
    (e) => {
      let delta = null
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1
      if (delta == null) return
      e.preventDefault()
      const next = Math.round(targetRef.current) + delta
      if (controlled) {
        const cfg = cfgRef.current
        const idx = Math.min(Math.max(next, 0), cfg.count - 1)
        onChangeRef.current?.(idx, cfg.items[idx])
        return
      }
      applyTarget(next, true)
    },
    [applyTarget, controlled]
  )

  useEffect(() => {
    applyTarget(targetRef.current, false, true)
  }, [
    items,
    fontSize,
    spacing,
    leadGap,
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    itemScale,
    minScale,
    visible,
    visibleBefore,
    visibleAfter,
    side,
    loop,
    smoothing,
    applyTarget,
  ])

  useEffect(
    () => () => {
      // Clearing the handle matters as much as cancelling it. Upstream cancels
      // but leaves the id set, and under React.StrictMode — which mounts,
      // unmounts and remounts every effect — the second startLoop() then sees a
      // non-null handle, takes its "already running" early return, and the rAF
      // loop never starts again. Nothing ever writes the layout transforms, so
      // every option stacks on top of the others at top: 50%.
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      audioRef.current?.pause()
    },
    []
  )

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={controlled ? -1 : 0}
      aria-label="Option wheel"
      className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${
        isDragging ? ' option-wheel--dragging' : ''
      }${controlled ? ' option-wheel--readonly' : ''}${locked ? ' option-wheel--locked' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--ow-text-color': textColor,
        '--ow-active-color': activeColor,
        '--ow-font-size': `${fontSize}rem`,
        '--ow-inset': `${inset}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${
            selectedIndex === index ? ' option-wheel__item--selected' : ''
          }`}
          onClick={() => handleItemClick(index)}
        >
          {renderItem ? renderItem(label, index, selectedIndex === index) : label}
        </div>
      ))}
    </div>
  )
}

export default OptionWheel
