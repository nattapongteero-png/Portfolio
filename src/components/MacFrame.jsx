// -----------------------------------------------------------------------------
// MacFrame.jsx
// One MacBook, wearing whatever is put on its screen — the laptop counterpart of
// PhoneFrames, for the web builds this site documents.
//
// Same construction as PhoneFrames: the content is ordinary DOM in a box laid
// out from the MODEL's own measurements, and MacModel is drawn over it with the
// display punched out as a depth-only hole, so the bezel and the case sit over
// the content's edges.
//
// The three ratios below are computed from the GLB, not eyeballed. With the lid
// brought upright (the model is rotated forward by its 19.98° lean — see
// MacModel), the body's bounding box relative to the SCREEN measures:
//   • width   35.485 / 34.385 = 1.032 screen widths
//   • height  (11.78 above the screen centre + 22.06 below) / 22.25 = 1.521
//     screen heights — the deck reaches much further down than the lid does up,
//     because the base is tipped toward the viewer
//   • the screen's top edge sits 1.94% of that height down from the body's top
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react'
import MacModel, { MAC_SCREEN, PERSPECTIVE } from './MacModel'

const BODY = {
  w: 1.032, // body width, in screen widths
  h: 1.521, // body height, in screen heights
  screenTop: 0.0194, // screen's top edge, as a fraction of the body's height
}
// Perspective still magnifies the deck a little (it juts toward the camera), so
// the geometric box above is a touch short and the base was clipped off the
// bottom. The canvas gets its own margin on all four sides and the model is
// drawn at the size the box asks for — the frame keeps its measured layout, the
// machine simply has room to finish.
const BLEED = 0.12

export default function MacFrame({ children, className = '' }) {
  const boxRef = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const screenW = w / BODY.w
  const screenH = screenW * MAC_SCREEN.aspect
  const bodyH = screenH * BODY.h
  const screenTop = bodyH * BODY.screenTop

  return (
    <div
      ref={boxRef}
      className={`relative ${className}`}
      style={{ aspectRatio: `${BODY.w * 1} / ${BODY.h * MAC_SCREEN.aspect}` }}
    >
      {/* The screen's content, in the box the model's display will be drawn
          around. Square corners: at this size the lid's own radius is under a
          pixel, and the bezel covers the corners anyway. */}
      <div
        className="absolute overflow-hidden bg-white"
        style={{
          left: '50%',
          top: screenTop,
          width: screenW,
          height: screenH,
          transform: 'translateX(-50%)',
        }}
      >
        {children}
      </div>

      {/* The machine, over the top, on a canvas that overhangs the frame so the
          case is never cut off. Nothing here takes a pointer, so taps land on
          the content underneath. */}
      {w > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: -w * BLEED,
            right: -w * BLEED,
            top: -bodyH * BLEED,
            bottom: -bodyH * BLEED,
          }}
        >
          <MacModel
            cx={w * BLEED + w / 2}
            cy={bodyH * BLEED + screenTop + screenH / 2}
            screenW={screenW}
            vw={w * (1 + 2 * BLEED)}
            vh={bodyH * (1 + 2 * BLEED)}
            persp={PERSPECTIVE}
          />
        </div>
      )}
    </div>
  )
}
