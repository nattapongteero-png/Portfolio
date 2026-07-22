// -----------------------------------------------------------------------------
// FeedSection.jsx
// One feed section, a single viewport tall. Normal sections show a centered
// illustration. The "scene" section (MyAtlas) shows the 3D device parked and
// angled on the LEFT with its tagline on the right. Pressing its button focuses
// the device: it turns to face you and moves to the centre of the screen at a
// moderately larger size — big enough to read as "this is what we're looking at
// now", not a full-bleed takeover — and the live app becomes playable directly
// on the model's own screen.
// -----------------------------------------------------------------------------

import { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import SideActions from './SideActions'
import ClampText from './ClampText'
import PhoneModel, { SCREEN_MESH, PERSPECTIVE } from './PhoneModel'

// The parked device is the iPhone 17 Pro GLB (see PhoneModel), rendered in its
// own canvas under the office canvas with a projection matched to CSS's — so the
// whole rig (model + screen content) turns as one, no cross-fade ghosting.
const PARK_ANGLE = 50 // deg rotateY when fully parked (turned to the right)
// Screen geometry now comes from the model's own Screen_BG mesh instead of
// pixel-measuring a mockup PNG: SCREEN.w sizes the screen, everything else
// follows from the mesh.
const SCREEN = { w: 0.3535 } // screen width as a fraction of `size`
// Cover art shown on the phone screen.
const COVER_IMG = `${import.meta.env.BASE_URL}cover-myatlas.png`

// How much of the viewport height the screen fills once focused. Deliberately
// short of full-bleed: the device grows and centres, but you still see it as a
// device sitting on the page.
// The viewport the prototype was designed against. The app always lays out at
// this size and is scaled to the model, so the model's size never changes the
// app's layout.
const APP_VIEWPORT = { w: 390, h: 844 }
const FOCUS_FILL = 0.58
// The turn finishes in the first 45% of the move, so the phone is already
// facing you while it is still travelling to the centre.
const TURN_PORTION = 0.45
// Cover art hands over to the live app across the last 45%.
const HANDOVER_FROM = 0.55

const smoothstep = (x) => {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

export default function FeedSection({
  domId,
  index,
  image,
  projectId,
  projectIndex,
  avatar,
  initial,
  scene,
  info,
  progress = 0,
  offset = 0,
  onPrototypeFocus,
}) {
  // Subtle bottom fade while the section is scrolling away from focus.
  const s = Math.min(Math.abs(offset), 1) * 0.2
  const fadeMask = `linear-gradient(to bottom, #000 62%, rgba(0,0,0,${1 - s}) 100%)`

  // Re-render on resize so the phone-window geometry below stays correct.
  const [, setResizeTick] = useState(0)
  useEffect(() => {
    const onResize = () => setResizeTick((n) => n + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Scrolling never moves the device. The button focuses it: 0 = parked and
  // angled on the left, 1 = facing you, centred and enlarged with the app live
  // on its screen. The app iframe is mounted (hidden) as soon as this section is
  // focused so it has booted long before the button is pressed.
  const [focus, setFocus] = useState(0)
  const [protoMounted, setProtoMounted] = useState(false)
  // Reported to the nav the INSTANT the toggle is pressed, not when the eased
  // focus value crosses a threshold — deriving it from `focus` makes the
  // breadcrumb lag the device by the whole close animation.
  const [protoOpen, setProtoOpen] = useState(false)
  const [appReady, setAppReady] = useState(false)
  const focusRef = useRef(0)
  const animRef = useRef(0)
  const sectionRef = useRef(null)
  useEffect(() => {
    if (scene && Math.abs(offset) < 0.5) setProtoMounted(true)
  }, [scene, offset])
  const animateTo = (target, dur) => {
    cancelAnimationFrame(animRef.current)
    const from = focusRef.current
    const t0 = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2 // easeInOut
      focusRef.current = from + (target - from) * e
      setFocus(focusRef.current)
      if (k < 1) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(animRef.current), [])
  // The nav needs a way back out (tapping the parent crumb), so hand it a
  // stable closer alongside the flag. Kept behind a ref so the identity never
  // changes and the nav does not re-render on every frame of the animation.
  const closeFnRef = useRef(null)
  closeFnRef.current = () => {
    setProtoOpen(false)
    animateTo(0, 850)
  }
  const closeProto = useCallback(() => closeFnRef.current?.(), [])
  useEffect(() => {
    onPrototypeFocus?.(protoOpen, closeProto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protoOpen])

  // Both button labels are stacked out of flow, so the button has no intrinsic
  // width of its own — measure them and animate to whichever is showing, and it
  // shrinks/grows to its content instead of always sitting at the wider one.
  const playRef = useRef(null)
  const closeRef = useRef(null)
  const [labelW, setLabelW] = useState({ play: 0, close: 0, h: 0 })
  useLayoutEffect(() => {
    const measure = () =>
      setLabelW({
        play: playRef.current?.offsetWidth ?? 0,
        close: closeRef.current?.offsetWidth ?? 0,
        // Real rendered height — a hardcoded 1em clips Thai ascenders/descenders.
        h: Math.max(playRef.current?.offsetHeight ?? 0, closeRef.current?.offsetHeight ?? 0),
      })
    measure()
    document.fonts?.ready.then(measure) // widths shift once webfonts land
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // While the device is focused the page must not scroll away underneath it —
  // you close the prototype first. Wheel/touch are blocked on the feed's scroll
  // container rather than toggling `overflow`, which would jump the scroll
  // position. Gestures over the iframe never reach here, so the app itself
  // still scrolls normally. Escape closes.
  const focused = focus > 0.02
  useEffect(() => {
    if (!focused) return
    const scroller = sectionRef.current?.closest('[class*="overflow-y-scroll"]')
    if (!scroller) return
    // Make the feed genuinely non-scrollable rather than letting it scroll and
    // snapping it back — a reactive pin flickers, and the bounce-back also ate
    // the gestures meant for the app. `overflow: hidden` keeps scrollTop as it
    // is, so nothing jumps when it is released.
    const prevOverflow = scroller.style.overflowY
    scroller.style.overflowY = 'hidden'
    // The nav menu is a sibling of the whole feed with its own z-index, so it
    // paints over the device — on a narrow screen the focused phone fills the
    // viewport and the section titles land right on top of it. Flag the state
    // on <body> and let CSS fade the menu out (see index.css).
    document.body.dataset.protoFocused = '1'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setProtoOpen(false)
        animateTo(0, 850)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      scroller.style.overflowY = prevOverflow
      delete document.body.dataset.protoFocused
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused])

  // Focus geometry. Everything is driven by `focus`: the screen centre travels
  // from the parked spot to the middle of the viewport while the screen scales
  // from its parked size up to FOCUS_FILL of the viewport height.
  const q = focus
  const vw = window.innerWidth
  const vh = window.innerHeight
  // Two layouts. Wide: the device is parked on the LEFT with the copy beside it.
  // Narrow: there is no room for a column beside the device, so it is parked
  // CENTRED and higher up, with the copy stacked underneath.
  const isNarrow = vw < 768
  // Screen width is derived directly rather than from a sizing box, so it can be
  // driven by width on narrow screens and by height on wide ones.
  const scrW = isNarrow
    ? Math.min(0.62 * vw, (0.4 * vh) / SCREEN_MESH.aspect)
    : SCREEN.w * Math.min(0.66 * vh, 0.95 * vw)
  const scrH = scrW * SCREEN_MESH.aspect       // screen aspect comes from the mesh
  const pcx = isNarrow ? vw / 2 : vw * 0.34    // parked phone centre
  // Narrow: hang the device off the bottom of the nav menu instead of a fixed
  // fraction, so it never rides up over the section title.
  const NARROW_NAV_BOTTOM = 0.2
  const pcy = isNarrow ? NARROW_NAV_BOTTOM * vh + scrH / 2 : vh * 0.58
  const scy0 = pcy                             // the model is placed by its screen centre
  // Focused size is bounded on BOTH axes — height alone overflows a narrow
  // viewport sideways.
  const kFocus = Math.min((FOCUS_FILL * vh) / scrH, (0.52 * vw) / scrW)
  const k = 1 + (kFocus - 1) * q
  const cx = pcx + (vw / 2 - pcx) * q
  const cy = scy0 + (vh / 2 - scy0) * q
  const winW = scrW * k
  const winH = scrH * k
  const insetT = cy - winH / 2
  const insetB = vh - (cy + winH / 2)
  const insetL = cx - winW / 2
  const insetR = vw - (cx + winW / 2)
  // The model is the frame the app plays inside, so it never fades out.
  const phoneOpacity = 1
  const f = smoothstep(q / TURN_PORTION) // 0 = angled away, 1 = facing straight
  // 0.9x the screen's own radius: rounded enough to stay inside the body's much
  // rounder corners, fat enough that the background never peeks through.
  const clipRadius = 0.9 * SCREEN_MESH.radius * winW
  const swingY = PARK_ANGLE * (1 - f) // deg
  const swingX = 0
  // Cover art cross-fades into the live app over the last stretch of the move.
  // The app is on screen from the very start, so the cover art is only a
  // placeholder for the moments before the iframe has painted.
  const coverOpacity = appReady ? 0 : 1
  const live = q > 0.98 // only clickable once it has settled facing you
  // The app iframe keeps a CONSTANT layout size (the focused size) and is scaled
  // to the current one — resizing it every frame would reflow the whole app.
  const winWFocus = scrW * kFocus
  const winHFocus = scrH * kFocus

  // Fade the whole scene out while transitioning to a neighbouring section so
  // the parked device never sits under the next page's big title.
  const transitionFade = Math.max(0, 1 - Math.abs(offset) * 1.6)

  return (
    <section
      ref={sectionRef}
      id={domId}
      data-section-index={index}
      className="relative h-dvh w-full shrink-0 snap-start overflow-hidden bg-[#fafafa]"
    >
      {scene === 'office' ? (
        // Sticky viewport — pins while the 300dvh section scrolls, so the
        // scroll distance drives the park → zoom scrub.
        <div className="sticky top-0 h-dvh w-full overflow-hidden" style={{ opacity: transitionFade }}>
          {/* One 3D-swinging rig holds the frame + canvas + island, anchored on
              the screen centre — mid-zoom it tilts like lifting the phone
              toward your face, settling flat at both ends. */}
          {/* The phone itself — real geometry, real thickness, real lighting.
              Its own canvas, projection-matched to the CSS rig below. */}
          <PhoneModel
            cx={cx}
            cy={cy}
            screenW={winW}
            swingY={swingY}
            opacity={phoneOpacity}
            vw={vw}
            vh={vh}
          />

          <div
          className="absolute inset-0 z-10"
          style={{
            perspective: PERSPECTIVE,
            transformStyle: 'preserve-3d',
          }}
          >
          <div
            className="absolute inset-0"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotateY(${swingY}deg) rotateX(${swingX}deg)`,
              transformStyle: 'preserve-3d', // children keep their translateZ depth
              willChange: 'transform',
            }}
          >
          {/* The phone screen: the cover art, clipped to the screen opening so
              the bezel surrounds it exactly. */}
          {/* Decorative only, and it spans the whole viewport — so it must not
              intercept pointers, or it would swallow every tap meant for the app
              sitting below it. */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              clipPath: `inset(${insetT}px ${insetR}px ${insetB}px ${insetL}px round ${clipRadius}px)`,
              willChange: 'clip-path',
            }}
          >
            <img
              src={COVER_IMG}
              alt=""
              draggable={false}
              aria-hidden
              className="pointer-events-none absolute select-none object-cover"
              style={{
                left: cx - winW / 2,
                top: cy - winH / 2,
                width: winW,
                height: winH,
                opacity: coverOpacity,
                transition: 'opacity 400ms ease',
              }}
            />
          </div>

          {/* The live app, on the model's own screen from the start. It lives
              INSIDE the rotating rig, so while the device is parked and angled
              the app is foreshortened with it instead of floating flat on top.
              Its layout size is fixed (the focused size) and only scaled, so the
              app never reflows as the device grows. */}
          {protoMounted && info?.prototypeUrl && (
            // Clipped to the SAME screen opening as the cover art. Without this
            // the flat app plane and the model's actual screen surface sit at
            // slightly different depths, so once the device is angled the app
            // spills past the bezel. clip-path also clips hit-testing, so taps
            // only land on the screen itself.
            <div
              className="absolute inset-0 z-[9]"
              style={{
                clipPath: `inset(${insetT}px ${insetR}px ${insetB}px ${insetL}px round ${clipRadius}px)`,
                willChange: 'clip-path',
                pointerEvents: live ? 'auto' : 'none',
              }}
            >
              <div
                className="absolute overflow-hidden bg-white"
                style={{
                  left: cx - winWFocus / 2,
                  top: cy - winHFocus / 2,
                  width: winWFocus,
                  height: winHFocus,
                  borderRadius: SCREEN_MESH.radius * winWFocus,
                  transform: `scale(${k / kFocus})`,
                  transformOrigin: 'center',
                  overscrollBehavior: 'contain',
                }}
              >
                {/* The app is laid out at the device's OWN size — 390×844, the
                    viewport it was designed against — and then scaled to
                    whatever the model's screen currently measures. Sizing the
                    iframe to the model instead made Flutter re-run its layout
                    at that width, so shrinking the mockup reflowed the app:
                    text wrapped to more lines and cards changed height. Scaling
                    keeps the prototype identical to the real phone at every
                    model size. */}
                <iframe
                  src={info.prototypeUrl}
                  title={`${info.title ?? ''} UI Prototype`.trim()}
                  onLoad={() => setAppReady(true)}
                  className="block border-0"
                  style={{
                    width: APP_VIEWPORT.w,
                    height: APP_VIEWPORT.h,
                    transform: `scale(${winWFocus / APP_VIEWPORT.w})`,
                    transformOrigin: 'top left',
                  }}
                  allow="clipboard-write; fullscreen"
                />
              </div>
            </div>
          )}

          </div>
          </div>

          {/* Right-side info (tagline + description + tags) — visible while
              parked, fades as the zoom begins */}
          {info && (
            <div
              // Focusing does not dismiss this: it slides clear of the centred
              // device, shrinks and dims, so it reads as a background layer with
              // the mockup in front of it — depth rather than a disappearance.
              // z-[12] keeps it BEHIND the phone canvas (z-20).
              className="pointer-events-none absolute z-[12] flex flex-col md:max-w-[480px]"
              style={
                isNarrow
                  ? {
                      // Stacked under the device; it steps aside entirely while
                      // the prototype is focused, since a phone screen has no
                      // room for both.
                      top: pcy + (scrH * k) / 2 + 24,
                      left: 16,
                      right: 16,
                      opacity: Math.max(0, 1 - q * 2.2),
                      pointerEvents: q > 0.05 ? 'none' : undefined,
                    }
                  : {
                      top: scy0, // vertically centred on the parked phone
                      left: `${54 + 8 * q}%`,
                      right: `${16 - 8.5 * q}%`,
                      // Perspective tilt so the block reads as a plane sitting
                      // BEHIND the device rather than a flat label. Kept to 8
                      // degrees with a long perspective on purpose — enough to
                      // place it in depth, gentle enough that body copy (Thai
                      // especially, with stacked marks) stays crisp.
                      transformOrigin: 'right center',
                      transform: `perspective(1600px) translateY(calc(-50% - ${q * 26}px)) rotateY(${-8 * q}deg) scale(${1 - 0.2 * q})`,
                    }
              }
            >
              {info.tagline && (
                <p className="text-xl font-semibold leading-snug text-[#33332f] md:text-2xl lg:text-4xl">
                  {info.tagline}
                </p>
              )}
              {info.bio && (
                // The wrapper is pointer-events-none so the scene stays
                // draggable through it — the toggle re-enables clicks itself.
                <ClampText
                  text={info.bio}
                  lines={isNarrow ? 3 : 4}
                  className="mt-3 text-sm leading-relaxed text-[#4e4e4e] md:mt-5 md:text-base lg:text-lg"
                  buttonClassName="pointer-events-auto"
                />
              )}
              {/* One button, two states: it focuses the device, then becomes
                  the way back out — so the control never moves. */}
              <button
                onClick={() => {
                  if (focused) {
                    // No reload: the app keeps whatever screen you left it on,
                    // so reopening picks up exactly where you stopped.
                    setProtoOpen(false)
                    animateTo(0, 850)
                  } else {
                    setProtoMounted(true)
                    setProtoOpen(true)
                    animateTo(1, 1100)
                  }
                }}
                className="pointer-events-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-95 md:mt-8 md:px-6 md:py-3 lg:text-base"
              >
                {/* One icon, not two: a plus rotated 45 degrees IS a cross, so
                    the state change reads as a single continuous motion. */}
                <Plus
                  className="size-4 shrink-0 transition-transform duration-300 lg:size-5"
                  style={{ transform: `rotate(${focused ? 45 : 0}deg)` }}
                />
                {/* Both labels sit out of flow in the same box; the box
                    animates to the measured width of the active one, so the
                    button hugs its content in either state. */}
                <span
                  className="relative block text-left transition-[width] duration-300"
                  style={{
                    width: (focused ? labelW.close : labelW.play) || 'auto',
                    height: labelW.h || 'auto',
                  }}
                >
                  <span
                    ref={playRef}
                    className="absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300"
                    style={{ opacity: focused ? 0 : 1 }}
                  >
                    เล่น UI Prototype
                  </span>
                  <span
                    ref={closeRef}
                    className="absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300"
                    style={{ opacity: focused ? 1 : 0 }}
                  >
                    ปิด Prototype
                  </span>
                </span>
              </button>
            </div>
          )}


          {/* Narrow screens: the copy (and with it the toggle) steps aside while
              focused, so the way out has to be its own floating control. */}
          {isNarrow && q > 0.05 && (
            <button
              onClick={() => {
                setProtoOpen(false)
                animateTo(0, 850)
              }}
              aria-label="close"
              className="safe-top absolute right-4 top-4 z-30 grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition active:scale-90"
              style={{ opacity: Math.min(1, q / 0.3) }}
            >
              <Plus className="size-5" style={{ transform: 'rotate(45deg)' }} />
            </button>
          )}

          {/* Action buttons — inside the sticky viewport so they stay visible. */}
          <div
            className="page-shell safe-bottom pointer-events-none absolute inset-x-0 bottom-6 z-20 md:bottom-10"
            style={{
              opacity: (1 - s) * (isNarrow ? Math.max(0, 1 - q * 2.2) : 1),
              pointerEvents: isNarrow && q > 0.05 ? 'none' : undefined,
            }}
          >
            <div className="pointer-events-auto absolute bottom-0 right-4 flex flex-col items-center gap-2 md:right-12 md:gap-3">
              <SideActions projectId={projectId} projectIndex={projectIndex} avatar={avatar} initial={initial} />
            </div>
          </div>

        </div>
      ) : (
        <>
          <div
            className="absolute inset-0 flex items-center justify-center pb-[8vh]"
            style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
          >
            <motion.img
              key={image + domId}
              src={image}
              alt=""
              draggable={false}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-[68%] max-w-[280px] object-contain md:w-[600px] md:max-w-none"
            />
          </div>

          {/* Action buttons — bottom-right corner (fade along with the bottom) */}
          <div
            className="safe-bottom absolute bottom-6 right-4 z-20 md:bottom-10 md:right-12"
            style={{ opacity: 1 - s }}
          >
            {q > 0.02 && (
              <button
                onClick={() => {
                  animateTo(0, 850)
                  setRunId((n) => n + 1)
                }}
                aria-label="close"
                className="grid size-10 place-items-center rounded-full bg-[#eaeaea] text-[#4e4e4e] transition hover:bg-neutral-200 hover:text-[#33332f] active:scale-90 md:size-20"
                style={{ opacity: Math.min(1, q / 0.2) }}
              >
                <X className="size-4 md:size-7" />
              </button>
            )}
            <SideActions projectId={projectId} projectIndex={projectIndex} avatar={avatar} initial={initial} />
          </div>
        </>
      )}
    </section>
  )
}
