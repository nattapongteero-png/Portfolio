// -----------------------------------------------------------------------------
// ClampText.jsx
// Clamps text to N lines and appends an INLINE "… เพิ่มเติม" toggle that
// continues on the same line rather than wrapping onto a new one.
//
// The fit is measured on a detached probe element mirroring the paragraph's
// width and font — never by mutating the rendered node, which React owns.
// Cuts land on grapheme-cluster boundaries so a Thai vowel or tone mark is
// never separated from its consonant.
// -----------------------------------------------------------------------------

import { useLayoutEffect, useRef, useState } from 'react'

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  }
  return Array.from(text) // fallback: code points
}

export default function ClampText({ text, lines = 4, className = '', buttonClassName = '' }) {
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [clipped, setClipped] = useState(null) // null = fits, no toggle needed

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
      document.body.appendChild(probe)

      const fits = (s) => {
        probe.textContent = s
        return probe.scrollHeight <= maxH
      }

      try {
        if (fits(text)) {
          setClipped(null)
          return
        }
        const g = graphemes(text)
        const SUFFIX = '… เพิ่มเติม'
        let lo = 0
        let hi = g.length
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2)
          if (fits(g.slice(0, mid).join('') + SUFFIX)) lo = mid
          else hi = mid - 1
        }
        setClipped(g.slice(0, lo).join('').replace(/\s+$/, ''))
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
  return (
    <p ref={ref} className={className}>
      {showToggle && !expanded ? clipped : text}
      {showToggle && (
        <>
          {'… '}
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`font-medium text-[#21221f] underline underline-offset-2 transition hover:text-[#4e4e4e] ${buttonClassName}`}
          >
            {expanded ? 'ย่อ' : 'เพิ่มเติม'}
          </button>
        </>
      )}
    </p>
  )
}
