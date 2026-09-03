// -----------------------------------------------------------------------------
// FeedSection.jsx
// One feed section, a single viewport tall. Normal sections show a centered
// illustration. The "scene" section (Pawmely) shows the 3D device parked and
// angled on the LEFT with its tagline on the right. Pressing its button focuses
// the device: it turns to face you and moves to the centre of the screen at a
// moderately larger size — big enough to read as "this is what we're looking at
// now", not a full-bleed takeover — and the live app becomes playable directly
// on the model's own screen.
// -----------------------------------------------------------------------------

import { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import SideActions from './SideActions'
import { usePortfolio } from '../context/PortfolioContext'
import ClampText from './ClampText'
import PhoneModel, { SCREEN_MESH, PERSPECTIVE } from './PhoneModel'
import MacModel, { MAC_SCREEN, PERSPECTIVE as MAC_PERSPECTIVE } from './MacModel'
import Lanyard from './Lanyard'
import ContactBubbles from './ContactBubbles'
import ContactPills from './ContactPills'
import { onOpenContact, onFlipContact } from '../lib/contactPage'
import { requestReveal, REVEAL_MS } from '../lib/reveal'
import mickAvatar from '../assets/team-mick.png'
import { makeCard } from './idBadge'
import figmaLogo from '../assets/figma-1024px.webp'
import claudeLogo from '../assets/claude-1024px.webp'
import vscodeLogo from '../assets/visual-studio-code-1024px.webp'
import xcodeLogo from '../assets/xcode-1024px.webp'
import githubLogo from '../assets/github-1024px.webp'
import { hero, contact } from '../data/site'
import GradualBlur from './GradualBlur'
import useViewportSize from '../hooks/useViewportSize'

// The parked device is the iPhone 17 Pro GLB (see PhoneModel), rendered in its
// own canvas under the office canvas with a projection matched to CSS's — so the
// whole rig (model + screen content) turns as one, no cross-fade ghosting.
const PARK_ANGLE = 50 // deg rotateY when fully parked (turned to the right)
// Screen geometry now comes from the model's own Screen_BG mesh instead of
// pixel-measuring a mockup PNG: SCREEN.w sizes the screen, everything else
// follows from the mesh.
const SCREEN = { w: 0.3535 } // screen width as a fraction of `size`
// Cover art shown on the phone screen.
const COVER_IMG = `${import.meta.env.BASE_URL}cover-pawmely.jpg`

// How much of the viewport height the screen fills once focused. Deliberately
// short of full-bleed: the device grows and centres, but you still see it as a
// device sitting on the page.
// The viewport the prototype was designed against. The app always lays out at
// this size and is scaled to the model, so the model's size never changes the
// app's layout.
const APP_VIEWPORT = { w: 390, h: 844 }
const FOCUS_FILL = 0.62
// The turn finishes in the first 45% of the move, so the phone is already
// facing you while it is still travelling to the centre.
const TURN_PORTION = 0.45

// Two projects, two devices — and the rig below is the same rig for both, so
// everything it has to know about a device lives in one record. Pawmely is a
// phone app and is shown on the iPhone GLB; Metaherb is a WEB app and is shown
// on the MacBook GLB, at the desktop viewport it was actually designed against.
// Every geometric number here is read off the model's own screen mesh.
const DEVICES = {
  office: {
    Model: PhoneModel,
    aspect: SCREEN_MESH.aspect,
    radius: SCREEN_MESH.radius,
    // The phone parks turned away and swings round as it is opened.
    park: PARK_ANGLE,
    persp: PERSPECTIVE,
    // Where the device travels TO when focused, and where the copy column sits
    // beside it (left/right insets in %, parked -> focused). The phone centres
    // itself and the copy slides right a step.
    focusCx: 0.5,
    focusCy: 0.5,
    copy: { left: [54, 62], right: [16, 7.5] },
    thickness: 0.11, // of the screen width — recentre the silhouette while turned
    // How far the body reaches BELOW the screen's centre, in screen heights. A
    // phone is all screen, so it is half its own height; a laptop carries a
    // keyboard deck under the lid and reaches much further down.
    below: 0.5,
    app: APP_VIEWPORT,
    cover: COVER_IMG,
    wideW: SCREEN.w,
    wideCx: 0.34,
    // Dead centre. 0.58 dated from when the corner held a 72px heading the
    // device had to clear; the heading is a one-line masthead now and the rail
    // is gone, so a phone at 0.58 read as the whole page sagging low (measured:
    // content centre 570 on a 495 middle).
    wideCy: 0.5,
    narrowW: 0.62,
    narrowH: 0.4,
    fill: FOCUS_FILL,
    widthCap: 0.52,
    narrowFill: 0.66,
    narrowCap: 0.7,
  },
  desk: {
    Model: MacModel,
    aspect: MAC_SCREEN.aspect,
    // The lid's corners, as a fraction of the screen's width — far squarer than
    // a phone's, so reusing the phone's 0.13 rounded the site's corners off.
    radius: 0.012,
    // Parked turned away like the phone. The angle needs REAL perspective to
    // read as a turn (flat projection made it a skewed rectangle), and that
    // perspective is what the focused state must NOT have (it magnifies the
    // keyboard deck) — so the camera distance travels with the scrub: close
    // while parked, far once facing you. See perspPark/persp below.
    park: 22,
    thickness: 0,
    // Two camera distances, animated between (see the `persp` variable in the
    // rig): parked close enough that the turn reads as depth, focused far
    // enough that the projection is nearly flat and the deck folds slim. The
    // CSS rig that rotates the screen content projects from the SAME distance
    // each frame or the two shear apart mid-swing.
    persp: MAC_PERSPECTIVE,
    perspPark: 2600,
    // The laptop, focused, is twice the phone's width — dead centre it ran under
    // the copy column. It settles LEFT of centre instead, and the copy steps
    // further right, so the pair share the page exactly as Pawmely's do.
    focusCx: 0.46,
    // Focused, the SCREEN's centre is held above the viewport's middle so the
    // whole MACHINE — keyboard deck included — is what sits centred; on the
    // middle itself, all the deck's mass hung below and the device read as
    // sitting low. Measured off the rendered pixels at 1920×991: at 0.46 the
    // open machine spanned 240..879 — centre 559 against the viewport's 495.
    focusCy: 0.395,
    // The same resting insets Pawmely's copy settles at — the column was being
    // pushed to the screen's edge, which read as a different layout, not the
    // same one with a wider device. The room comes from the device sitting
    // further left instead.
    copy: { left: [54, 65], right: [16, 6.5] },
    // How far the machine reaches below the screen's centre. Nearly flat
    // projection now (see MacModel's PERSPECTIVE), so the deck adds little
    // beyond the case's own geometry: 12.8 units under a 22.25-tall screen,
    // plus a small margin for what perspective still shows of the deck's top.
    below: 0.68,
    // The viewport Metaherb's desktop layout is built for. The site lays out at
    // this size and is scaled to the screen, exactly as the phone app is.
    app: { w: 1440, h: 900 },
    // No still to stand in while it boots: the site is static HTML and comes up
    // in well under the time the phone app's Flutter engine needs.
    cover: null,
    // Landscape, so the parked size is led by WIDTH on a wide screen and capped
    // on height, not the other way round.
    // Parked further left and higher than the phone: a laptop is three times as
    // wide as a phone at the same height, and at the phone's 0.34 the lid ran
    // under the copy column beside it. It also carries a whole keyboard deck
    // BELOW its screen, so centring the screen where the phone's sits pushed the
    // base off the bottom of the viewport.
    wideW: 0.3,
    wideCx: 0.3,
    // The device's visual mass runs a keyboard deck below the screen, so the
    // screen centre sits well above true centre for the WHOLE object to read as
    // centred. Measured off the rendered pixels at 1920×991: at 0.46 the machine
    // spanned 230..890 — centre 560 against the viewport's 495, 65px low.
    wideCy: 0.395,
    narrowW: 0.86,
    narrowH: 0.34,
    // Matched to the phone's focused PRESENCE rather than its number: Pawmely's
    // screen grows just ~1.25x on opening and still reads as a device on the
    // page. 0.42 gives the laptop the same modest step up.
    fill: 0.42,
    widthCap: 0.6,
    narrowFill: 0.42,
    narrowCap: 0.92,
  },
}

// The hero's greeting, one word each side of the hanging pass. Boxes are given in
// percentages of the viewport rather than a flex row: the pass is a physics object
// in its own canvas, so nothing can lay out around it — the gap it hangs through
// has to be reserved by hand. 56%/44% leaves the card's ~16% of width clear on a
// wide screen. A phone has no room beside the card at all — it is more than half
// the width, and the caption band owns everything under it — so there the two
// words stagger above it instead, reading as two lines of one phrase.
const smoothstep = (x) => {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

// The top of the lanyard's own box, in the middle: where the strap comes down
// from. Falls back to the top centre of the screen if the scene is not mounted —
// the menu can ask for this page from anywhere.
function strapOrigin(el) {
  if (typeof window === 'undefined') return null
  const r = el?.getBoundingClientRect()
  if (!r || !r.width) return { x: window.innerWidth / 2, y: 0 }
  return { x: r.left + r.width / 2, y: r.top }
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
  // Set on the intro section: it wears the ID card instead of an illustration.
  lanyard = false,
  // Set on a screen that is only its title: no illustration, no copy, no rail.
  bare = false,
  // Copy + links for the phone's bottom caption band on sections that have no
  // desktop copy column of their own.
  caption,
  footer,
  progress = 0,
  offset = 0,
  onPrototypeFocus,
  // Bumped by the feed each time a page change finishes covering the screen.
  // The copy column is keyed on it, so the arriving page's lines come up in
  // order instead of being uncovered already finished.
  arriveKey = 0,
}) {
  // Subtle bottom fade while the section is scrolling away from focus.
  const s = Math.min(Math.abs(offset), 1) * 0.2
  const fadeMask = `linear-gradient(to bottom, #000 62%, rgba(0,0,0,${1 - s}) 100%)`

  // The phone-window geometry below is computed from the viewport, so it has to
  // re-render when the viewport changes. Through the shared hook rather than an
  // own `resize` listener: five sections each answering every event of a drag
  // resize is what made resizing feel frozen and land on stale numbers.
  const viewport = useViewportSize()
  // The hero greeting's type size. Derived from the viewport rather than set per
  // breakpoint so it moves continuously with the window instead of jumping, and
  // capped so it stays a background line behind the pass.

  // Scrolling never moves the device. The button focuses it: 0 = parked and
  // angled on the left, 1 = facing you, centred and enlarged with the app live
  // on its screen. The app iframe is mounted (hidden) as soon as this section is
  // focused so it has booted long before the button is pressed.
  // While a project's detail overlay is up it covers this page completely, and
  // its report reel mounts device canvases of its own. Holding a WebGL context
  // for a scene nobody can see is what pushed the page over the browser's
  // context budget and had the laptop killed off underneath it.
  const { view: portfolioView } = usePortfolio()
  const detailOpen = portfolioView === 'detail'
  const [focus, setFocus] = useState(0)
  const [protoMounted, setProtoMounted] = useState(false)
  // Reported to the nav the INSTANT the toggle is pressed, not when the eased
  // focus value crosses a threshold — deriving it from `focus` makes the
  // breadcrumb lag the device by the whole close animation.
  const [protoOpen, setProtoOpen] = useState(false)
  const [appReady, setAppReady] = useState(false)
  // Mobile only: an expanded description needs a backdrop to stay readable over
  // the scene, and the toggle under the device has to step out of its way.
  const [bioOpen, setBioOpen] = useState(false)
  // The pass's face, composed once. Drawn on a canvas rather than shipped as a
  // picture so the name and role on it are the SAME strings the rest of the page
  // prints — a badge with a stale job title is worse than no badge.
  // { front: { url }, back: { url, links } } — both faces, plus where the back's
  // two arrows were drawn so a tap on one can be answered.
  const [badge, setBadge] = useState(null)
  // Open while the pass is showing its back. Held here rather than inside the
  // card, because what it opens is a page, not part of the scene.
  const [contactOpen, setContactOpen] = useState(false)
  // True while the pass on the HOME screen is showing its back. Turning it over
  // used to change page; it drops the channels into this section instead, so the
  // flip and its answer happen in one place.
  const [pillsDown, setPillsDown] = useState(false)
  // The pills outlive `pillsDown` by the length of their exit: turned back to the
  // front, the floor is pulled and they fall off the bottom of the screen rather
  // than being switched off where they lie.
  const [pillsMounted, setPillsMounted] = useState(false)
  // Where the curtain should start. The card's own strap, when the card is what
  // was pulled; whatever the opener sends, when it is the menu.
  const [contactOrigin, setContactOrigin] = useState(null)
  // The hero's card is NOT frozen while the contact page is up. Freezing it
  // stopped the solver mid-swing — the card was still falling from the second tug
  // — and unfreezing it on the way back resumed that fall, so the home screen
  // arrived with the card lurching from 120 to 814 instead of hanging still. It
  // costs one small solver running behind a covered screen; it buys the two trips
  // being the same move.
  // Bumped when the home screen is the page ARRIVING, so its card is released the
  // same way the contact page's card is on the way out.
  const [heroRebound, setHeroRebound] = useState(0)
  const lanyardRef = useRef(null)
  // Long enough for the tallest fall from the floor line to clear the bottom of
  // the screen; measured at 1s, the last pill is well past it.
  useEffect(() => {
    if (pillsDown || !pillsMounted) return undefined
    const id = window.setTimeout(() => setPillsMounted(false), 1000)
    return () => window.clearTimeout(id)
  }, [pillsDown, pillsMounted])

  // The menu asks for the same page the card does.
  useEffect(
    () =>
      // ONLY the section that carries the pass answers this. Every section on the
      // feed mounts this component, so an unguarded subscription had all of them
      // open a contact page at once — and the ones without a card built no badge,
      // so the top of that stack was a pass with the stock artwork on it. Opened
      // from the menu the card looked like a different card because it WAS one.
      !lanyard
        ? undefined
        : onOpenContact(origin => {
            setContactOrigin(origin ?? strapOrigin(lanyardRef.current))
            setContactOpen(true)
          }),
    [lanyard]
  )
  // The menu's Contact row: same answer as turning the pass yourself. The feed
  // is already on its way home when this fires; the card is turning as the home
  // screen arrives, and the channels fall out of it there.
  useEffect(
    () =>
      !lanyard
        ? undefined
        : onFlipContact(() => {
            setPillsMounted(true)
            setPillsDown(true)
          }),
    [lanyard]
  )
  useEffect(() => {
    if (!lanyard) return
    let live = true
    makeCard({
      photoSrc: mickAvatar,
      // The same five files the project pages print as the tools row. One list,
      // one set of logos — a card claiming a tool the case study does not is the
      // kind of drift a portfolio cannot afford.
      toolSrcs: [figmaLogo, claudeLogo, vscodeLogo, xcodeLogo, githubLogo],
      front: {
        // Short strings only. At the size this card is shown, a long field is a
        // grey smear rather than a line of type.
        name: hero.fullName,
        role: hero.role,
        nickname: hero.nickname,
      },
      back: {
        title: 'Contact',
        // The site's own invitation, not a line written for the card.
        line: contact.title,
      },
    }).then((made) => live && setBadge(made))
    return () => {
      live = false
    }
  }, [lanyard])
  const focusRef = useRef(0)
  const animRef = useRef(0)
  const sectionRef = useRef(null)
  // Mount the (heavy) prototype iframe when this section comes near — but off
  // the scroll's critical path. Booting a Flutter app is expensive, and doing it
  // the instant `offset` crosses 0.5 landed that cost right in the middle of the
  // scroll, so scrolling INTO Pawmely stuttered. requestIdleCallback holds the
  // mount until the browser is idle (i.e. the scroll has settled); the timeout is
  // the backstop so it still mounts if the page never goes fully idle. Pressing
  // Play mounts it immediately regardless — the cover still hides the boot.
  useEffect(() => {
    if (!scene || protoMounted || Math.abs(offset) >= 0.5) return
    const ric = window.requestIdleCallback
    if (ric) {
      const id = ric(() => setProtoMounted(true), { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(() => setProtoMounted(true), 400)
    return () => clearTimeout(id)
  }, [scene, offset, protoMounted])
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
  // The same handshake for opening, so the nav's "Prototype" crumb can start it
  // — the button in the copy is no longer the only way in.
  const openFnRef = useRef(null)
  openFnRef.current = () => {
    setProtoMounted(true)
    setProtoOpen(true)
    animateTo(1, 1100)
  }
  const openProto = useCallback(() => openFnRef.current?.(), [])
  // Leaving the page closes its prototype. Changing project while the app was
  // focused left this section's zoom state where it was, so coming BACK landed
  // on a screen still stuck in the played state. The swap happens under the
  // arc curtain, so the reset is instant — no close animation to see.
  useEffect(() => {
    if (!protoOpen || Math.abs(offset) < 0.5) return
    setProtoOpen(false)
    cancelAnimationFrame(animRef.current)
    focusRef.current = 0
    setFocus(0)
  }, [offset, protoOpen])
  // Reported on mount as well as on every toggle, so the nav can show the crumb
  // for a section that HAS a prototype even while it is closed. Guarded to
  // sections that actually own one: every section runs this effect, so without
  // the guard the last one mounted claimed the crumb and the nav labelled the
  // wrong section.
  const ownsPrototype = Boolean(scene && info?.prototypeUrl)
  useEffect(() => {
    if (!ownsPrototype) return
    onPrototypeFocus?.(protoOpen, closeProto, openProto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protoOpen, ownsPrototype])

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

  // How tall the bottom caption band actually is. The toggle under the device is
  // positioned from the device, and on a short phone (568-640 CSS px) the device
  // reaches far enough down that the two collided — the button landed on top of
  // the tagline. Measured rather than assumed: the band's height depends on how
  // the Thai copy wraps at that width.
  // `offsetTop`, not height-minus-offsets: the caption band and this toggle share
  // the same positioned ancestor, so offsetTop is already in the toggle's own
  // coordinate space. Deriving the band's top from its height plus its bottom
  // inset came out ~35px short — the height reads before the webfont and the
  // ClampText height tween have settled.
  const captionRef = useRef(null)
  const toggleBoxRef = useRef(null)
  const [captionTop, setCaptionTop] = useState(Infinity)
  // The toggle's wrapper is taller than the pill itself — it also carries the
  // second, hidden label the width animation measures against — so the clamp has
  // to use the wrapper's real height, not the 44px of visible pill.
  const [toggleBoxH, setToggleBoxH] = useState(64)
  useLayoutEffect(() => {
    const el = captionRef.current
    if (!el) return setCaptionTop(Infinity)
    const measure = () => {
      setCaptionTop(el.offsetTop)
      if (toggleBoxRef.current) setToggleBoxH(toggleBoxRef.current.offsetHeight)
    }
    measure()
    document.fonts?.ready.then(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewport.width, viewport.height, bioOpen, info])

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
  // Which device this section is shown on. Anything that is not a device scene
  // never reaches the rig below, so the phone is a safe default.
  const dev = DEVICES[scene] ?? DEVICES.office
  const vw = viewport.width
  const vh = viewport.height
  // Two layouts. Wide: the device is parked on the LEFT with the copy beside it.
  // Narrow: there is no room for a column beside the device, so it is parked
  // CENTRED and higher up, with the copy stacked underneath.
  const isNarrow = vw < 768
  // Screen width is derived directly rather than from a sizing box, so it can be
  // driven by width on narrow screens and by height on wide ones.
  const scrW = isNarrow
    ? Math.min(dev.narrowW * vw, (dev.narrowH * vh) / dev.aspect)
    : // Portrait is sized off the viewport's HEIGHT; landscape off its width,
      // capped by height so a short window cannot push the lid off screen.
      dev === DEVICES.desk
      ? Math.min(dev.wideW * vw, (0.5 * vh) / dev.aspect)
      : dev.wideW * Math.min(0.66 * vh, 0.95 * vw)
  const scrH = scrW * dev.aspect               // screen aspect comes from the mesh
  const pcx = isNarrow ? vw / 2 : vw * dev.wideCx    // parked device centre
  // Narrow: hang the device off the bottom of the nav menu instead of a fixed
  // fraction, so it never rides up over the section title.
  const NARROW_NAV_BOTTOM = 0.2
  const pcy = isNarrow ? NARROW_NAV_BOTTOM * vh + scrH / 2 : vh * dev.wideCy
  const scy0 = pcy                             // the model is placed by its screen centre
  // Focused size is bounded on BOTH axes — height alone overflows a narrow
  // viewport sideways.
  //
  // A phone gets its own, larger bounds. At 0.58/0.52 the focused device came
  // out ~203px wide on a 390px screen, and since the model's bezel is only ~9px
  // a side at that size, the app read as spilling past the frame rather than
  // playing inside it. It is the device that was too small, not the app too big.
  // Still bounded on both axes, and still short of full-bleed: the frame has to
  // stay visible for the thing inside it to read as a phone screen, and the
  // close button sits below it.
  const fill = isNarrow ? dev.narrowFill : dev.fill
  const widthCap = isNarrow ? dev.narrowCap : dev.widthCap
  const kFocus = Math.min((fill * vh) / scrH, (widthCap * vw) / scrW)
  // What is on the screen is drawn slightly INSIDE it on a phone, leaving a
  // border of glass around it. The alternative — drawing the model bigger than
  // its content — moved the device itself, and a parked phone that grew 14%
  // pushed its own top off the screen. This changes nothing about where the
  // device is or how big it is; only what plays on it.
  //
  // The border is a fixed number of PIXELS, so it is the same on all four sides
  // — see below, where the device's live size is known.
  const k = 1 + (kFocus - 1) * q
  const turn = smoothstep(q / TURN_PORTION) // 0 = angled away, 1 = facing you
  const swing = dev.park * (1 - turn) // deg of rotateY at this moment
  // The camera distance this frame — rides the same turn as the swing, so the
  // depth drains out exactly as the device comes square. Constant for devices
  // that declare no parked distance (the phone).
  const persp = (dev.perspPark ?? dev.persp) + (dev.persp - (dev.perspPark ?? dev.persp)) * turn
  // The device turns around the centre of its SCREEN, which sits on the front
  // face — so the body swings back and to one side, and its silhouette stops
  // being centred on the screen. Parked at 50 degrees that reads as the phone
  // sitting left of centre on a phone, where it is supposed to be centred.
  // Shifting by half the body's thickness times sin(angle) puts the silhouette
  // back on the middle; it falls to zero as the device turns to face you.
  const BODY_THICKNESS = dev.thickness // of the screen's width, measured off the model
  const turnOffset = isNarrow
    ? ((BODY_THICKNESS * scrW) / 2) * Math.sin((swing * Math.PI) / 180) * k
    : 0
  const cx = pcx + (vw * (isNarrow ? 0.5 : dev.focusCx) - pcx) * q + turnOffset
  const cy = scy0 + (vh * (isNarrow ? 0.5 : dev.focusCy) - scy0) * q
  const winW = scrW * k
  const winH = scrH * k
  // A single uniform scale cannot give an even border: the device is 2.2x taller
  // than it is wide, so the same percentage leaves a top/bottom gap twice the
  // side one. Hence separate x/y factors — the ~1.5% difference between them is
  // far below anything visible as distortion in the app.
  const glassBorder = isNarrow ? winW * 0.02 : 0
  const contentSX = 1 - (2 * glassBorder) / winW
  const contentSY = 1 - (2 * glassBorder) / winH
  const insetT = cy - winH / 2
  const insetB = vh - (cy + winH / 2)
  const insetL = cx - winW / 2
  const insetR = vw - (cx + winW / 2)
  // The model is the frame the app plays inside, so it never fades out.
  const phoneOpacity = 1
  // JSX needs a capitalised binding to treat this as a component rather than a
  // DOM tag.
  const DeviceModel = dev.Model
  const f = turn
  // 0.9x the screen's own radius: rounded enough to stay inside the body's much
  // rounder corners, fat enough that the background never peeks through.
  const clipRadius = 0.9 * dev.radius * winW
  const swingY = swing
  const swingX = 0
  // The live prototype stays on the phone even while parked, frozen on whatever
  // screen it was last left on. A cross-origin iframe can't be told to pause, but
  // Flutter only paints on a dirty frame, so a prototype sitting still costs
  // almost nothing — it isn't "playing", just displayed. Reopening is therefore
  // continuous. The still capture only stands in until the iframe has booted.
  const coverOpacity = appReady ? 0 : 1
  const live = q > 0.98 // only clickable once it has settled facing you
  // The app iframe keeps a CONSTANT layout size (the focused size) and is scaled
  // to the current one — resizing it every frame would reflow the whole app.
  const winWFocus = scrW * kFocus
  const winHFocus = scrH * kFocus

  // Where the toggle under the device sits on a phone. Its natural spot is 24px
  // below the live bottom edge of the screen, but on a short viewport the device
  // reaches down into the caption band and the pill landed on the tagline. So it
  // is also capped to stay 12px clear of the band's measured top. Not capped while
  // the description is expanded: the band then covers the whole lower half by
  // design and the pill is behind its blur.
  const toggleNaturalTop = cy + scrH * k * dev.below + 24
  // The cap only applies while the device is PARKED. Focused, the caption band is
  // faded out and out of the way — but its box is still there to be measured, so
  // the cap went on pulling the toggle up, and once the device had grown to fill
  // the screen that put the close button on top of the running app.
  const toggleTop =
    bioOpen || q > 0.05
      ? toggleNaturalTop
      : Math.min(toggleNaturalTop, captionTop - 12 - toggleBoxH)

  // Fade the whole scene out while transitioning to a neighbouring section so
  // the parked device never sits under the next page's big title.
  const transitionFade = Math.max(0, 1 - Math.abs(offset) * 1.6)

  // One toggle, rendered in two places. On desktop it belongs to the copy
  // column; on a phone it sits under the device, which means it cannot live
  // inside the bottom-anchored caption. Declared once so the two never drift.
  // One button, two states: it focuses the device, then becomes the way back
  // out — so the control never moves.
  const protoToggle = (
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
              // Close stays red either way: it is the one control that has to be
              // findable without looking for it.
              className={`pointer-events-auto mt-5 flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-95 md:mt-8 md:px-6 md:py-3 lg:text-base ${
                protoOpen
                  ? 'bg-[#e5484d] text-white hover:bg-[#c93b40]'
                  : 'bg-[#21221f] text-white hover:bg-[#33312c]'
              }`}
            >
              {/* One icon, not two: a plus rotated 45 degrees IS a cross, so
                  the state change reads as a single continuous motion. */}
              <Plus
                className="size-4 shrink-0 transition-transform duration-300 lg:size-5"
                style={{ transform: `rotate(${protoOpen ? 45 : 0}deg)` }}
              />
              {/* Both labels sit out of flow in the same box; the box
                  animates to the measured width of the active one, so the
                  button hugs its content in either state. State comes from
                  protoOpen — the intent set on the press itself — not from the
                  eased focus value, so the label/icon flip in step with the
                  click instead of trailing the whole close animation. */}
              <span
                className="relative block text-left transition-[width] duration-300"
                style={{
                  width: (protoOpen ? labelW.close : labelW.play) || 'auto',
                  height: labelW.h || 'auto',
                }}
              >
                <span
                  ref={playRef}
                  className="absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300"
                  style={{ opacity: protoOpen ? 0 : 1 }}
                >
                  เล่น UI Prototype
                </span>
                <span
                  ref={closeRef}
                  className="absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300"
                  style={{ opacity: protoOpen ? 1 : 0 }}
                >
                  ปิด Prototype
                </span>
              </span>
            </button>
  )

  return (
    <section
      ref={sectionRef}
      id={domId}
      data-section-index={index}
      // Every section is the same pale ground. The scene section used to run
      // black so the aurora read as light; the aurora is gone, and the black was
      // only ever there to hold it.
      className="relative h-dvh w-full shrink-0 snap-start overflow-hidden bg-[#fafafa]"
    >
      {scene ? (
        // Sticky viewport — pins while the 300dvh section scrolls, so the
        // scroll distance drives the park → zoom scrub.
        <div className="sticky top-0 h-dvh w-full overflow-hidden">
          {/* One 3D-swinging rig holds the frame + canvas + island, anchored on
              the screen centre — mid-zoom it tilts like lifting the phone
              toward your face, settling flat at both ends. */}
          {/* The phone itself — real geometry, real thickness, real lighting.
              Its own canvas, projection-matched to the CSS rig below.
              MOUNTED ONLY WHEN NEAR. Every scene section used to keep its own
              WebGL context alive at all times — five devices plus the hero's
              lanyard, six live contexts. Opening a project's detail mounts three
              more (the report reel's device cards), and a browser only allows a
              handful per page: at nine, Chrome silently killed the three oldest,
              which is why coming back from a detail page found the laptop gone
              (measured: 3 × "THREE.WebGLRenderer: Context Lost", 0 restored).
              A section two pages away has nothing to show, so it holds no
              context — and the model remounts as it comes back into range. */}
          {Math.abs(offset) <= 1 && !detailOpen && (
          <DeviceModel
            cx={cx}
            cy={cy}
            // The model is drawn to a screen slightly WIDER than the app on a
            // phone. Matching them exactly is geometrically correct, but the
            // GLB's bezel is only ~4% of its width, and at phone size that is
            // about 10px — thin enough that the app read as spilling over the
            // frame instead of playing inside it. Oversizing the device leaves
            // the app centred on a visible border of glass.
            screenW={winW}
            swingY={swingY}
            opacity={phoneOpacity}
            vw={vw}
            vh={vh}
            persp={persp}
          />
          )}

          {/* The screen rig — glass, cover art, live app — sits ABOVE the model's
              canvas (z-20), which is what keeps the device's Dynamic Island off
              the screen: parked or playing, the island is a lump of black over the
              content, and the model is here to frame that content, not to sit on
              it.
              Hiding the island mesh does not work — the front face has a hole cut
              for it, so hiding it shows the inside of the body through that hole:
              an identical black pill. (Verified by recolouring the mesh red to
              confirm which one it was, then hiding it and watching the pill stay.)
              Everything in this rig is clipped to the screen opening, so covering
              the island costs none of the bezel. */}
          <div
          // Transparent to the pointer, both levels of it. Raising the rig above
          // the canvas also raised it above the copy column (z-12) and the action
          // rail (z-20), and a full-viewport div with no background still takes
          // every click — so opening the prototype made the whole page dead,
          // close button included. Only the app's own layer inside re-enables
          // pointer events, and only once it is live.
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 21,
            perspective: persp,
            transformStyle: 'preserve-3d',
          }}
          >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotateY(${swingY}deg) rotateX(${swingX}deg)`,
              transformStyle: 'preserve-3d', // children keep their translateZ depth
              willChange: 'transform',
            }}
          >
          {/* The glass under everything. The model punches a depth-only hole where
              its screen is, so whatever CSS sits below shows through it — which
              means the ring left by insetting the content was not a border, it
              was a hole onto the page behind. This fills the screen opening
              edge to edge in black, so that ring reads as switched-off glass. */}
          <div
            className="pointer-events-none absolute inset-0 z-[9]"
            style={{
              clipPath: `inset(${insetT}px ${insetR}px ${insetB}px ${insetL}px round ${clipRadius}px)`,
              willChange: 'clip-path',
            }}
          >
            <div
              className="absolute left-0 top-0 bg-black"
              style={{
                width: winWFocus,
                height: winHFocus,
                transform: `translate(${cx - winWFocus / 2}px, ${cy - winHFocus / 2}px) scale(${k / kFocus})`,
                transformOrigin: 'center',
                borderRadius: dev.radius * winWFocus,
                willChange: 'transform',
              }}
            />
          </div>

          {/* The phone screen: the cover art, clipped to the screen opening so
              the bezel surrounds it exactly. */}
          {/* Decorative only, and it spans the whole viewport — so it must not
              intercept pointers, or it would swallow every tap meant for the app
              sitting below it. */}
          {(info?.cover ?? dev.cover) && (
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              clipPath: `inset(${insetT}px ${insetR}px ${insetB}px ${insetL}px round ${clipRadius}px)`,
              willChange: 'clip-path',
            }}
          >
            <img
              src={info?.cover ?? dev.cover}
              alt=""
              draggable={false}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 select-none object-cover"
              // Fixed layout size + transform, not per-frame left/top/width/height:
              // moving/sizing via transform keeps the zoom on the compositor
              // instead of relaying out the image every frame.
              style={{
                width: winWFocus,
                height: winHFocus,
                transform: `translate(${cx - winWFocus / 2}px, ${cy - winHFocus / 2}px) scale(${(k / kFocus) * contentSX}, ${(k / kFocus) * contentSY})`,
                transformOrigin: 'center',
                willChange: 'transform',
                opacity: coverOpacity,
                transition: 'opacity 400ms ease',
              }}
            />
          </div>
          )}

          {/* And tapping anywhere OFF the app closes it again. It sits at z-[5],
              which is under everything you can actually press — the app itself
              (z-[9] inside this rig), the copy column (z-[12]), the action rail
              and the close button — so it only ever catches the empty page
              around them. Live only once the zoom has settled: during the open
              animation a stray click would slam it shut again. */}
          {protoOpen && live && (
            <button
              type="button"
              aria-label="ปิด Prototype"
              tabIndex={-1}
              onClick={closeProto}
              className="pointer-events-auto absolute inset-0 z-[5] cursor-default"
              style={{ background: 'transparent' }}
            />
          )}

          {/* Tapping the device IS pressing play. The button in the copy stays —
              it names the action — but the phone is the thing on screen that
              looks pressable, and it was inert. Only while the prototype is shut:
              once it is open the same area belongs to the app, and this layer
              would swallow every tap meant for it. Clipped to the screen opening
              so the hit area is the screen, not the whole viewport. */}
          {!protoOpen && info?.prototypeUrl && (
            <button
              type="button"
              aria-label={`เล่น UI Prototype ของ ${info.title ?? ''}`.trim()}
              onClick={openProto}
              className="pointer-events-auto absolute inset-0 z-[11] cursor-pointer"
              style={{
                clipPath: `inset(${insetT}px ${insetR}px ${insetB}px ${insetL}px round ${clipRadius}px)`,
                willChange: 'clip-path',
                background: 'transparent',
              }}
            />
          )}

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
                className="absolute left-0 top-0 overflow-hidden bg-white"
                // The heavy one: this box holds the live app iframe. Driving its
                // position by left/top forced a layout of the iframe every frame
                // of the open/close zoom. Position AND scale now ride a single
                // transform, so the iframe is only composited, never relaid out.
                style={{
                  width: winWFocus,
                  height: winHFocus,
                  borderRadius: dev.radius * winWFocus,
                  transform: `translate(${cx - winWFocus / 2}px, ${cy - winHFocus / 2}px) scale(${(k / kFocus) * contentSX}, ${(k / kFocus) * contentSY})`,
                  transformOrigin: 'center',
                  willChange: 'transform',
                  overscrollBehavior: 'contain',
                }}
              >
                {/* The app is laid out at the viewport it was DESIGNED against
                    — the device's default (390×844), or the project's own
                    `appViewport` when it targets another canvas: Metaherb
                    Mobile draws at 430×932, and laying it out at 390 cut its
                    right edge off inside the frame. Then it is only scaled to
                    whatever the model's screen currently measures — sizing the
                    iframe to the model instead made the app re-run its layout
                    at that width, so shrinking the mockup reflowed it. */}
                <iframe
                  src={info.prototypeUrl}
                  title={`${info.title ?? ''} UI Prototype`.trim()}
                  onLoad={() => setAppReady(true)}
                  className="block border-0"
                  style={{
                    width: (info.appViewport ?? dev.app).w,
                    height: (info.appViewport ?? dev.app).h,
                    transform: `scale(${winWFocus / (info.appViewport ?? dev.app).w})`,
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
              // Remounted on every page change, which is what restarts the
              // stagger — a CSS animation only replays on a fresh element.
              key={`copy-${arriveKey}`}
              ref={captionRef}
              // Focusing does not dismiss this: it slides clear of the centred
              // device, shrinks and dims, so it reads as a background layer with
              // the mockup in front of it — depth rather than a disappearance.
              // z-[12] keeps it BEHIND the phone canvas (z-20).
              className={`rise-in pointer-events-none absolute z-[12] flex flex-col md:max-w-[480px] ${
                // Expanded, the block runs to the left, right and bottom edges
                // and takes its breathing room as INTERNAL padding instead —
                // a blur that stops short of the edge reads as a floating card,
                // not as the page quietening down behind the words.
                bioOpen && isNarrow ? 'pb-10 pl-4 pr-[84px] pt-6' : ''
              }`}
              style={
                isNarrow
                  ? {
                      // Pinned to the BOTTOM of the screen, the way a feed app
                      // sets its caption — not floated under the device. Nothing
                      // about it then depends on where the phone is or how big
                      // it has grown, so focusing the prototype cannot move it.
                      top: 'auto',
                      // Collapsed the caption is inset like a caption. Expanded
                      // it becomes a full-width band: the blur behind it has to
                      // reach the edges of the screen, so the box does too and
                      // the insets move inside as padding.
                      bottom: bioOpen ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 40px)',
                      left: bioOpen ? 0 : 20,
                      // Collapsed, it stops short of the action rail so the
                      // caption and the buttons share the bottom band side by
                      // side instead of stacking.
                      right: bioOpen ? 0 : 84,
                      // Focusing the prototype clears the screen for it: on a
                      // phone the app IS the content once it is open, and the
                      // caption behind it is just noise you cannot act on.
                      // Everything comes back on close.
                      opacity: Math.max(0, 1 - q * 2.2),
                      pointerEvents: q > 0.05 ? 'none' : undefined,
                    }
                  : {
                      // Anchored by its TOP, at the same height on every scene
                      // section (hanging the copy off each device once put
                      // Metaherb's column 108px above Pawmely's, measured).
                      // Top-anchored, not centred: a centred block re-centres
                      // itself every time its height changes, so expanding the
                      // description made the whole column — heading, buttons,
                      // everything — jump to a new position. Held by the top,
                      // the description simply grows downward under it.
                      // 0.3, matching where the centred block's top row sat
                      // collapsed, so nothing moved in the default state.
                      top: vh * 0.3,
                      left: `${dev.copy.left[0] + (dev.copy.left[1] - dev.copy.left[0]) * q}%`,
                      right: `${dev.copy.right[0] + (dev.copy.right[1] - dev.copy.right[0]) * q}%`,
                      // Perspective tilt so the block reads as a plane sitting
                      // BEHIND the device rather than a flat label. Kept to 8
                      // degrees with a long perspective on purpose — enough to
                      // place it in depth, gentle enough that body copy (Thai
                      // especially, with stacked marks) stays crisp.
                      transformOrigin: 'right center',
                      // No -50% here any more — the block is top-anchored.
                      transform: `perspective(1600px) translateY(${q * -26}px) rotateY(${-8 * q}deg) scale(${1 - 0.2 * q})`,
                      // Parked, the column sits BEHIND the device canvas (z-12
                      // vs 20) so the mockup fronts the copy plane. Focused,
                      // the whole rig (z-21) carries a full-viewport
                      // click-anywhere-to-close catcher — which also caught
                      // every press on these buttons. The column steps in front
                      // of the rig for exactly as long as the prototype is
                      // open; the device is centred then, so nothing overlaps.
                      zIndex: q > 0.05 ? 22 : undefined,
                    }
              }
            >
              {/* The header's blur, pointed the other way. A flat backdrop-filter
                  panel has a hard edge where it ends; this ramps, so the scene
                  fades out under the words instead of being cut off by them. */}
              {bioOpen && isNarrow && (
                <GradualBlur
                  target="parent"
                  position="bottom"
                  height="100%"
                  strength={2}
                  divCount={5}
                  curve="bezier"
                  exponential
                  opacity={1}
                  zIndex={0}
                />
              )}
              {/* No name here: the project's name is the page's masthead now,
                  set large in the top-left corner (see NavMenu's list mode). */}
              {/* The action row — avatar, like, share — opens the column, the
                  way a feed post leads with who it is from. Desktop only. */}
              {!isNarrow && index !== 0 && !bare && (
                <div className="pointer-events-auto relative z-10 mb-6 flex">
                  <SideActions
                    horizontal
                    projectId={projectId}
                    projectIndex={projectIndex}
                    avatar={avatar}
                    initial={initial}
                  />
                </div>
              )}
              {info.tagline && (
                <p className="relative z-10 text-base font-semibold leading-snug text-[#21221f] md:text-xl lg:text-2xl">
                  {info.tagline}
                </p>
              )}
              {info.bio && (
                // The wrapper is pointer-events-none so the scene stays
                // draggable through it — the toggle re-enables clicks itself.
                <ClampText
                  text={info.bio}
                  lines={isNarrow ? 3 : 4}
                  className="relative z-10 mt-2 text-[13px] leading-relaxed text-[#4e4e4e] md:mt-5 md:text-base lg:text-lg"
                  onToggle={setBioOpen}
                />
              )}
              {/* The play button closes the column, back at the bottom where it
                  was — the one thing the description shifts when it expands.
                  Only when there is a prototype to play: MyAtlas stages its
                  device while its link is still on its way, and a play button
                  with nothing behind it is a broken promise. */}
              {!isNarrow && info.prototypeUrl && protoToggle}
            </div>
          )}


          {/* Narrow screens used to need a separate floating close button,
              because the copy — and the toggle inside it — faded away while the
              prototype was focused. The toggle now lives under the device and
              stays put through the whole zoom, so it is the way out too. */}
          {false && isNarrow && q > 0.05 && (
            <button
              onClick={() => {
                setProtoOpen(false)
                animateTo(0, 850)
              }}
              aria-label="close"
              className="safe-top absolute right-4 top-4 z-30 grid size-10 place-items-center rounded-full bg-[#e5484d]/85 text-white backdrop-blur-sm transition active:scale-90"
              style={{ opacity: Math.min(1, q / 0.3) }}
            >
              <Plus className="size-5" style={{ transform: 'rotate(45deg)' }} />
            </button>
          )}

          {/* Action buttons — inside the sticky viewport so they stay visible. */}
          <div
            // On a phone the rail is lifted to the same baseline as the caption
            // and pulled in from the edge, so the two read as one bottom band
            // rather than three buttons jammed into the corner. Desktop keeps
            // its own spacing.
            // NOT inside the centred page-shell: the shell has a max width, so
            // past 1440 it carried the rail inward with it — 196px off the edge
            // at 1920, 516px at 2560, while the back button opposite stayed at
            // 36. The rail is pinned to the section, which is the full viewport.
            className="safe-bottom pointer-events-none absolute inset-x-0 bottom-10 z-20 md:bottom-10"
            style={{
              // Hidden on a phone while the prototype has the screen — see the
              // caption above. Desktop has room for both.
              opacity: (1 - s) * (isNarrow ? Math.max(0, 1 - q * 2.2) : 1),
              pointerEvents: isNarrow && q > 0.05 ? 'none' : undefined,
            }}
          >
            {/* Held the same 36px off the right edge that the back button keeps
                off the left, so the two rails frame the screen evenly. */}
            <div className="pointer-events-auto absolute bottom-0 right-6 flex flex-col items-center gap-4 md:right-9 md:gap-3">
              {/* The intro screen carries no action rail: there is no project behind it
                  to open, like or share — the buttons stood there doing nothing.
                  Desktop-only note: the rail moved INTO the copy column (see the
                  action row above), so the corner keeps it only on a phone. */}
              {isNarrow && index !== 0 && !bare && (
                <SideActions projectId={projectId} projectIndex={projectIndex} avatar={avatar} initial={initial} />
              )}
            </div>
          </div>

          {/* The toggle on a phone: under the device, positioned against the
              section rather than the viewport. `fixed` put it outside the
              section entirely, so it hung over every other page of the feed as
              you scrolled past. Only when there is a prototype to play. */}
          {isNarrow && info?.prototypeUrl && (
            <div
              // The expanded description's blur band reaches up over this spot.
              // Dropping BELOW the caption layer (z-[12]) puts the toggle behind
              // that band, so it recedes under the blur instead of vanishing —
              // it is still there, just clearly not the thing you are meant to
              // touch while reading. Not clickable through the blur either.
              ref={toggleBoxRef}
              className={`absolute -translate-x-1/2 ${bioOpen ? 'z-[11]' : 'z-30'}`}
              style={{
                // `cy`, the LIVE screen centre — focusing both grows the device
                // and moves it to the middle of the viewport, so measuring from
                // where it was parked put this on top of the screen it is meant
                // to sit under.
                top: toggleTop,
                left: '50%',
                pointerEvents: bioOpen ? 'none' : 'auto',
                // The band's backdrop ramp is at its WEAKEST here — this sits in
                // the top few percent of it — so the pill has to blur itself to
                // recede at all. Faded as well: a white pill at full strength
                // still fights the tagline for the same line.
                filter: bioOpen ? 'blur(4px)' : 'none',
                opacity: bioOpen ? 0.4 : 1,
                transition: 'opacity 0.25s ease, filter 0.25s ease',
              }}
            >
              {protoToggle}
            </div>
          )}

          {/* Transition wash. The section used to fade via `opacity` on THIS
              wrapper — but that put the live cross-origin prototype iframe under a
              sub-1 opacity, and blending an out-of-process iframe every frame of
              the scroll froze the whole page on the way into Pawmely. Instead the
              iframe stays fully opaque and a solid layer in the section's OWN
              background colour washes over the scene as it enters/leaves — same
              look, but only a cheap solid div is composited.
              The colour tracks the section, which is #fafafa again now that the
              scene no longer runs on black. */}
          <div
            className="pointer-events-none absolute inset-0 z-30 bg-[#fafafa]"
            style={{ opacity: 1 - transitionFade }}
          />
        </div>
      ) : (
        <>
          {/* The intro section wears an ID card on a lanyard instead of an
              illustration — the page is an introduction, and a pass you can
              grab and swing says that faster than a picture does. Paused while
              parked: it runs a physics solver and a WebGL canvas, and Pawmely
              one section away runs a canvas and an iframe of its own. */}
          {lanyard ? (
            <>
              {/* Phone: the scene is inset from the top so the strap starts under
                  the name rather than through it — the name block ends at y63 and
                  the strap hung from y0 down the middle of the screen, straight
                  across "Teeropast". Desktop keeps the full frame. */}
              <div
                ref={lanyardRef}
                className="absolute inset-x-0 bottom-0 top-[104px] md:top-0"
                style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
              >
                <Lanyard
                  position={[0, 0, 18]}
                  gravity={[0, -40, 0]}
                  // Also stopped while the contact page is up: that page hangs
                  // the same pass in front of this one, and two physics worlds
                  // stepping at once is pure cost for a card nobody can see.
                  paused={Math.abs(offset) > 0.5}
                  // The whole face is drawn as one badge — photo, name, role and
                  // the two fields under a rule — so it is passed as a single
                  // image and covers the card's face edge to edge.
                  reboundKey={heroRebound}
                  frontImage={badge?.front?.url}
                  // The contact block lives on the back now, so that is the face
                  // that carries hit regions. Fractions of the face; the card turns
                  // them into regions on the mesh.
                  backImage={badge?.back?.url}
                  backLinks={badge?.back?.links}
                  // Turning the pass over IS the request for contact — but it is
                  // answered HERE now, not by a page. The card is already showing
                  // its contact face; taking the screen away to say the same thing
                  // again made the flip a doorway rather than the thing itself. The
                  // channels simply fall out of the card. Turning it back picks
                  // them up again.
                  onFlip={flipped => {
                    setPillsDown(flipped)
                    if (flipped) setPillsMounted(true)
                  }}
                  // With `onFlip` given, the card does NOT turn itself (see
                  // Lanyard) — it reports and waits. It used to wait for a page to
                  // take the turn over; now the turn happens right here, so the
                  // state it reported is handed straight back to it.
                  flipTo={pillsDown}
                  // No haul on this one: what it opens is on this same screen.
                  tug={false}
                  // The one place the pass introduces itself: a single part-turn
                  // soon after arriving, so the back is seen to exist at all.
                  tease
                  imageFit="cover"
                />
              </div>

              {/* The channels, dropped into the bottom of this same screen. They
                  sit above the card's canvas so they can be shoved around, and
                  they are unmounted the moment the pass is turned back over. */}
              {pillsMounted && (
                <div className="pointer-events-none absolute inset-0 z-[45]">
                  <ContactPills delay={120} leaving={!pillsDown} />
                </div>
              )}
            </>
          ) : !image ? null : (
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
          )}

          {/* The same bottom caption band the scene section has, for every other
              page. Phones only: on desktop these sections are a single image and
              their words live in the nav. Identical geometry to the scene one —
              a feed whose caption moves between pages reads as two designs. */}
          {/* Not on the intro screen. Its words are the greeting drawn INSIDE
              the section — printing the same role and tagline again in the
              bottom band gave the phone a caption the desktop does not have. */}
          {isNarrow && index !== 0 && (caption?.tagline || footer) && (
            <div
              className={`absolute z-[12] flex flex-col ${
                bioOpen ? 'pb-10 pl-4 pr-[84px] pt-6' : ''
              }`}
              style={{
                bottom: bioOpen ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 40px)',
                left: bioOpen ? 0 : 20,
                right: bioOpen ? 0 : 84,
              }}
            >
              {bioOpen && (
                <GradualBlur
                  target="parent"
                  position="bottom"
                  height="100%"
                  strength={2}
                  divCount={5}
                  curve="bezier"
                  exponential
                  opacity={1}
                  zIndex={0}
                />
              )}
              {caption?.tagline && (
                <p className="relative z-10 text-base font-semibold leading-snug text-[#21221f]">
                  {caption.tagline}
                </p>
              )}
              {caption?.bio && (
                <ClampText
                  text={caption.bio}
                  lines={3}
                  onToggle={setBioOpen}
                  className="relative z-10 mt-2 text-[13px] leading-relaxed text-[#4e4e4e]"
                  buttonClassName="pointer-events-auto"
                />
              )}
              {footer && <div className="pointer-events-auto relative z-10">{footer}</div>}
            </div>
          )}

          {/* Action buttons — bottom-right corner (fade along with the bottom).
              Same offsets as the scene section's rail: every page of the feed
              has to put its controls in the same place, or scrolling between
              them shifts the furniture.
              That means the same CONTAINER too, not just the same offsets — and
              that container is the SECTION, not `page-shell`. Hung off the shell
              (centred, max-width 1600px) the rail was carried inward on anything
              wider: 196px off the right edge at 1920 and 516px at 2560, against a
              back button holding 36 on the left. Below 1440 the shell is full
              width, which is why it read correctly there and nowhere else. */}
          <div
            className="safe-bottom pointer-events-none absolute inset-x-0 bottom-10 z-20 md:bottom-10"
            style={{ opacity: 1 - s }}
          >
          <div className="pointer-events-auto absolute bottom-0 right-6 md:right-9">
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
            {/* The intro screen carries no action rail: there is no project behind it
                  to open, like or share — the buttons stood there doing nothing.
                  Phones only, same as the scene section: on desktop the actions
                  live in the copy column now, and these image sections have no
                  copy column to host them — a lone corner rail here would be the
                  only page still wearing the old furniture. */}
              {isNarrow && index !== 0 && !bare && (
                <SideActions projectId={projectId} projectIndex={projectIndex} avatar={avatar} initial={initial} />
              )}
          </div>
          </div>
        </>
      )}

      {/* Portalled to the body, not rendered in place: the lanyard's canvas carries
          a `filter` for its cast shadow, and a filter makes an element the
          containing block for every `fixed` descendant — inside the section, a
          full-screen page would have been trapped inside a 3D scene. */}
      {contactOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <ContactBubbles
            badge={badge}
            origin={contactOrigin}
            onClose={() => {
              // The way back needs its own transition. Closing alone just took the
              // page away and the home screen was suddenly THERE — the feed
              // underneath has to be the layer that arrives, growing from the same
              // point on the strap the contact page grew from.
              // Exactly the mirror of the way in: the arriving layer starts
              // growing NOW, over a contact page that stays put while its own card
              // is pulled. It is only taken away once the feed has covered the
              // screen.
              setHeroRebound(n => n + 1)
              requestReveal('feed', contactOrigin ?? strapOrigin(lanyardRef.current))
              window.setTimeout(() => setContactOpen(false), REVEAL_MS)
            }}
          />,
          document.body
        )}
    </section>
  )
}
