// -----------------------------------------------------------------------------
// NavMenu.jsx
// The top-left navigation menu (replaces the horizontal tab bar). It shows a
// sliding window of only three menu items around the focused section:
//
//     previous · [ FOCUSED ] · next
//
//   • First section  → focused + the next two items (no "previous").
//   • Last section   → the previous two items + focused (no "next").
//   • Otherwise      → previous · focused · next.
//
// The focused item expands in place to reveal the big title + description (and
// hashtags). When the description overflows two lines a "ดูเพิ่มเติม" toggle
// appears; expanding drops a faint dark scrim over the illustration and flips
// the text to light so the copy becomes the focus — TikTok-style.
// -----------------------------------------------------------------------------

import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Cylindrical "wheel picker" transform for a menu item, keyed off its distance
// from the focused item (offset). Above the center tilts its top away, below
// tilts its bottom away — like the drum of an iOS date picker / a hamster wheel.
function wheelTransform(offset) {
  const dist = Math.abs(offset)
  return {
    rotateX: -offset * 28,        // deg — sign flips above vs. below center
    translateZ: -dist * 42,       // px  — focus pops toward the viewer
    y: offset * 6,                // px  — tighten spacing swallowed by rotation
    opacity: Math.max(0, 1 - dist * 0.4),
  }
}

// Enter/leave from the *next* seat on the wheel so items slide continuously
// along the drum instead of popping in — the "drag" feel.
function wheelEdge(offset) {
  const step = offset === 0 ? 1 : Math.sign(offset)
  return { ...wheelTransform(offset + step), opacity: 0 }
}

// Slide, don't spring — no overshoot means no bounce.
const wheelTween = { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.5 }

// Which three (or fewer) indices to render around the active one.
function windowAround(active, n) {
  if (n <= 3) return Array.from({ length: n }, (_, i) => i)
  if (active <= 0) return [0, 1, 2]
  if (active >= n - 1) return [n - 3, n - 2, n - 1]
  return [active - 1, active, active + 1]
}

export default function NavMenu({ sections, activeIndex, position = activeIndex, onNavigate }) {
  const descRef = useRef(null)     // live collapsed <p> — read-only (width/line-height)
  const measureRef = useRef(null)  // hidden twin — safe to mutate for measuring
  const [expanded, setExpanded] = useState(false)
  // { text: string shown when collapsed, over: was it truncated }
  const [clamp, setClamp] = useState({ text: null, over: false })

  // Which section is "big" follows the scroll — it flips at the halfway point
  // (round) so the focused content slides + swaps continuously (TikTok style).
  const focusIndex = Math.max(0, Math.min(sections.length - 1, Math.round(position)))
  const indices = windowAround(focusIndex, sections.length)
  const activeSection = sections[focusIndex]
  const fullDesc = activeSection?.lines?.[1]

  // Collapse the caption whenever the focused section changes.
  useEffect(() => {
    setExpanded(false)
  }, [focusIndex])

  // Truncate the collapsed description to exactly two lines, leaving room for
  // the inline "…ดูเพิ่มเติม" toggle. Measured with real layout (binary search)
  // so nothing overlaps or spills a third line.
  useLayoutEffect(() => {
    const live = descRef.current
    const m = measureRef.current
    if (expanded || !live || !m || !fullDesc) return

    const compute = () => {
      m.style.width = `${live.clientWidth}px`
      const lh = parseFloat(getComputedStyle(live).lineHeight)
      const maxH = lh * 2 + 1
      const reserve = '… ดูเพิ่มเติม'
      m.textContent = fullDesc
      if (m.scrollHeight <= maxH) {
        setClamp({ text: fullDesc, over: false })
        return
      }
      let lo = 0, hi = fullDesc.length, best = 0
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        m.textContent = fullDesc.slice(0, mid).trimEnd() + reserve
        if (m.scrollHeight <= maxH) { best = mid; lo = mid + 1 } else hi = mid - 1
      }
      setClamp({ text: fullDesc.slice(0, best).trimEnd(), over: true })
    }

    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [focusIndex, expanded, fullDesc])

  const showToggle = clamp.over
  const descClass = 'text-sm leading-[1.5] md:text-xl'

  // While scrolling, the illustration slides up through the title. Wash the top
  // with the page bg so the text stays readable — strong mid-scroll, gone at rest.
  const scrimStrength = Math.min(Math.abs(position - Math.round(position)) * 3, 1)

  return (
    <>
      {/* Hidden twin used only to measure where to truncate the description */}
      <p
        ref={measureRef}
        aria-hidden
        className={`pointer-events-none invisible fixed left-0 top-0 -z-10 ${descClass}`}
      />

      {/* Top readability wash — keeps the title legible while the illustration
          scrolls up past it. Ramps with scroll, invisible at rest. */}
      {!expanded && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-[45vh]"
          style={{
            opacity: scrimStrength,
            background: 'linear-gradient(to bottom, #fafafa 55%, rgba(250,250,250,0) 100%)',
          }}
        />
      )}

      {/* Dark scrim — fades in when the caption is expanded (focus mode) */}
      <button
        aria-hidden={!expanded}
        tabIndex={-1}
        onClick={() => setExpanded(false)}
        className={`fixed inset-0 z-[15] bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Windowed menu, top-left — rendered on a 3D cylinder (wheel picker).
          Drag vertically to spin through sections. */}
      <motion.div
        className="pointer-events-auto absolute left-4 top-6 z-[16] flex max-w-[82%] cursor-grab touch-none flex-col gap-3 active:cursor-grabbing md:left-[120px] md:top-12 md:max-w-[620px] md:gap-5"
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const past = Math.abs(info.offset.y) > 60 || Math.abs(info.velocity.y) > 300
          if (!past) return
          const dir = info.offset.y < 0 ? 1 : -1 // drag up = next
          const next = Math.min(sections.length - 1, Math.max(0, focusIndex + dir))
          if (next !== focusIndex) onNavigate(next)
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
        {indices.map((idx) => {
          const s = sections[idx]
          const isActive = idx === focusIndex
          const offset = idx - focusIndex             // discrete — enter/exit direction
          const liveOffset = idx - position           // fractional — tracks scroll

          // Inactive menu item — muted, tappable label. Wheel tracks scroll 1:1.
          if (!isActive) {
            return (
              <motion.button
                key={s.domId}
                onClick={() => onNavigate(idx)}
                style={{ transformOrigin: 'center', transformPerspective: 1000 }}
                initial={wheelEdge(offset)}
                animate={wheelTransform(liveOffset)}
                exit={{ ...wheelEdge(offset), transition: wheelTween }}
                transition={{ type: 'spring', stiffness: 700, damping: 50 }}
                className={`pointer-events-auto text-left text-lg font-medium transition-colors md:text-2xl ${
                  expanded ? 'text-white/50 hover:text-white' : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {s.title}
              </motion.button>
            )
          }

          // Focused item — big title + description + hashtags. Slides with scroll.
          return (
            <motion.div
              key={s.domId}
              style={{ transformOrigin: 'center', transformPerspective: 1000 }}
              initial={wheelEdge(offset)}
              animate={wheelTransform(liveOffset)}
              exit={{ ...wheelEdge(offset), transition: wheelTween }}
              transition={{ type: 'spring', stiffness: 700, damping: 50 }}
              className={`pointer-events-auto ${
                expanded ? 'no-scrollbar max-h-[60vh] overflow-y-auto pr-2' : ''
              }`}
            >
              <h2
                className={`text-3xl font-bold leading-none tracking-tight transition-colors sm:text-5xl md:text-7xl ${
                  expanded ? 'text-white' : 'text-black'
                }`}
              >
                {s.title}
              </h2>

              <div className="mt-3 space-y-1.5 md:mt-5 md:space-y-2">
                {s.lines?.[1] && (
                  expanded ? (
                    <p className="text-sm leading-[1.5] text-neutral-100 md:text-xl">
                      {s.lines[1]}
                      {showToggle && (
                        <button
                          onClick={() => setExpanded(false)}
                          className="ml-1 text-sm font-semibold text-white/80 transition hover:text-white md:text-base"
                        >
                          ย่อ
                        </button>
                      )}
                    </p>
                  ) : (
                    // Collapsed: JS-truncated to two lines with the toggle inline.
                    <p ref={descRef} className={`${descClass} text-neutral-500`}>
                      {clamp.text ?? s.lines[1]}
                      {clamp.over && (
                        <>
                          {'… '}
                          <button
                            onClick={() => setExpanded(true)}
                            className="text-sm font-semibold text-neutral-500 transition hover:text-neutral-800 md:text-base"
                          >
                            ดูเพิ่มเติม
                          </button>
                        </>
                      )}
                    </p>
                  )
                )}
              </div>

              {/* Hashtags — always visible */}
              {s.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors md:text-sm ${
                        expanded
                          ? 'border-white/25 bg-white/10 text-white'
                          : 'border-neutral-200 bg-white text-neutral-600'
                      }`}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {s.footer}
            </motion.div>
          )
        })}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
