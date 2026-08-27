// -----------------------------------------------------------------------------
// ClampText.jsx
// Clamps text to N lines and appends an INLINE "… เพิ่มเติม" toggle that
// continues on the same line rather than wrapping onto a new one.
//
// The fit is measured on a detached probe element mirroring the paragraph's
// width and font — never by mutating the rendered node, which React owns.
// Cuts land on grapheme-cluster boundaries so a Thai vowel or tone mark is
// never separated from its consonant.
//
// Expand/collapse animates the paragraph's HEIGHT between the two measured
// states (collapsed clip vs. full text) so the reveal eases instead of
// snapping. Heights come off the same probe, so no reflow of the live node.
// -----------------------------------------------------------------------------

import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  }
  return Array.from(text) // fallback: code points
}

// The two halves of the inline tail, kept apart because they are SET apart in the
// markup: the ellipsis is body text, the label is the toggle at font-medium. The
// probe has to weigh them the same way or it measures a line that is narrower than
// the one that actually renders.
const ELLIPSIS = '… '
const MORE_LABEL = 'เพิ่มเติม'
const TOGGLE_WEIGHT = '500'

export default function ClampText({
  text,
  lines = 4,
  className = '',
  buttonClassName = '',
  // Reported so the surrounding layout can react — on a phone the expanded copy
  // needs a backdrop to stay readable, and the controls under it have to get
  // out of its way.
  onToggle,
}) {
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [clipped, setClipped] = useState(null) // null = fits, no toggle needed
  // Measured heights for the two states — drives the eased reveal. Both are
  // plain numbers: tweening out of `auto` isn't interpolable, so collapsing
  // from it snapped shut while expanding eased fine.
  const [heights, setHeights] = useState(null) // { collapsed, gutter }
  const [fullH, setFullH] = useState(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !text) return

    const measure = () => {
      const width = el.clientWidth
      if (!width) return
      const cs = getComputedStyle(el)
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5
      const maxH = lh * lines + 1 // +1 absorbs sub-pixel rounding

      const probe = document.createElement('div')
      probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:normal'
      probe.style.width = `${width}px`
      probe.style.fontFamily = cs.fontFamily
      probe.style.fontSize = cs.fontSize
      probe.style.fontWeight = cs.fontWeight
      probe.style.lineHeight = cs.lineHeight
      probe.style.letterSpacing = cs.letterSpacing
      probe.style.wordBreak = cs.wordBreak
      // The tail is its own node at the toggle's weight. Measured as one flat
      // string in the body weight, the last line came out narrower than the one
      // that renders — the binary search then kept a clip that only fits at 400,
      // the bolder label wrapped to a line of its own, and that line fell outside
      // the wrapper's clip: the toggle was painted nowhere and could not be
      // clicked. Measured: clip box 132px, paragraph 140px, toggle 28px below
      // the cut.
      const body = document.createTextNode('')
      const tail = document.createElement('span')
      tail.style.fontWeight = TOGGLE_WEIGHT
      probe.append(body, tail)
      document.body.appendChild(probe)

      const heightOf = (s, t = '') => {
        body.data = s
        tail.textContent = t
        return probe.scrollHeight
      }
      const fits = (s, t) => heightOf(s, t) <= maxH

      try {
        if (fits(text, '')) {
          setClipped(null)
          setHeights(null)
          setFullH(null)
          return
        }
        const g = graphemes(text)
        let lo = 0
        let hi = g.length
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2)
          if (fits(g.slice(0, mid).join('') + ELLIPSIS, MORE_LABEL)) lo = mid
          else hi = mid - 1
        }
        const clip = g.slice(0, lo).join('').replace(/\s+$/, '')
        setClipped(clip)
        // The animated wrapper is overflow-hidden, so the paragraph's own
        // margins count INSIDE it (no margin collapse through the clip). Add
        // them or the tween lands short and shears the last line off.
        const gutter = (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0)
        // Collapsed is by definition exactly `lines` lines tall — deriving it
        // from the line height rather than re-measuring the clip means the
        // bolder toggle text can't push the last line past the cut.
        setHeights({ collapsed: lh * lines + gutter, gutter })
      } finally {
        probe.remove()
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, lines])

  const showToggle = clipped !== null

  // The expanded target is read off the live paragraph rather than the probe:
  // the toggle renders at font-medium, so a probe measured in the body weight
  // can come up a line short and shear the last line. The paragraph itself is
  // unconstrained (only the wrapper clips), so its scrollHeight is the truth.
  useLayoutEffect(() => {
    if (!expanded || !showToggle || !heights) return
    const el = ref.current
    if (!el) return
    setFullH(el.scrollHeight + heights.gutter)
  }, [expanded, showToggle, heights, text])

  const animateHeight = !showToggle || !heights
    ? 'auto'
    : expanded
      ? (fullH ?? 'auto')
      : heights.collapsed

  return (
    <motion.div
      className="overflow-hidden"
      initial={false}
      animate={{ height: animateHeight }}
      transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.42 }}
    >
      <p ref={ref} className={className}>
        {showToggle && !expanded ? clipped : text}
        {showToggle && (
          <>
            {ELLIPSIS}
            <button
              onClick={() =>
              setExpanded((v) => {
                onToggle?.(!v)
                return !v
              })
            }
              // The caption block this sits in is `pointer-events-none` so drags
              // pass through it to the 3D scene behind — which also made this
              // toggle unclickable. The block stays transparent to the pointer and
              // the one control in it takes its own events back.
              className={`pointer-events-auto font-medium text-[#21221f] underline underline-offset-2 transition hover:text-[#4e4e4e] ${buttonClassName}`}
            >
              {expanded ? 'ย่อ' : MORE_LABEL}
            </button>
          </>
        )}
      </p>
    </motion.div>
  )
}
