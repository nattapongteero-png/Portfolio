// -----------------------------------------------------------------------------
// TextPressure.jsx
// React Bits' TextPressure (itself a port of https://codepen.io/JuanFuentes/full/rgXKGQ):
// a headline whose letters bend their variable-font axes towards the cursor.
//
// Changes from upstream, each forced by where it runs:
//
//   * `altText` + a cursor-following reveal — the feature this was integrated
//     for. Two full words are stacked in the same box, the second masked to a
//     circle under the pointer, so poking the headline swaps THAT PART of it into
//     the other language. Per-character swapping is not an option: "HELLO" is 5
//     Latin letters and สวัสดี is 4 grapheme clusters, so there is no 1:1 map, and
//     mapping by position garbles the spelling. Masking is language-agnostic —
//     it reveals whatever is underneath at that spot.
//
//   * Axis ranges are props. Upstream hardcodes `wdth 5..200`, which is Roboto
//     Flex's range. This runs on Noto Sans Thai (the one Google font that is
//     variable AND covers Thai + Latin) whose wdth axis is 62.5..100 — with the
//     hardcoded numbers every value clamps to the ends and the width axis looks
//     dead. Same reason `italic` defaults off: Noto Sans Thai has no `ital` axis.
//
//   * `paused`. Upstream's rAF loop runs for the lifetime of the page and calls
//     getBoundingClientRect() per character per frame — a forced layout each, for
//     ever, on a page that also runs a rapier solver, two WebGL canvases and a
//     Flutter iframe. It stops when the section is not on screen.
//
//   * Sizing is measured with a ResizeObserver on the container rather than a
//     debounced window `resize` listener: the box this sits in is not the
//     viewport, and the app already has one shared resize source.
//
//   * The injected <style> (with an `@import` for the font) is gone — see
//     TextPressure.css and the font link in index.html.
// -----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './TextPressure.css'

const dist = (a, b) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Falls from `maxVal` at the cursor to `minVal` a full `maxDist` away.
//
// Upstream computes `maxVal - |maxVal·d/maxDist| + minVal`, which OVERSHOOTS to
// maxVal + minVal at the cursor. With Roboto Flex's 5..200 width range that just
// clamps harmlessly inside the axis; with Noto Sans Thai's 62.5..100 it means
// everything within a third of the word is pinned at the axis maximum — the
// width axis stops reading as a gradient and looks switched off. A plain clamped
// lerp keeps the same linear falloff and lands exactly on the range.
const getAttr = (distance, maxDist, minVal, maxVal) => {
  const t = Math.min(1, Math.max(0, 1 - distance / maxDist))
  return minVal + (maxVal - minVal) * t
}

// Thai stacks vowels and tone marks on top of the consonant they belong to, so
// splitting on code points would tear a syllable apart. Segmenter keeps each
// cluster whole; the Latin side is unaffected by going through it.
function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  }
  return Array.from(text)
}

export default function TextPressure({
  text = 'Hello',
  // The second language. Omit it and the component behaves like upstream.
  altText = null,
  // Radius of the circle that reveals `altText`, as a fraction of the container's
  // width — so it stays the same size relative to the word on any screen.
  revealRadius = 0.22,
  // How far from the word the cursor still counts. Upstream fixes the falloff at
  // half the word's width and has no notion of reaching the word at all — you had
  // to be right on the letters before anything moved. This multiplies both: the
  // distance over which the axes fall off, AND how far outside its own box a word
  // still answers the pointer.
  reach = 1,
  fontFamily = 'Noto Sans Thai',
  // Variable-font axis ranges. Defaults are Noto Sans Thai's actual ranges.
  weightRange = [100, 900],
  widthRange = [62.5, 100],
  width = true,
  weight = true,
  // The weight to hold when `weight` is off. Upstream falls back to a hardcoded
  // 400, which makes "don't animate the weight" mean "be book weight" — there is
  // no way to ask for a fixed bold.
  baseWeight = 400,
  italic = false,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = '#FFFFFF',
  strokeColor = '#FF0000',
  className = '',
  minFontSize = 24,
  // Set this and the auto-fit is skipped entirely. Two words fitted independently
  // to their own boxes come out at two different sizes — fine for one headline,
  // wrong for a phrase split across the page, where they have to read as one line
  // of type. The caller owns the size in that case.
  fontSize: fixedFontSize = null,
  paused = false,
}) {
  const containerRef = useRef(null)
  const titleRef = useRef(null)
  const altLayerRef = useRef(null)
  const baseLayerRef = useRef(null)
  // Two span arrays, one per language layer. Both are driven by the same loop:
  // the revealed language has to react to the cursor too, or the swapped part of
  // the word would sit there rigid while the rest of it moves.
  const spansRef = useRef([])
  const altSpansRef = useRef([])

  const mouseRef = useRef({ x: 0, y: 0 })
  const cursorRef = useRef({ x: 0, y: 0 })
  // Whether the pointer has ever moved. The resting position is the centre of the
  // word (so the letters start symmetrical), which is INSIDE the word's box — so
  // proximity alone still opened the reveal there and every word loaded with a
  // patch of the other language stuck in its middle. Nothing is revealed until
  // there is an actual pointer to follow.
  const movedRef = useRef(false)

  const [fontSize, setFontSize] = useState(fixedFontSize ?? minFontSize)
  const [scaleY, setScaleY] = useState(1)
  const [lineHeight, setLineHeight] = useState(1)

  const chars = graphemes(text)
  const altChars = altText ? graphemes(altText) : []

  useEffect(() => {
    const onMouseMove = (e) => {
      movedRef.current = true
      cursorRef.current.x = e.clientX
      cursorRef.current.y = e.clientY
    }
    const onTouchMove = (e) => {
      const t = e.touches[0]
      if (!t) return
      movedRef.current = true
      cursorRef.current.x = t.clientX
      cursorRef.current.y = t.clientY
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    // Start from the middle of the WORD so the first frame is symmetrical instead
    // of pinned to the top-left corner — and, with a second language present, so
    // the resting reveal lands on the letters. The container can be much taller
    // than the line of type inside it, in which case its centre is off the text.
    const box = titleRef.current ?? containerRef.current
    if (box) {
      const { left, top, width: w, height: h } = box.getBoundingClientRect()
      mouseRef.current.x = left + w / 2
      mouseRef.current.y = top + h / 2
      cursorRef.current.x = mouseRef.current.x
      cursorRef.current.y = mouseRef.current.y
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // Fit the word to the box.
  //
  // Upstream guesses the size as `containerWidth / (letters / 2)` — i.e. it
  // assumes a word occupies half an em per letter. HELLO in Noto Sans Thai wants
  // ~2.6em, so the guess came out too large, the flex line overflowed (
  // `space-between` cannot take space away) and the last letter was pushed 31px
  // outside the box, where the reveal mask cut it off. So the width is MEASURED
  // instead, on a detached probe pinned to the widest axis values the animation
  // can reach — the exact-fit size, no iteration and no magic ratio.
  //
  // Bounded on height too, which upstream is not: sized by width alone, five
  // letters across a 1440px box came out at 524px and ran far past a 288px-tall
  // container, and anything that masks that container cuts the letters in half.
  useLayoutEffect(() => {
    if (fixedFontSize != null) {
      setFontSize(fixedFontSize)
      return
    }
    const el = containerRef.current
    if (!el) return
    const widestEm = () => {
      const probe = document.createElement('span')
      probe.style.cssText =
        'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;text-transform:uppercase;line-height:1'
      probe.style.fontFamily = fontFamily
      probe.style.fontSize = '100px'
      probe.style.fontWeight = '100'
      // At the widest axis values the animation can actually reach — including
      // the fixed weight when the weight axis is switched off, since a bolder cut
      // is a wider one.
      probe.style.fontVariationSettings = `'wght' ${weight ? weightRange[1] : baseWeight}, 'wdth' ${widthRange[1]}, 'ital' 0`
      document.body.appendChild(probe)
      try {
        probe.textContent = text
        let widest = probe.getBoundingClientRect().width
        if (altText) {
          probe.textContent = altText
          widest = Math.max(widest, probe.getBoundingClientRect().width)
        }
        return widest / 100 // em per line of this text at its widest
      } finally {
        probe.remove()
      }
    }
    const measure = () => {
      const title = titleRef.current
      if (!title) return
      const { width: containerW, height: containerH } = el.getBoundingClientRect()
      if (!containerW) return
      const em = widestEm()
      const byWidth = em > 0 ? containerW / em : containerW
      // Thai stacks marks above and below the base line, so a line of it needs
      // appreciably more room than its nominal size — hence the 0.72 rather than
      // a cap-height ratio.
      const byHeight = containerH * 0.72
      setFontSize(Math.max(Math.min(byWidth, byHeight), minFontSize))
      setScaleY(1)
      setLineHeight(1)
      requestAnimationFrame(() => {
        if (!titleRef.current) return
        const rect = titleRef.current.getBoundingClientRect()
        if (scale && rect.height > 0) {
          const yRatio = containerH / rect.height
          setScaleY(yRatio)
          setLineHeight(yRatio)
        }
      })
    }
    measure()
    document.fonts?.ready.then(measure) // the fit changes once the webfont lands
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, altText, fontFamily, minFontSize, scale, weight, baseWeight, fixedFontSize])

  useEffect(() => {
    if (paused) return
    let rafId = 0
    const [wghtMin, wghtMax] = weightRange
    const [wdthMin, wdthMax] = widthRange

    const applyAxes = (spans, maxDist) => {
      for (const span of spans) {
        if (!span) continue
        const rect = span.getBoundingClientRect()
        const d = dist(mouseRef.current, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 })
        const wdth = width ? Math.round(getAttr(d, maxDist, wdthMin, wdthMax)) : 100
        const wght = weight ? Math.round(getAttr(d, maxDist, wghtMin, wghtMax)) : baseWeight
        const ital = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0
        const next = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${ital}`
        if (span.style.fontVariationSettings !== next) span.style.fontVariationSettings = next
        if (alpha) {
          const a = getAttr(d, maxDist, 0, 1).toFixed(2)
          if (span.style.opacity !== a) span.style.opacity = a
        }
      }
    }

    const animate = () => {
      // Chase the cursor rather than tracking it: the lag is what makes the
      // letters feel like they have weight.
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15

      const title = titleRef.current
      if (title) {
        const titleRect = title.getBoundingClientRect()
        const maxDist = (titleRect.width / 2) * reach
        applyAxes(spansRef.current, maxDist)
        if (altText) applyAxes(altSpansRef.current, maxDist)

        // The reveal. Written straight to the DOM — running it through state
        // would re-render the whole headline 60 times a second.
        if (altText && altLayerRef.current && baseLayerRef.current) {
          const x = mouseRef.current.x - titleRect.left
          const y = mouseRef.current.y - titleRect.top
          // The reveal only exists while the pointer is ON the word. Left always
          // on, every word sat there with a patch of the other language stuck in
          // its middle — the resting cursor position — which reads as a rendering
          // fault rather than something you did. Fading it out by how far the
          // cursor is from the word's box makes it a response to being poked.
          const outX = Math.max(0, Math.max(-x, x - titleRect.width))
          const outY = Math.max(0, Math.max(-y, y - titleRect.height))
          const outside = Math.hypot(outX, outY)
          // Deliberately measured against the word's HEIGHT, not its longer side.
          // Tried the width: at 2.2x that is a 220px tolerance, wider than the gap
          // between the two words, so BOTH of them revealed at once no matter where
          // the pointer was — the language swap stopped being local, which is the
          // whole point of it. The axes may answer from far away; the swap stays a
          // poke.
          const near = Math.max(0, 1 - outside / (0.5 * titleRect.height * reach))
          const r = movedRef.current ? revealRadius * titleRect.width * near : 0
          if (r < 1) {
            // A zero-radius radial-gradient is degenerate, so the two layers are
            // switched wholesale instead: base fully visible, alt fully hidden.
            altLayerRef.current.style.maskImage = 'linear-gradient(transparent, transparent)'
            altLayerRef.current.style.webkitMaskImage = 'linear-gradient(transparent, transparent)'
            baseLayerRef.current.style.maskImage = 'none'
            baseLayerRef.current.style.webkitMaskImage = 'none'
          } else {
            // Soft edge from 60% out, so the languages dissolve into each other
            // instead of meeting at a hard circle.
            const showAlt = `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 0%, #000 60%, transparent 100%)`
            const hideBase = `radial-gradient(circle ${r}px at ${x}px ${y}px, transparent 0%, transparent 60%, #000 100%)`
            altLayerRef.current.style.maskImage = showAlt
            altLayerRef.current.style.webkitMaskImage = showAlt
            baseLayerRef.current.style.maskImage = hideBase
            baseLayerRef.current.style.webkitMaskImage = hideBase
          }
        }
      }
      rafId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(rafId)
  }, [paused, width, weight, baseWeight, italic, alpha, altText, revealRadius, reach, weightRange, widthRange])

  // Room for the ink of a round glyph to overshoot its advance width without
  // being clipped by the reveal mask — see TextPressure.css.
  const layerStyle = { paddingInline: fontSize * 0.08 }

  const titleStyle = {
    fontFamily,
    fontSize,
    lineHeight,
    transform: `scale(1, ${scaleY})`,
  }

  const renderChars = (list, store) =>
    list.map((char, i) => (
      <span
        key={`${char}-${i}`}
        ref={(el) => {
          store.current[i] = el
        }}
        data-char={char}
        className="text-pressure__char"
        style={{ color: stroke ? undefined : textColor }}
      >
        {char}
      </span>
    ))

  const rootClass = [
    'text-pressure',
    flex ? 'text-pressure--flex' : '',
    stroke ? 'text-pressure--stroke' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={containerRef} className={rootClass} style={{ '--tp-stroke-color': strokeColor }}>
      {/* The base language. `titleRef` lives on this one: it is the geometry both
          layers are measured against. */}
      <div ref={baseLayerRef} className="text-pressure__layer" style={layerStyle}>
        <h1 ref={titleRef} className="text-pressure__title" style={titleStyle}>
          {renderChars(chars, spansRef)}
        </h1>
      </div>
      {altText && (
        <div ref={altLayerRef} className="text-pressure__layer" style={layerStyle}>
          <h1 className="text-pressure__title" style={titleStyle} aria-hidden="true">
            {renderChars(altChars, altSpansRef)}
          </h1>
        </div>
      )}
    </div>
  )
}
