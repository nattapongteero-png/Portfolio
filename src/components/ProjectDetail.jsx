// -----------------------------------------------------------------------------
// ProjectDetail.jsx
// Full-screen project profile, opened from the feed avatar. Layout follows the
// approved wireframe:
//   • big left-aligned project title
//   • square-rounded logo on the left + bio text on the right
//   • link buttons row
//   • a 2-column bento grid of cream cards — one card per content section
//     (Overview / Research / UI / Dev), each rendering its typed blocks.
// -----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Globe, Image as ImageIcon, Layers, Smartphone } from 'lucide-react'
import { usePortfolio } from '../context/PortfolioContext'
import FeedSheet from './FeedSheet'

// Cover-card palette. Each section gets a bold cover colour + a set of vivid
// pill colours, cycled by index — playful, but still mint-adjacent for MyAtlas.
const CARD_H = 'h-[480px]'
const CARD_SHAPE = 'rounded-[28px]'
const CARD_BG = ['#c9d14e', '#1d8b6b', '#e08a3c', '#5b6ee0']

// Profile badges: what the product IS (platform) and the domain it serves.
// Each domain carries a tint plus a solid dot in the same family — the dot is
// what stops it reading as an untouched grey placeholder.
const CATEGORY_TONE = {
  Health: { bg: '#e4f3ed', fg: '#125f49', dot: '#1d8b6b', ring: '#bfe3d6' },
  Commerce: { bg: '#fbeee0', fg: '#8f4d15', dot: '#e08a3c', ring: '#f0d5b6' },
  Pets: { bg: '#ece9fd', fg: '#4034b4', dot: '#5b4fe0', ring: '#cfc8fa' },
  Finance: { bg: '#e6eefb', fg: '#1b467f', dot: '#2f6fd0', ring: '#c3d6f3' },
  Entertainment: { bg: '#fce8f3', fg: '#932663', dot: '#e070c0', ring: '#f5c9e2' },
}
const DEFAULT_TONE = { bg: '#eae7df', fg: '#3f3f3b', dot: '#8a857a', ring: '#dedad2' }

// Platform icon inferred from the kind label, so adding a project needs no map.
function platformIcon(kind = '') {
  if (/mobile|app store|ios|android/i.test(kind)) return Smartphone
  if (/web|saas|dashboard|site/i.test(kind)) return Globe
  return Layers
}

// The platform badge is a white chip with a hairline ring — it reads as a
// physical tag. The category badge is tinted and led by its dot.
function Badge({ icon: Icon, label, tone }) {
  const tinted = Boolean(tone)
  return (
    <span
      className="inline-flex h-8 items-center gap-2 rounded-full pl-3 pr-4 text-xs font-semibold leading-none tracking-tight shadow-sm ring-1 md:h-9 md:text-[13px]"
      style={{
        backgroundColor: tinted ? tone.bg : '#ffffff',
        color: tinted ? tone.fg : '#2f2f2c',
        '--tw-ring-color': tinted ? tone.ring : '#dedad2',
      }}
    >
      {tinted ? (
        <span className="size-2 rounded-full" style={{ backgroundColor: tone.dot }} />
      ) : (
        Icon && <Icon className="size-4" strokeWidth={2.3} />
      )}
      {label}
    </span>
  )
}
const PILL_BG = ['#d1502a', '#e070c0', '#5b4fe0', '#2f3fc4', '#1d8b6b', '#e08a3c']

// The draggable topic pills a tab shows on its cover: its block headings, plus
// any explicit tag items. Capped so the pile stays readable.
function pillsForTab(tab) {
  const headings = tab.blocks.filter((b) => b.type === 'heading').map((b) => b.text)
  const tagItems = tab.blocks.filter((b) => b.type === 'tags').flatMap((b) => b.items)
  return [...new Set([...headings, ...tagItems])].slice(0, 5)
}

// A pile of pills that behave like objects in a jar: gravity pulls them to the
// floor, walls/floor bounce, and no two pills may overlap. Drag one up and it
// falls back down; shove it into a neighbour and the neighbour gets pushed.
// A tiny fixed-step AABB solver, one instance per card, transforms written
// straight to the DOM so the sim never re-renders React. Sleeps when everything
// settles; a pointer-down wakes it.
const TOP_INSET = 104 // px kept clear at the top so pills never cover the title
const G_SWING = 2600 // gravity used for the pendulum torque while a pill is held

function PillJar({ pills, dragging }) {
  const boxRef = useRef(null)
  const pillRefs = useRef([])
  const bodies = useRef([])
  const drag = useRef(null)
  const raf = useRef(0)
  const running = useRef(false)

  const wake = () => {
    if (running.current) return
    running.current = true
    raf.current = requestAnimationFrame(step)
  }

  // Bodies are centre-based with an orientation `a` (radians). hx/hy give the
  // half-extents of the ROTATED box, so walls and collisions stay honest as a
  // pill tilts.
  const hx = (b) => (Math.abs(Math.cos(b.a)) * b.w + Math.abs(Math.sin(b.a)) * b.h) / 2
  const hy = (b) => (Math.abs(Math.sin(b.a)) * b.w + Math.abs(Math.cos(b.a)) * b.h) / 2

  // Oriented-box overlap (SAT). Returns the minimum push to move body `a` out of
  // `c`, or null if they don't touch. Using the true rotated rectangle — not its
  // axis-aligned bounding box — lets tilted pills pack tightly instead of being
  // shoved apart by their inflated bounding boxes.
  const obbMTV = (a, c) => {
    const ca = Math.cos(a.a), sa = Math.sin(a.a)
    const cc = Math.cos(c.a), sc = Math.sin(c.a)
    const axes = [[ca, sa], [-sa, ca], [cc, sc], [-sc, cc]]
    let min = Infinity
    let nx = 0
    let ny = 0
    for (const [ax, ay] of axes) {
      const ra = Math.abs((a.w / 2) * (ca * ax + sa * ay)) + Math.abs((a.h / 2) * (-sa * ax + ca * ay))
      const rc = Math.abs((c.w / 2) * (cc * ax + sc * ay)) + Math.abs((c.h / 2) * (-sc * ax + cc * ay))
      const d = (c.x - a.x) * ax + (c.y - a.y) * ay
      const overlap = ra + rc - Math.abs(d)
      if (overlap <= 0) return null
      if (overlap < min) {
        min = overlap
        const s = d < 0 ? 1 : -1 // push a AWAY from c
        nx = ax * s
        ny = ay * s
      }
    }
    return { x: nx * min, y: ny * min }
  }

  // Height of the nearest surface under a point at world-x `px` for body `self`:
  // the top of any pill sitting below it, else the floor. Used to decide which
  // way a resting pill should lean.
  const groundUnder = (px, self, H) => {
    const B = bodies.current
    const me = B[self]
    let g = H
    for (let k = 0; k < B.length; k++) {
      if (k === self) continue
      const o = B[k]
      if (Math.abs(px - o.x) < hx(o) + 2) {
        const top = o.y - hy(o)
        if (top >= me.y && top < g) g = top // a surface at/below my centre
      }
    }
    return g
  }

  const step = () => {
    const box = boxRef.current
    if (!box) return
    const W = box.clientWidth
    const H = box.clientHeight
    const G = 2600
    const REST = 0.3
    const FRICT = 0.82
    const dt = 1 / 60
    const B = bodies.current

    for (let i = 0; i < B.length; i++) {
      const b = B[i]
      if (drag.current?.i === i) continue
      b.vy += G * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.a += b.va * dt
      b.va *= 0.9
      // Orientation settling. A fast-moving (flung) pill keeps its spin. A slow
      // one leans onto whatever is actually under its two ends: if one end sits
      // on another pill and the other hangs over a gap, gravity tips it into the
      // gap — so the pile leans naturally instead of forming a tidy flat row.
      const speed = Math.abs(b.vx) + Math.abs(b.vy)
      if (speed < 70) {
        const gl = groundUnder(b.x - b.w / 2, i, H)
        const gr = groundUnder(b.x + b.w / 2, i, H)
        let want = Math.atan2(gr - gl, b.w)
        if (want > 0.6) want = 0.6
        else if (want < -0.6) want = -0.6
        b.a += (want - b.a) * 0.16
      } else {
        b.a += (0 - b.a) * 0.03
      }
      const HX = hx(b)
      const HY = hy(b)
      if (b.x - HX < 0) { b.x = HX; b.vx = -b.vx * REST }
      if (b.x + HX > W) { b.x = W - HX; b.vx = -b.vx * REST }
      if (b.y - HY < TOP_INSET) { b.y = TOP_INSET + HY; b.vy = -b.vy * REST }
      if (b.y + HY > H) { b.y = H - HY; b.vy = -b.vy * REST; b.vx *= FRICT }
    }

    // Separate every overlapping pair by its true oriented-box push so pills
    // rest in contact. A dragged body is immovable and shoves the other fully.
    for (let iter = 0; iter < 6; iter++) {
      for (let i = 0; i < B.length; i++) {
        for (let j = i + 1; j < B.length; j++) {
          const a = B[i]
          const c = B[j]
          const m = obbMTV(a, c) // move `a` by m to separate from c
          if (!m) continue
          const aD = drag.current?.i === i
          const cD = drag.current?.i === j
          if (aD) { c.x -= m.x; c.y -= m.y }
          else if (cD) { a.x += m.x; a.y += m.y }
          else { a.x += m.x / 2; a.y += m.y / 2; c.x -= m.x / 2; c.y -= m.y / 2 }
          if (!aD) { a.vx *= 0.6; a.vy *= 0.6 }
          if (!cD) { c.vx *= 0.6; c.vy *= 0.6 }
        }
      }
    }

    let maxV = 0
    for (let i = 0; i < B.length; i++) {
      const b = B[i]
      const el = pillRefs.current[i]
      if (el) el.style.transform = `translate(${b.x - b.w / 2}px, ${b.y - b.h / 2}px) rotate(${b.a}rad)`
      if (drag.current?.i !== i) maxV = Math.max(maxV, Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.va) * 40)
    }

    // Sleep once everything is calm, resting, and roughly upright.
    const restingOnFloor = B.every((b) => b.y + hy(b) >= H - 1.5 && Math.abs(b.a) < 0.05)
    if (!drag.current && maxV < 6 && restingOnFloor) {
      running.current = false
      return
    }
    raf.current = requestAnimationFrame(step)
  }

  // (Re)measure pill sizes and seed positions when the pill set or size changes.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const setup = () => {
      const W = box.clientWidth
      const H = box.clientHeight
      bodies.current = pills.map((_, i) => {
        const el = pillRefs.current[i]
        const w = el?.offsetWidth || 90
        const h = el?.offsetHeight || 36
        const prev = bodies.current[i]
        if (prev) return { ...prev, w, h }
        return {
          x: Math.min(Math.max(w / 2, 20 + (i % 2) * (W / 2)), Math.max(w / 2, W - w / 2)),
          y: TOP_INSET + 30 + i * (h + 4), // centre coords
          a: 0,
          vx: (Math.random() - 0.5) * 40,
          vy: 0,
          va: 0,
          w,
          h,
        }
      })
      wake()
    }
    setup()
    const ro = new ResizeObserver(setup)
    ro.observe(box)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf.current)
      running.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pills])

  // Grab: remember WHERE on the pill you grabbed, in the pill's own unrotated
  // frame (lax, lay). The pill then hangs from that anchor and swings under
  // gravity — grab an end and it dangles, grab the middle and it stays level.
  const onDown = (i) => (e) => {
    e.stopPropagation() // don't open the card
    const r = boxRef.current.getBoundingClientRect()
    const b = bodies.current[i]
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const dx = px - b.x
    const dy = py - b.y
    const ca = Math.cos(-b.a)
    const sa = Math.sin(-b.a)
    drag.current = { i, lax: dx * ca - dy * sa, lay: dx * sa + dy * ca, ppx: px, ppy: py, t: performance.now() }
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    wake()
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const r = boxRef.current.getBoundingClientRect()
    const b = bodies.current[d.i]
    const px = Math.max(0, Math.min(r.width, e.clientX - r.left))
    const py = Math.max(0, Math.min(r.height, e.clientY - r.top))
    const now = performance.now()
    const dtm = Math.max(1, now - d.t) / 1000
    const L = Math.hypot(d.lax, d.lay)
    // Pendulum in substeps for stability: torque from gravity rotates the pill
    // until the centre of mass hangs straight below the grabbed anchor.
    const sub = 4
    const sdt = Math.min(dtm, 0.05) / sub
    for (let s = 0; s < sub; s++) {
      if (L > 6) {
        const ca = Math.cos(b.a)
        const sa = Math.sin(b.a)
        const rx = d.lax * ca - d.lay * sa // centre→anchor, world
        const ry = d.lax * sa + d.lay * ca
        // anchor→centre = -(rx,ry); deviation from straight-down:
        const theta = Math.atan2(rx, -ry)
        b.va += -(G_SWING / Math.max(L, 26)) * Math.sin(theta) * sdt
        b.va *= 0.9
        b.a += b.va * sdt
      }
      const ca2 = Math.cos(b.a)
      const sa2 = Math.sin(b.a)
      b.x = px - (d.lax * ca2 - d.lay * sa2)
      b.y = py - (d.lax * sa2 + d.lay * ca2)
    }
    if (b.y < TOP_INSET) b.y = TOP_INSET
    b.vx = (px - d.ppx) / dtm
    b.vy = (py - d.ppy) / dtm
    d.ppx = px
    d.ppy = py
    d.t = now
  }
  const onUp = () => {
    if (drag.current) drag.current = null
    dragging.current = false
    wake()
  }

  return (
    <div ref={boxRef} className="absolute inset-0" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {pills.map((label, i) => (
        <span
          key={label}
          ref={(el) => (pillRefs.current[i] = el)}
          onPointerDown={onDown(i)}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-0 cursor-grab touch-none select-none whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-white shadow-md active:cursor-grabbing md:text-base"
          style={{ backgroundColor: PILL_BG[i % PILL_BG.length], willChange: 'transform' }}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

// Bespoke Lo-Fi Wireframe cover: cream card, the title split across two colour
// pills, and a lo-fi phone mock (placeholder blocks) bleeding off the bottom.
function LofiCover({ tab, onOpen }) {
  const CREAM = '#f7f8e3'
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative block ${CARD_H} w-full cursor-pointer overflow-hidden ${CARD_SHAPE} bg-[#f5f6dc] transition active:scale-[0.99]`}
      aria-label={tab.label}
    >
      {/* Title pills (font matches the other cards: text-3xl / md:text-4xl).
          Green bleeds off the LEFT edge but its TEXT sits 40px in from the left;
          it stretches full width with a 40px gap before the blue pill (which
          bleeds right). Pink bleeds off the RIGHT edge with its TEXT 40px in from
          the right. Overflow = pill padding beyond the 40px text inset. */}
      <div className="absolute left-0 right-0 top-7 z-10">
        <div className="flex items-center">
          <span
            className="flex-1 whitespace-nowrap rounded-full bg-[#c9d14e] py-3 pr-9 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
            style={{ color: CREAM, textShadow: '0 3px 4px rgba(0,0,0,0.16)', marginLeft: '-32px', paddingLeft: '56px' }}
          >
            Lo-Fi
          </span>
          <span
            className="h-14 w-28 shrink-0 rounded-full bg-[#2f3fc4]"
            style={{ marginLeft: '24px', marginRight: '-48px' }}
          />
        </div>
        {/* Pink: left edge 24px in, 24px below the green pill; a wide bar that
            bleeds off the RIGHT with its text 24px in from the card's right. */}
        <div className="-mr-8 mt-6 pl-6">
          <span
            className="block w-full whitespace-nowrap rounded-full bg-[#e070c0] py-3 pl-9 text-right text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
            style={{ color: CREAM, textShadow: '0 3px 4px rgba(0,0,0,0.16)', paddingRight: '56px' }}
          >
            Wireframe
          </span>
        </div>
      </div>

      {/* Lo-fi phone mock: smaller now, LEFT-aligned (side buttons, rounded
          top-left corner and notch visible), sitting lower for more breathing
          room below the pink pill, and bleeding off the RIGHT edge + BOTTOM. */}
      <div
        className="absolute left-[24%] top-[196px] h-[372px] w-[88%] overflow-hidden rounded-[44px] border-[9px] border-black p-4"
        style={{ backgroundColor: CREAM }}
      >
        {/* Side buttons on the left rail */}
        <div className="absolute -left-[8px] top-14 h-8 w-[8px] rounded-l-md bg-black" />
        <div className="absolute -left-[8px] top-28 h-14 w-[8px] rounded-l-md bg-black" />
        <div className="absolute -left-[8px] top-48 h-14 w-[8px] rounded-l-md bg-black" />

        {/* Dynamic Island with camera dot */}
        <div className="mx-auto mb-7 flex h-9 w-32 items-center justify-end rounded-full bg-black pr-3">
          <div className="size-4 rounded-full bg-neutral-700" />
        </div>

        {/* The rows bleed off BOTH screen edges (negative margins wider than the
            screen); the phone's overflow-hidden clips them, so the end capsules
            are cut at the left/right screen edge exactly like the reference. */}
        {/* Row 1: peach capsule · blue image circle · lavender capsule */}
        <div className="-ml-16 -mr-10 flex items-center gap-4">
          <div className="h-[76px] flex-1 rounded-full bg-[#f3c9b0]" />
          <div className="grid size-[76px] shrink-0 place-items-center rounded-full bg-[#bfe0fb]">
            <ImageIcon className="size-10 text-white" strokeWidth={2} />
          </div>
          <div className="h-[76px] flex-1 rounded-full bg-[#c6cbf6]" />
        </div>
        {/* Row 2: wide "Lorem Ipsum" capsule (text bleeds left) · yellow capsule */}
        <div className="-ml-16 -mr-10 mt-4 flex items-center gap-4">
          <div className="grid h-[76px] flex-[2] place-items-center rounded-full bg-[#f6d29e]">
            <span className="text-2xl font-extrabold" style={{ color: CREAM }}>Lorem Ipsum</span>
          </div>
          <div className="h-[76px] flex-1 rounded-full bg-[#f2e9a0]" />
        </div>
        {/* Row 3: lavender circle · peach capsule (clipped by the card bottom) */}
        <div className="-mx-10 mt-4 flex items-center gap-4">
          <div className="size-[76px] shrink-0 rounded-full bg-[#d9c9f5]" />
          <div className="h-[76px] flex-1 rounded-full bg-[#f3c9b0]" />
        </div>
      </div>
    </div>
  )
}

// Bespoke Project Overview cover: bold purple card, big two-line title anchored
// bottom-left (with "view" picked out in lime), and a cluster of rounded shapes
// on the right — a centre stack (magenta capsule, orange capsule, blue circle)
// plus two circles that bleed off the right edge (lime + pink).
function OverviewCover({ tab, onOpen }) {
  const LAV = '#cbc9f2' // light-lavender title
  const LIME = '#c9d14e'
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative block ${CARD_H} w-full cursor-pointer overflow-hidden ${CARD_SHAPE} bg-[#5b4fe0] transition active:scale-[0.99]`}
      aria-label={tab.label}
    >
      {/* Right-edge circles: their CENTRE sits exactly on the card's right edge
          (half bleeds off), lime near the top, pink below it. */}
      <div className="absolute right-[-47px] top-[24px] size-[96px] rounded-full" style={{ backgroundColor: LIME }} />
      <div className="absolute right-[-44px] top-[156px] size-[88px] rounded-full" style={{ backgroundColor: '#e070c0' }} />
      {/* Centre stack: magenta capsule (bleeds off top) · orange capsule · blue
          circle — all sharing one vertical centre line, kept 24px clear of the
          edge circles (lime's inner edge is 47px in, +24px gap = 71px). */}
      <div className="absolute right-[72px] top-[-34px] h-[116px] w-[76px] rounded-full" style={{ backgroundColor: '#e070c0' }} />
      <div className="absolute right-[72px] top-[88px] h-[152px] w-[76px] rounded-full" style={{ backgroundColor: '#d1502a' }} />
      <div className="absolute right-[64px] top-[248px] size-[88px] rounded-full" style={{ backgroundColor: '#2f3fc4' }} />

      {/* Two-line title, bottom-left */}
      <h3
        className="pointer-events-none absolute bottom-9 left-7 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl"
        style={{ color: LAV }}
      >
        Project
        <br />
        Over<span style={{ color: LIME }}>view</span>
      </h3>
    </div>
  )
}

// One cover card: big title, a jar of physics pills, and a click on the card
// body (not a pill) opens the section sheet.
function CoverCard({ tab, index, onOpen }) {
  if (tab.cover === 'lofi') return <LofiCover tab={tab} onOpen={onOpen} />
  if (tab.cover === 'overview') return <OverviewCover tab={tab} onOpen={onOpen} />
  const pills = pillsForTab(tab)
  const dragging = useRef(false)
  return (
    <div
      role="button"
      tabIndex={0}
      // Suppress the open when the click is the tail of a pill drag.
      onClick={() => !dragging.current && onOpen()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative block ${CARD_H} w-full cursor-pointer overflow-hidden ${CARD_SHAPE} p-6 text-left transition active:scale-[0.99] md:p-7`}
      // Stable colour: use the tab's own colour if set, so adding/reordering
      // bespoke cards never shifts a plain card's palette index.
      style={{ backgroundColor: tab.cardColor ?? CARD_BG[index % CARD_BG.length] }}
    >
      <h3
        className="pointer-events-none relative z-10 max-w-[80%] text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl"
        // nudged down 10px so it sits on the same line as the Lo-Fi card's title,
        // whose text is lowered by its pill padding.
        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.12)', marginTop: '10px' }}
      >
        {tab.label}
      </h3>
      <PillJar pills={pills} dragging={dragging} />
    </div>
  )
}

// The Grid & Layout card wears the same treatment as its panel: the four-column
// glyph in the bottom-right corner, with the inspector measuring THAT rather
// than the title — so the card and the page it opens read as one idea. Both
// numbers are read back off the live layout, not drawn.
function CornerArt({ cardRef, children, dark }) {
  const barsRef = useRef(null)
  const [box, setBox] = useState(null)
  useLayoutEffect(() => {
    const measure = () => {
      const c = cardRef.current
      const bars = barsRef.current
      if (!c || !bars) return
      const cb = c.getBoundingClientRect()
      const a = bars.getBoundingClientRect()
      const next = { x: a.left - cb.left, y: a.top - cb.top, w: a.width }
      setBox((cur) =>
        cur && Object.keys(next).every((k) => Math.abs(cur[k] - next[k]) < 0.5) ? cur : next
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (cardRef.current) ro.observe(cardRef.current)
    if (barsRef.current) ro.observe(barsRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // On the lime card a lime chip would vanish, so the accent flips to ink.
  const accent = dark ? '#2b3208' : '#c9d14e'
  const chip =
    'absolute inline-flex h-4 items-center rounded-[3px] px-2 font-mono text-[9px] font-medium leading-4'
  return (
    <>
      <div ref={barsRef} className="pointer-events-none absolute -bottom-[10%] -right-[7%] h-[52%] w-[46%]">
        {children}
      </div>
      {box && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {/* Down from the card's top edge, at the glyph's centre. */}
          <span
            className="absolute border-l border-dashed"
            style={{ left: box.x + box.w / 2, top: 0, height: box.y, borderColor: accent }}
          >
            <span
              className={chip}
              style={{ left: 8, top: box.y / 2 - 8, backgroundColor: accent, color: dark ? '#f2f4d8' : '#2b3208' }}
            >
              {Math.round(box.y)}
            </span>
          </span>
          {/* In from the card's left edge to the glyph. */}
          <span
            className="absolute border-t border-dashed"
            style={{ left: 0, top: box.y + 40, width: box.x, borderColor: accent }}
          >
            <span
              className={chip}
              style={{ left: box.x / 2 - 12, top: 8, backgroundColor: accent, color: dark ? '#f2f4d8' : '#2b3208' }}
            >
              {Math.round(box.x)}
            </span>
          </span>
        </div>
      )}
    </>
  )
}

// The right-hand column of the profile header: three facts that the bio cannot
// carry — who built it, how many people run it, and what this portfolio's owner
// actually did. Kept to one card so it reads as a single sidebar rather than
// three loose widgets.
function Initials({ name, you }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold leading-none ring-2 ring-white ${
        you ? 'bg-[#1d8b6b] text-white' : 'bg-[#e8e5df] text-[#4e4e4e]'
      }`}
      title={name}
    >
      {initials}
    </span>
  )
}

function ProfileFacts({ project, height }) {
  const { team, downloads } = project
  if (!team && !downloads) return null
  const CARD =
    'flex h-full min-w-0 flex-1 flex-col justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#dedad2]'
  return (
    // Two portrait cards side by side in one row: same height, same rounded
    // frame, each holding one fact — the label on top, the figure at the bottom.
    <div
      className="flex h-[152px] w-full shrink-0 gap-4 lg:w-[320px]"
      // 152 was a guess that sat 4px past the bio; the measured height makes the
      // two columns end on exactly the same line at any width.
      style={typeof window !== 'undefined' && window.innerWidth >= 1024 && height ? { height } : undefined}
    >
      {team && (
        <div className={CARD}>
          <span className="font-mono text-[10px] uppercase leading-4 tracking-wider text-[#9c988e]">
            ผู้ร่วมทีม
          </span>
          {/* Overlapped avatars read as "a team" at a glance. Only three fit
              legibly in this half-width card, so the rest collapse into a
              +n disc rather than wrapping to a second row. */}
          <div className="flex -space-x-2">
            {team.slice(0, 3).map((m) => (
              <Initials key={m.name} name={m.name} you={m.you} />
            ))}
            {team.length > 3 && (
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f0ede7] text-[10px] font-bold leading-none text-[#4e4e4e] ring-2 ring-white"
                title={team.slice(3).map((m) => m.name).join(', ')}
              >
                +{team.length - 3}
              </span>
            )}
          </div>
          <div>
            <div className="text-xl font-bold leading-none tracking-tight text-[#21221f]">
              {team.length} คน
            </div>
            <div className="mt-1 truncate text-[11px] leading-4 text-[#4e4e4e]">
              {team.find((m) => m.you)?.role}
            </div>
          </div>
        </div>
      )}

      {downloads && (
        <div className={CARD}>
          <span className="font-mono text-[10px] uppercase leading-4 tracking-wider text-[#9c988e]">
            ยอดดาวน์โหลด
          </span>
          <div>
            <div className="text-xl font-bold leading-none tracking-tight text-[#21221f]">
              {downloads.value}
            </div>
            <div className="mt-1 text-[11px] leading-4 text-[#4e4e4e]">{downloads.note}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// A topic card: one of the four cards that live under a section header. It is
// deliberately quieter and shorter than a section cover — the cover announces
// the section, these announce what is inside it — and opening any one of them
// lands on that topic inside the same scrollable feed.
function TopicCard({ card, index, onOpen }) {
  const dragging = useRef(false)
  const cardRef = useRef(null)
  const hasPills = Array.isArray(card.pills) && card.pills.length > 0
  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      // Suppress the open when the click is the tail of a pill drag.
      onClick={() => !dragging.current && onOpen()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className={`relative flex ${CARD_H} w-full cursor-pointer flex-col overflow-hidden ${CARD_SHAPE} p-6 text-left transition hover:-translate-y-1 active:scale-[0.99] md:p-7`}
      style={{ backgroundColor: card.color }}
      aria-label={card.label}
    >
      <span className="font-mono text-[11px] leading-4 tracking-[0.18em] text-white/60">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h4 className="relative z-10 mt-2 w-fit text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl">
        {card.label}
      </h4>
      {/* A card either carries its own component pills — draggable, exactly like
          the cover cards — or a quiet corner mark, so none reads as a flat
          swatch. */}
      {hasPills ? (
        <PillJar pills={card.pills} dragging={dragging} />
      ) : card.art === 'inspect' ? (
        <CornerArt cardRef={cardRef}>
          <div className="flex h-full w-full gap-[7%]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-full flex-1 rounded-t-md bg-white/[0.13]" />
            ))}
          </div>
        </CornerArt>
      ) : card.art === 'typeface' ? (
        // The Typography panel's own corner mark: the "Aa" set in the face the
        // system documents. No measurement lines — measuring is the Grid card's
        // signature, and repeating it here would say nothing about type.
        <span
          className="pointer-events-none absolute right-6 select-none font-bold leading-none text-white/70"
          style={{
            bottom: 'calc(32px - 0.21em)',
            fontSize: 'min(26vh, 10vw)',
            fontFamily: '"IBM Plex Sans Thai Looped", system-ui, sans-serif',
          }}
        >
          Aa
        </span>
      ) : (
        <span className="pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full bg-white/10" />
      )}
    </div>
  )
}

// The section sheet: full blocks for one tab, slid in over the cards when a card
// is opened. Its own back button returns to the card grid.
function SectionSheet({ tab, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
      className="no-scrollbar fixed inset-0 z-[50] overflow-y-auto bg-[#fafafa]"
    >
      {/* Same header geometry as the MyAtlas profile: title on the same rect,
          back button in the left gutter, identical font sizes. */}
      <div className="page-shell w-full px-4 pb-24 md:pl-[120px] md:pr-12">
        <div className="sticky top-0 z-20 -mx-4 bg-[#fafafa]/90 px-4 pb-4 pt-6 backdrop-blur md:-ml-[120px] md:-mr-12 md:pb-6 md:pl-[120px] md:pr-12 md:pt-[100px]">
          <button
            onClick={onClose}
            aria-label="back"
            className="mb-3 grid size-10 place-items-center rounded-full bg-white shadow-sm transition hover:bg-neutral-100 active:scale-90 md:absolute md:left-[36px] md:top-[116px] md:mb-0 md:size-12"
          >
            <ArrowLeft className="size-5 text-[#33332f] md:size-6" />
          </button>
          <h1 className="truncate pb-3 text-3xl font-bold leading-none tracking-tight text-[#21221f] sm:text-5xl md:text-7xl">
            {tab.label}
          </h1>
        </div>
        <div className="mt-8 max-w-3xl">
          {tab.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'heading':
      return <h4 className="mt-4 text-sm font-bold text-[#33332f] first:mt-0 md:text-base">{block.text}</h4>
    case 'paragraph':
      return <p className="mt-2 text-sm leading-relaxed text-[#4e4e4e]">{block.text}</p>
    case 'list':
      return (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#4e4e4e]">
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      )
    case 'stats':
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {block.items.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white px-3 py-3 text-center">
              <div className="font-bold text-[#21221f]">{s.value}</div>
              <div className="mt-1 text-[11px] text-[#4e4e4e]">{s.label}</div>
            </div>
          ))}
        </div>
      )
    case 'images':
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {block.items.map((im) => (
            <figure key={im.caption}>
              <img src={im.src} alt={im.caption} className="aspect-square w-full rounded-2xl object-cover" />
              <figcaption className="mt-1 text-center text-[11px] text-[#4e4e4e]">{im.caption}</figcaption>
            </figure>
          ))}
        </div>
      )
    case 'quote':
      return (
        <blockquote className="mt-3 rounded-2xl bg-white px-4 py-3">
          <p className="text-sm italic text-[#4e4e4e]">“{block.text}”</p>
          {block.author && <footer className="mt-2 text-xs text-[#4e4e4e]">— {block.author}</footer>}
        </blockquote>
      )
    case 'code':
      return (
        <pre className="no-scrollbar mt-3 overflow-x-auto rounded-2xl bg-neutral-900 p-3 text-xs leading-relaxed text-neutral-100">
          <code>{block.code}</code>
        </pre>
      )
    case 'tags':
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.items.map((t) => (
            <span key={t} className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#4e4e4e]">
              #{t}
            </span>
          ))}
        </div>
      )
    default:
      return null
  }
}

export default function ProjectDetail() {
  const { activeProject: p, closeDetail } = usePortfolio()
  // The logo disc matches the height of the copy beside it. It cannot be done
  // in CSS: a square whose height comes from the row would also widen the row,
  // which feeds back into the copy's height — so measure the copy and size the
  // disc from that.
  const copyRef = useRef(null)
  const [discSize, setDiscSize] = useState(128)
  const [copyH, setCopyH] = useState(0)
  useLayoutEffect(() => {
    const el = copyRef.current
    if (!el) return
    const fit = () => {
      setDiscSize(Math.max(112, Math.min(220, el.offsetHeight)))
      setCopyH(el.offsetHeight)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [p?.id])
  // Which section card is opened into its full sheet (null = the card grid).
  const [openTabId, setOpenTabId] = useState(null)

  // Esc closes the section sheet first, then the whole overlay.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpenTabId((cur) => {
        if (cur) return null
        closeDetail()
        return cur
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeDetail])

  if (!p) return null

  // The reel is every topic in the project, in the order the sections lay them
  // out — so scrolling back from any card reaches the project's first topic and
  // section boundaries are invisible once you are inside.
  const panels = p.tabs.flatMap((t) =>
    t.cards ? t.cards.map((c) => ({ title: c.label, tab: t })) : [{ title: t.label, tab: t }]
  )

  // Project tags shown under the bio — the SAME four the feed section shows,
  // so the profile never introduces tags the home page didn't.
  const tags = (p.techStack ?? []).slice(0, 4)

  return (
    <motion.div
      // No scale on the shell. The title below is positioned to land on the
      // EXACT rect the feed's nav title occupies, so scaling the whole overlay
      // would start it offset and snap it into place — which is what made the
      // entrance feel like a jump cut. Fading the shell in place keeps that one
      // element continuous, and the rest of the page follows it in.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
      className="no-scrollbar fixed inset-0 z-[40] overflow-y-auto bg-[#fafafa]"
    >
      <div className="page-shell w-full px-4 pb-24 md:pl-[120px] md:pr-12">
        {/* Title row — sticky while scrolling. The title lands on the EXACT rect
            the feed's focused nav title occupies (measured: left 120, top 100 at
            md), so entering the profile keeps the title visually in place. The
            back button sits in the left gutter, vertically centred on the title
            (title centre 136 − half of the 48px button = top 112). */}
        <div className="sticky top-0 z-20 -mx-4 bg-[#fafafa]/90 px-4 pb-4 pt-6 backdrop-blur md:-ml-[120px] md:-mr-12 md:pb-6 md:pl-[120px] md:pr-12 md:pt-[100px]">
          <button
            onClick={closeDetail}
            aria-label="back"
            className="mb-3 grid size-10 place-items-center rounded-full bg-white shadow-sm transition hover:bg-neutral-100 active:scale-90 md:absolute md:left-[36px] md:top-[116px] md:mb-0 md:size-12"
          >
            <ArrowLeft className="size-5 text-[#33332f] md:size-6" />
          </button>
          <h1 className="truncate pb-3 text-3xl font-bold leading-none tracking-tight text-[#21221f] sm:text-5xl md:text-7xl">
            {p.title}
          </h1>
        </div>

        {/* Logo + copy. The logo stretches to the height of the copy beside it,
            and every chip — product kind, category, tech tags — shares one row
            under the bio rather than being split across the two columns. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.7, delay: 0.1 }}
          className="mt-8 flex flex-col gap-6 md:mt-10 lg:flex-row lg:items-start lg:gap-8"
        >
          {/* Same treatment as the feed avatar: white circle, thin ring, logo
              inset. `self-stretch` + `aspect-square` makes its height match the
              column beside it, with the width following from the ratio. */}
          <div
            className={`grid size-24 shrink-0 place-items-center overflow-hidden rounded-full ${
              p.avatar ? 'bg-white ring-1 ring-[#dedad2]' : 'bg-neutral-800'
            }`}
            style={
              typeof window !== 'undefined' && window.innerWidth >= 768
                ? { width: discSize, height: discSize }
                : undefined
            }
          >
            {p.avatar ? (
              <img src={p.avatar} alt="" className="size-full object-contain p-5 md:p-8" />
            ) : (
              <span className="text-3xl font-bold text-white">{p.title?.[0]}</span>
            )}
          </div>

          <div ref={copyRef} className="min-w-0 flex-1">
            {/* Full bio, never clamped — the feed teases it, the profile shows it. */}
            <p className="text-sm leading-relaxed text-[#4e4e4e] md:text-base">{p.bio}</p>
            {(p.kind || p.category || tags.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {p.kind && <Badge icon={platformIcon(p.kind)} label={p.kind} />}
                {p.category && (
                  <Badge label={p.category} tone={CATEGORY_TONE[p.category] ?? DEFAULT_TONE} />
                )}
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex h-8 items-center rounded-full bg-white px-4 text-xs font-medium leading-none text-[#4e4e4e] shadow-sm ring-1 ring-[#dedad2] md:h-9 md:text-[13px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <ProfileFacts project={p} height={copyH} />
        </motion.div>

        {/* Sections are back as headings, but the reel behind them is NOT
            sectioned: every card — whichever section it sits in — opens the
            same project-wide reel at its own topic, so you can scroll from the
            last card of one section into the first of the next. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.78, delay: 0.2 }}
          className="mt-10 flex flex-col gap-12"
        >
          {p.tabs.map((tabItem, ti) => (
            <section key={tabItem.id}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-xl font-bold tracking-tight text-[#21221f] md:text-2xl">
                  {tabItem.label}
                </h2>
                <span className="font-mono text-[11px] leading-4 text-[#9c988e]">
                  {tabItem.cards ? `${tabItem.cards.length} topics` : '1 topic'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tabItem.cards ? (
                  tabItem.cards.map((card, ci) => (
                    <TopicCard
                      key={card.id}
                      card={card}
                      index={ci}
                      onOpen={() => setOpenTabId({ start: card.label })}
                    />
                  ))
                ) : (
                  <CoverCard
                    tab={tabItem}
                    index={ti}
                    onOpen={() => setOpenTabId({ start: tabItem.label })}
                  />
                )}
              </div>
            </section>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {openTabId && (
          <FeedSheet
            key="reel"
            title={p.title}
            panels={panels}
            startAt={openTabId.start}
            onClose={() => setOpenTabId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
