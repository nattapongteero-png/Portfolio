// -----------------------------------------------------------------------------
// NavMenu.jsx
// The top-left navigation menu: a sliding window of three items around the
// focused section — previous · [ FOCUSED ] · next. Titles only; descriptions
// and hashtags live in the section content itself. The focused title renders
// big; neighbours are muted, tappable labels. Items drift vertically with the
// scroll position (same axis as the page) and cross-fade.
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Flat vertical transform — items slide up/down on the SAME axis as the page
// scroll (no 3D tilt), so the menu moves in lockstep with scrolling. `offset`
// is the item's fractional distance from the focused section.
const SLOT = 16 // px parallax per slot (on top of the flex layout)
function wheelTransform(offset) {
  const dist = Math.abs(offset)
  return {
    y: offset * SLOT,                          // subtle vertical drift with scroll
    opacity: Math.max(0, 1 - dist * 0.62),     // neighbours fade back
    scale: 1 - Math.min(dist, 1) * 0.1,        // slight depth for the focus
  }
}

// Enter/leave from one slot further out so items flow in vertically.
function wheelEdge(offset) {
  const step = offset === 0 ? 1 : Math.sign(offset)
  return { ...wheelTransform(offset + step), opacity: 0 }
}

// Slide, don't spring — no overshoot means no bounce.
const wheelTween = { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.5 }

// The breadcrumb rides the SAME curve and length as the device's focus move
// (easeInOutQuad over ~1s), so the two read as one gesture instead of two
// animations glancing off each other.
const CRUMB_TWEEN = { type: 'tween', ease: [0.45, 0, 0.55, 1], duration: 0.95 }

// Which three (or fewer) indices to render around the active one.
function windowAround(active, n) {
  if (n <= 3) return Array.from({ length: n }, (_, i) => i)
  if (active <= 0) return [0, 1, 2]
  if (active >= n - 1) return [n - 3, n - 2, n - 1]
  return [active - 1, active, active + 1]
}

// `compact` renders the same menu (same window, same drift/spring animation) at
// the smaller scale a detail page needs under its own page title.
export default function NavMenu({
  sections,
  activeIndex,
  position = activeIndex,
  onNavigate,
  compact = false,
  positionClass = 'left-4 top-6 md:left-[120px] md:top-12',
  // When set, the focused title shrinks and this label follows it as a
  // breadcrumb — "MyAtlas / Prototype" — so the page you came from stays on
  // screen instead of vanishing.
  breadcrumb = null,
  // Called when the (now muted) section title is tapped while a breadcrumb is
  // showing — the standard "go up a level" affordance.
  onBreadcrumbBack = null,
}) {
  // Which section is "big" follows the scroll, but with hysteresis: it only
  // flips once the scroll is >0.6 past the current section. A plain round()
  // flips at exactly .5, which jitters while the eased scroll settles.
  const [focusIndex, setFocusIndex] = useState(() =>
    Math.max(0, Math.min(sections.length - 1, Math.round(position)))
  )
  useEffect(() => {
    setFocusIndex((cur) => {
      if (position > cur + 0.6) return Math.min(sections.length - 1, cur + 1)
      if (position < cur - 0.6) return Math.max(0, cur - 1)
      return cur
    })
  }, [position, sections.length])

  const indices = windowAround(focusIndex, sections.length)

  return (
    <div
      className={`nav-menu pointer-events-none absolute z-[16] flex max-w-[82%] cursor-grab touch-none flex-col active:cursor-grabbing md:max-w-[620px] ${
        compact ? 'gap-2 md:gap-2' : 'gap-2 md:gap-3'
      } ${positionClass}`}
    >
      <motion.div
        // `items-start`, not the default stretch: otherwise every row is as wide
        // as the widest one, and since neighbours are scaled about their centre
        // they visibly slide sideways whenever the active row's width changes
        // (e.g. when the breadcrumb appears).
        className={`flex flex-col items-start ${compact ? 'gap-2 md:gap-2' : 'gap-2 md:gap-3'}`}
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
            const offset = idx - focusIndex   // discrete — enter/exit direction
            const liveOffset = idx - position // fractional — tracks scroll
            // With a breadcrumb the title is a level you can climb back to.
            // It stays an <h2> either way: swapping the element type would
            // remount it, and the size transition would snap instead of easing.
            const canGoBack = isActive && breadcrumb && onBreadcrumbBack

            return (
              <motion.div
                key={s.domId}
                initial={wheelEdge(offset)}
                animate={wheelTransform(liveOffset)}
                exit={{ ...wheelEdge(offset), transition: wheelTween }}
                transition={{ type: 'spring', stiffness: 520, damping: 72 }}
                className="pointer-events-auto"
              >
                {!isActive ? (
                  <button
                    onClick={() => onNavigate(idx)}
                    className={`text-left font-medium text-[#9c988e] transition-colors hover:text-[#33332f] md:text-2xl ${
                      compact ? 'text-xl' : 'text-lg'
                    }`}
                  >
                    {s.title}
                  </button>
                ) : (
                  <>
                    {/* Never wraps: mid-transition the title is growing back to
                        full size while the crumb is still on screen, and a wrap
                        would double the row height and shove the menu below it
                        down. Overflow is harmless — the menu is decorative and
                        the device paints over it. */}
                    <div className="flex flex-nowrap items-baseline gap-x-3 whitespace-nowrap">
                      <h2
                        {...(canGoBack
                          ? {
                              onClick: onBreadcrumbBack,
                              role: 'button',
                              tabIndex: 0,
                              onKeyDown: (e) =>
                                (e.key === 'Enter' || e.key === ' ') && onBreadcrumbBack(),
                            }
                          : {})}
                        // With a breadcrumb the section title steps back — it
                        // is where you came FROM — and the crumb takes over the
                        // full size and weight the title had.
                        className={`font-bold leading-none tracking-tight transition-all duration-[950ms] ease-[cubic-bezier(0.45,0,0.55,1)] ${
                          compact
                            ? 'text-3xl text-[#21221f] md:text-4xl'
                            : breadcrumb
                              ? 'cursor-pointer text-2xl text-[#9c988e] hover:text-[#4e4e4e] sm:text-3xl md:text-4xl'
                              : 'text-3xl text-[#21221f] sm:text-5xl md:text-7xl'
                        }`}
                      >
                        {s.title}
                      </h2>
                      <AnimatePresence>
                        {breadcrumb && (
                          <motion.div
                            key="crumb"
                            // Scales as well as fades, mirroring the title's
                            // font-size move: 0.5 -> 1 is the same 36px -> 72px
                            // range MyAtlas travels, so the two halves of the
                            // breadcrumb grow and shrink as one.
                            initial={{ opacity: 0, x: -8, scale: 0.5 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.5 }}
                            transition={CRUMB_TWEEN}
                            style={{ transformOrigin: 'left center' }}
                            className="flex flex-nowrap items-baseline gap-x-3"
                          >
                            <span className="text-2xl font-light text-[#c4beb3] sm:text-3xl md:text-4xl">
                              /
                            </span>
                            <span className="text-3xl font-bold leading-none tracking-tight text-[#21221f] sm:text-5xl md:text-7xl">
                              {breadcrumb}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {s.footer}
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
