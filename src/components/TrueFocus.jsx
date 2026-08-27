// -----------------------------------------------------------------------------
// TrueFocus.jsx
// React Bits' TrueFocus — the words of a sentence blur out except one, and a
// bracketed frame slides onto whichever word is in focus.
//
// Used on the nav's breadcrumb: opening the prototype turns "Pawmely" into
// "Pawmely / Prototype", and the frame travels from the section name onto the
// word Prototype while the name blurs back. Closing sends it the other way.
//
// Two changes from upstream:
//   * `activeIndex` — a controlled focus. Upstream only cycles on a timer or
//     follows hover; here the focused word IS application state (is the
//     prototype open?), so it has to be driven from outside.
//   * `motion/react` -> `framer-motion`. Same API, and the project already ships
//     framer-motion v11; installing `motion` alongside it would mean two copies
//     of the same animation library in the bundle.
// -----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import './TrueFocus.css'

const TrueFocus = ({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = 'green',
  glowColor = 'rgba(0, 255, 0, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  // Controlled focus — see the header note. When set, neither the timer nor
  // hover moves the frame.
  activeIndex,
  // Words that are never focusable and never blurred (the "/" in a breadcrumb
  // is punctuation, not a word you can look at).
  staticIndices = [],
  // The bracketed frame is optional. Without it the focus is carried purely by
  // the words themselves — sharp and full size versus small and blurred — which
  // is how the rest of the nav already reads.
  frame = true,
  // What an unfocused word shrinks and fades to, mirroring the treatment the
  // nav's own neighbouring titles get so the crumb belongs to the same system.
  inactiveScale = 1,
  inactiveOpacity = 1,
  // Clicking a word acts on it — in the nav that means the section name takes
  // you back up and "Prototype" opens the prototype.
  onWordClick,
  // Hovering a blurred word brings it back into focus without committing to it,
  // so you can read where a click would take you before taking it.
  hoverReveal = false,
  className = '',
}) => {
  const controlled = typeof activeIndex === 'number'
  const words = sentence.split(separator)
  const [currentIndex, setCurrentIndex] = useState(controlled ? activeIndex : 0)
  const [lastActiveIndex, setLastActiveIndex] = useState(null)
  const [hovered, setHovered] = useState(null)
  const containerRef = useRef(null)
  const wordRefs = useRef([])
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    if (controlled) setCurrentIndex(activeIndex)
  }, [controlled, activeIndex])

  useEffect(() => {
    if (manualMode || controlled) return
    const interval = setInterval(
      () => {
        setCurrentIndex((prev) => (prev + 1) % words.length)
      },
      (animationDuration + pauseBetweenAnimations) * 1000
    )
    return () => clearInterval(interval)
  }, [manualMode, controlled, animationDuration, pauseBetweenAnimations, words.length])

  // Layout effect, not effect: the frame is placed from measured rects, and
  // measuring after paint let the brackets show for a frame at the previous
  // word's size before snapping.
  useLayoutEffect(() => {
    if (currentIndex === null || currentIndex === -1) return
    const measure = () => {
      const el = wordRefs.current[currentIndex]
      if (!el || !containerRef.current) return
      // offsetLeft/Top, not getBoundingClientRect. The rect version reports
      // post-transform screen coordinates, but the frame is a child of the same
      // container and is positioned in the container's own untransformed space —
      // so anywhere this sits inside something scaled or rotated (here, the nav
      // wheel) the frame lands off the word by the transform's factor. Offsets
      // are layout coordinates and ignore transforms entirely.
      setFocusRect({
        x: el.offsetLeft,
        y: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      })
    }
    measure()
    // Webfonts land after first paint and change every word's width.
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [currentIndex, sentence])

  const handleMouseEnter = (index) => {
    if (manualMode && !controlled) {
      setLastActiveIndex(index)
      setCurrentIndex(index)
    }
  }

  const handleMouseLeave = () => {
    if (manualMode && !controlled) setCurrentIndex(lastActiveIndex)
  }

  return (
    <span className={`focus-container ${className}`} ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex
        const isStatic = staticIndices.includes(index)
        const isRevealed = hoverReveal && hovered === index
        const sharp = isActive || isStatic || isRevealed
        return (
          <span
            key={index}
            ref={(el) => {
              wordRefs.current[index] = el
            }}
            className={`focus-word ${manualMode ? 'manual' : ''} ${isActive ? 'active' : ''}`}
            style={{
              filter: sharp ? 'blur(0px)' : `blur(${blurAmount}px)`,
              // Shrunk by FONT SIZE, not by transform. A transform leaves the
              // word's original footprint behind, so the shrunken word sat in a
              // hole the width of the space it used to fill. Font size reflows,
              // and the line closes up around it.
              fontSize: isActive || isStatic ? '1em' : `${inactiveScale}em`,
              opacity: sharp ? 1 : inactiveOpacity,
              '--border-color': borderColor,
              '--glow-color': glowColor,
              transition: `filter ${animationDuration}s ease, font-size ${animationDuration}s ease, opacity ${animationDuration}s ease`,
            }}
            onMouseEnter={() => {
              setHovered(index)
              handleMouseEnter(index)
            }}
            onMouseLeave={() => {
              setHovered(null)
              handleMouseLeave()
            }}
            onClick={
              onWordClick && !isStatic
                ? (e) => {
                    // The word sits inside the nav option, which navigates on
                    // click — without this, opening the prototype would also
                    // scroll the feed to the section it belongs to.
                    e.stopPropagation()
                    onWordClick(index)
                  }
                : undefined
            }
          >
            {word}
          </span>
        )
      })}

      {frame && (
      <motion.span
        className="focus-frame"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration }}
        style={{
          '--border-color': borderColor,
          '--glow-color': glowColor,
        }}
      >
        <span className="corner top-left" />
        <span className="corner top-right" />
        <span className="corner bottom-left" />
        <span className="corner bottom-right" />
      </motion.span>
      )}
    </span>
  )
}

export default TrueFocus
